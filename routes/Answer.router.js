const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { uploadFile } = require('../utils/fileUpload');
const Answer = require('../models/Answer.model'); // Ensure Answer model is imported
const Degree = require('../models/Degree.model'); // Ensure Degree model is imported

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "../temp"),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});



router.get("/", async (req, res) => {
  try {
    const answers = await Answer.find();
    res.status(200).json({ message: "Answers retrieved successfully", answers });
  } catch (error) {
    console.error("Error retrieving answers:", error);
    res.status(500).json({ message: "Failed to retrieve answers", error: error.message });
  }
});


router.delete("/:answerId", async (req, res) => {
  try {
    const { answerId } = req.params;

    const deletedAnswer = await Answer.findByIdAndDelete(answerId);
    if (!deletedAnswer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    res.status(200).json({ message: "Answer deleted successfully", deletedAnswer });
  } catch (error) {
    console.error("Error deleting answer:", error);
    res.status(500).json({ message: "Failed to delete answer", error: error.message });
  }
});


router.post('/submit', upload.array("answerFiles"), async (req, res) => {
  const tempFiles = [];
  try {
      const { userId, degreeId, courses, chapters, lessons, subLessons } = req.body;
      if (!userId || !degreeId) {
          return res.status(400).json({ message: 'Missing required fields' });
      }

      let answerDoc = await Answer.findOne({ userId, degreeId });
      if (!answerDoc) {
          answerDoc = new Answer({ userId, degreeId, courses: [], chapters: [], lessons: [], subLessons: [] });
      }

      const parsedCourses = Array.isArray(courses) ? courses : JSON.parse(courses || "[]");
      const parsedChapters = Array.isArray(chapters) ? chapters : JSON.parse(chapters || "[]");
      const parsedLessons = Array.isArray(lessons) ? lessons : JSON.parse(lessons || "[]");
      const parsedSubLessons = Array.isArray(subLessons) ? subLessons : JSON.parse(subLessons || "[]");

      const uploadedFiles = req.files || [];
      const answerFilesUrls = await Promise.all(
          uploadedFiles.map(async (file) => {
              tempFiles.push(file.path);
              return await uploadFile(file.path, file.originalname);
          })
      );

      const processEntities = async (entities, fieldName, idField) => {
          for (const entityData of entities) {
              const entityId = entityData[idField];
              if (!entityId) continue;

              const attemptsData = entityData.attempts || [];
              let entity = answerDoc[fieldName].find(e => e[idField] && e[idField].equals(entityId));

              if (!entity) {
                  entity = {
                      [idField]: entityId,
                      maxMarks: entityData.maxMarks || 0,
                      attempts: [],
                      bestMarks: 0
                  };
                  answerDoc[fieldName].push(entity);
              }

              for (const attemptData of attemptsData) {
                  const attempt = {
                      answers: attemptData.answers || [],
                      marksObtained: attemptData.answers.reduce((sum, ans) => sum + (ans.marks || 0), 0),
                      attemptedAt: new Date(),
                      isBest: false
                  };
                  entity.attempts.push(attempt);
                  entity.bestMarks = Math.max(entity.bestMarks, attempt.marksObtained);
              }
          }
      };

      await processEntities(parsedCourses, 'courses', 'courseId');
      await processEntities(parsedChapters, 'chapters', 'chapterId');
      await processEntities(parsedLessons, 'lessons', 'lessonId');
      await processEntities(parsedSubLessons, 'subLessons', 'sublessonId');

      await answerDoc.save();
      res.status(201).json({ message: 'Answers submitted successfully', answer: answerDoc });
  } catch (error) {
      res.status(500).json({ message: 'Submission failed', error: error.message });
  } finally {
      await Promise.all(
          tempFiles.map(async (path) => {
              try { await fs.unlink(path); } catch (err) { console.error(err); }
          })
      );
  }
});

router.get('/user/:userId/:degreeId', async (req, res) => {
  try {
      const { userId, degreeId } = req.params;
      const answerDoc = await Answer.findOne({ userId, degreeId });
      if (!answerDoc) {
          return res.status(404).json({ message: 'Answers not found' });
      }
      res.status(200).json(answerDoc);
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/update-marks/:userId/:degreeId', async (req, res) => {
    try {
        const { userId, degreeId } = req.params;
        const { updatedMarks } = req.body; 

        if (!updatedMarks || Object.keys(updatedMarks).length === 0) {
            return res.status(400).json({ message: "No marks provided for update" });
        }

        const answer = await Answer.findOne({ userId, degreeId });

        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        const updateMarksDirectly = (entities) => {
            entities.forEach(entity => {
                entity.attempts.forEach(attempt => {
                    attempt.answers.forEach(answer => {
                        if (answer.type === 'QuestionAnswer' && updatedMarks[answer._id]) {
                            console.log(`Admin updating marks for answer ID: ${answer._id}`);
                            answer.marks = updatedMarks[answer._id]; 
                        }
                    });
                });

                entity.bestMarks = entity.attempts.reduce((maxMarks, attempt) => {
                    let attemptTotal = attempt.answers.reduce((sum, ans) => sum + ans.marks, 0);
                    return Math.max(maxMarks, attemptTotal);
                }, 0);
            });
        };

        updateMarksDirectly(answer.courses);
        updateMarksDirectly(answer.chapters);
        updateMarksDirectly(answer.lessons);
        updateMarksDirectly(answer.subLessons);

        let totalMarks = 0;
        let totalPossibleMarks = 0;

        const calculateEntityMarks = (entities) => {
            entities.forEach(entity => {
                if (entity.attempts.length > 0) {
                    let entityMaxMarks = entity.attempts[0].answers.reduce(
                        (sum, answer) => sum + answer.maxMark, 0
                    );
                    totalMarks += entity.bestMarks; 
                    totalPossibleMarks += entityMaxMarks;
                }
            });
        };

        calculateEntityMarks(answer.courses);
        calculateEntityMarks(answer.chapters);
        calculateEntityMarks(answer.lessons);
        calculateEntityMarks(answer.subLessons);

        answer.totalMarks = totalMarks;
        answer.totalPossibleMarks = totalPossibleMarks;
        answer.percentage = totalPossibleMarks > 0 
            ? Math.min(Math.round((totalMarks / totalPossibleMarks) * 100), 100)
            : 0;

        await answer.save();
        res.status(200).json({ message: 'Marks updated successfully', answer });

    } catch (error) {
        console.error("Error updating marks:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});



module.exports = router;
