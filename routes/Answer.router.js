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

// Route to submit answers
router.post("/submit", upload.array("answerFiles"), async (req, res) => {
    const tempFiles = [];
    
    try {
      const { userId, degreeId, courses, chapters, lessons, subLessons } = req.body;
  
      if (!userId || !degreeId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      let parsedCourses, parsedChapters, parsedLessons, parsedSubLessons;
      try {
        parsedCourses = JSON.parse(courses || "[]");
        parsedChapters = JSON.parse(chapters || "[]");
        parsedLessons = JSON.parse(lessons || "[]");
        parsedSubLessons = JSON.parse(subLessons || "[]");
      } catch (error) {
        return res.status(400).json({ message: "Invalid JSON format" });
      }
  
      const uploadedFiles = req.files || [];
      const answerFilesUrls = await Promise.all(
        uploadedFiles.map(async (file) => {
          tempFiles.push(file.path);  
          return await uploadFile(file.path, file.originalname);
        })
      );
  
      const attachFilesToAnswers = (answers) => {
        let fileIndex = 0;
        answers.forEach((item) => {
          if (item.test && item.test.type === "QuestionAnswer") {
            item.test.questions.forEach((question) => {
              if (!question.file && fileIndex < answerFilesUrls.length) {
                question.file = answerFilesUrls[fileIndex];
                fileIndex++;
              }
            });
          }
        });
      };
  
      // Attach files to respective test answers
      attachFilesToAnswers(parsedCourses);
      attachFilesToAnswers(parsedChapters);
      attachFilesToAnswers(parsedLessons);
      attachFilesToAnswers(parsedSubLessons);
  
      const newAnswer = new Answer({
        userId,
        degreeId,
        courses: parsedCourses,
        chapters: parsedChapters,
        lessons: parsedLessons,
        subLessons: parsedSubLessons,
        overallMarks: 0,  // Placeholder for marks, updated after evaluation
        percentage: 0,
      });
  
      await newAnswer.save();
  
      res.status(201).json({ message: "Test answers submitted successfully", answer: newAnswer });
    } catch (error) {
      console.error("Error submitting test answers:", error);
      res.status(500).json({ message: "Failed to submit test answers", error: error.message });
    } finally {
      // Cleanup temporary files
      await Promise.all(
        tempFiles.map(async (filePath) => {
          try {
            const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
            if (fileExists) {
              await fs.unlink(filePath);
              console.log(`Temporary file deleted: ${filePath}`);
            }
          } catch (error) {
            console.error(`Failed to delete temp file: ${filePath}`, error);
          }
        })
      );
    }
  });
  
// Route to update marks and recalculate total
router.post('/update-marks', async (req, res) => {
  try {
      const { answerId, updatedAnswers } = req.body;

      if (!answerId || !updatedAnswers) {
          return res.status(400).json({ message: 'Missing required fields' });
      }

      const answerDoc = await Answer.findById(answerId);
      if (!answerDoc) {
          return res.status(404).json({ message: 'Answer not found' });
      }

      // Parse updatedAnswers if it's a string, else use it directly
      const updatedData = typeof updatedAnswers === 'string' ? JSON.parse(updatedAnswers) : updatedAnswers;

      // Update marks within nested subLessons.testAnswers
      answerDoc.subLessons.forEach(subLesson => {
          const updatedSubLesson = updatedData.subLessons.find(sl => sl.subLessonId === subLesson.subLessonId);
          if (updatedSubLesson) {
              subLesson.testAnswers.forEach(answer => {
                  const updatedAnswer = updatedSubLesson.testAnswers.find(ua => ua._id === String(answer._id));
                  if (updatedAnswer) {
                      answer.marks = updatedAnswer.marks;
                  }
              });
              subLesson.marks = subLesson.testAnswers.reduce((sum, testAnswer) => sum + (testAnswer.marks || 0), 0); // Update subLesson marks
          }
      });

      // Recalculate total marks and percentage
      const { overallMarks, percentage } = recalculateMarksAndPercentage(answerDoc);
      answerDoc.totalMarks = overallMarks;
      answerDoc.percentage = percentage;

      await answerDoc.save();
      res.status(200).json({ message: 'Marks updated successfully', updatedAnswer: answerDoc });
  } catch (error) {
      console.error('Error updating marks:', error);
      res.status(500).json({ message: 'Failed to update marks', error: error.message });
  }
});


function calculateOverallMarks(data) {
  let totalMarks = 0;
  const sumMarks = (items) => {
    return items.reduce((sum, item) => {
      if (item.testAnswers) {
        sum += item.testAnswers.reduce((innerSum, ta) => innerSum + (ta.marks || 0), 0);
      } else {
        sum += item.marks || 0;
      }
      return sum;
    }, 0);
  };

  totalMarks += sumMarks(data.courses || []);
  totalMarks += sumMarks(data.chapters || []);
  totalMarks += sumMarks(data.lessons || []);
  totalMarks += sumMarks(data.subLessons || []);

  return totalMarks;
}

function recalculateMarksAndPercentage(answerDoc) {
  const overallMarks = calculateOverallMarks(answerDoc);
  const maxPossibleMarks = 100; // Customize based on your scoring system
  const percentage = (overallMarks / maxPossibleMarks) * 100;
  return { overallMarks, percentage };
}


router.get("/", async (req, res) => {
  try {
    const answers = await Answer.find();
    res.status(200).json({ message: "Answers retrieved successfully", answers });
  } catch (error) {
    console.error("Error retrieving answers:", error);
    res.status(500).json({ message: "Failed to retrieve answers", error: error.message });
  }
});

// GET answers by userId
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const answers = await Answer.find({ userId });
    if (!answers || answers.length === 0) {
      return res.status(404).json({ message: "No answers found for this user" });
    }
    res.status(200).json({ message: "Answers retrieved successfully", answers });
  } catch (error) {
    console.error("Error retrieving answers by userId:", error);
    res.status(500).json({ message: "Failed to retrieve answers", error: error.message });
  }
});

// PUT to update an answer
router.put("/:answerId", async (req, res) => {
  try {
    const { answerId } = req.params;
    const updateData = req.body;

    const updatedAnswer = await Answer.findByIdAndUpdate(answerId, updateData, { new: true });
    if (!updatedAnswer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    res.status(200).json({ message: "Answer updated successfully", updatedAnswer });
  } catch (error) {
    console.error("Error updating answer:", error);
    res.status(500).json({ message: "Failed to update answer", error: error.message });
  }
});

// DELETE an answer
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


module.exports = router;
