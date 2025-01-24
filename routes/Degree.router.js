
const mongoose = require("mongoose");
const express = require("express");
const Degree = require("../models/Degree.model");
const { uploadFile , uploadFile2, deleteFileFromStorage } = require("../utils/fileUpload"); // Helper
const { deleteTempFile } = require("../utils/tempUtils");  
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

const router = express.Router();

const upload = multer({dest: path.join(__dirname, "../temp"), 
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

router.post("/", upload.fields([
  { name: "degreeThumbnail", maxCount: 1 }, 
  { name: "courseThumbnails" }, 
  { name: "lessonFiles" }, 
  { name: "subLessonFiles" }
]), async (req, res) => {
  const tempFiles = [];

  try {
    const { title, description, price, courses } = req.body;

    if (!title || !description || !price || !courses) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedCourses = JSON.parse(courses);

    const uploadedDegreeThumbnail = req.files["degreeThumbnail"]?.[0];
    let degreeThumbnailUrl = null;

    if (uploadedDegreeThumbnail) {
      const filePath = uploadedDegreeThumbnail.path;
      tempFiles.push(filePath);
      const fileName = uploadedDegreeThumbnail.originalname;
      degreeThumbnailUrl = await uploadFile(filePath, fileName);
    }

    const uploadedCourseThumbnails = req.files["courseThumbnails"] || [];
    const uploadedLessonFiles = req.files["lessonFiles"] || [];
    const uploadedSubLessonFiles = req.files["subLessonFiles"] || [];

    const courseThumbnailsUrls = await Promise.all(
      uploadedCourseThumbnails.map(async (file) => {
        const filePath = file.path;
        tempFiles.push(filePath);
        const fileName = file.originalname;
        return await uploadFile(filePath, fileName);
      })
    );

    const lessonFilesUrls = await Promise.all(
      uploadedLessonFiles.map(async (file) => {
        const filePath = file.path;
        tempFiles.push(filePath);
        const fileName = file.originalname;
        return await uploadFile2(filePath, fileName) || { url: null, type: null }; // Default to null metadata
      })
    );

    const subLessonFilesUrls = await Promise.all(
      uploadedSubLessonFiles.map(async (file) => {
        const filePath = file.path;
        tempFiles.push(filePath);
        const fileName = file.originalname;
        return await uploadFile2(filePath, fileName) || { url: null, type: null }; // Default to null metadata
      })
    );

    let lessonIndex = 0;
    let subLessonIndex = 0;

    const newDegree = new Degree({
      degreeId: new mongoose.Types.ObjectId(),
      title,
      description,
      price,
      thumbnail: degreeThumbnailUrl,
      courses: parsedCourses.map((course, courseIndex) => ({
        courseId: new mongoose.Types.ObjectId(),
        title: course.title,
        description: course.description,
        thumbnail: courseThumbnailsUrls[courseIndex] || null,
        test: course.test || [],
        overviewPoints: course.overviewPoints || [],
        chapters: course.chapters.map((chapter) => ({
          chapterId: new mongoose.Types.ObjectId(),
          title: chapter.title,
          description: chapter.description || null,
          test: chapter.test || [],
          lessons: chapter.lessons.map((lesson) => {
            const lessonFileMetadata = lessonFilesUrls[lessonIndex] || { url: null, type: null };
            lessonIndex++;
            return {
              lessonId: new mongoose.Types.ObjectId(),
              title: lesson.title || null,
              file: lessonFileMetadata.url,
              fileType: lessonFileMetadata.type,
              test: lesson.test || [],
              subLessons: (lesson.subLessons || []).map((subLesson) => {
                const subLessonFileMetadata = subLessonFilesUrls[subLessonIndex] || { url: null, type: null };
                subLessonIndex++;
                return {
                  subLessonId: new mongoose.Types.ObjectId(),
                  title: subLesson.title || null,
                  file: subLessonFileMetadata.url,
                  fileType: subLessonFileMetadata.type,
                  test: subLesson.test || [],
                };
              }),
            };
          }),
        })),
      })),
    });



    await newDegree.save();
    res.status(201).json({ message: "Degree created successfully", degree: newDegree });
  } catch (error) {
    console.error("Error adding degree:", error);
    res.status(500).json({ message: "Failed to create degree", error: error.message });
  } finally {
    await Promise.all(tempFiles.map(async (filePath) => {
      try {
        const fileExists = await fs.promises.access(filePath).then(() => true).catch(() => false);
        if (fileExists) {
          await fs.promises.unlink(filePath);
          console.log(`Temporary file deleted: ${filePath}`);
        }
      } catch (error) {
        console.error(`Failed to delete temp file: ${filePath}`, error);
      }
    }));
  }
});



router.put("/:degreeId", upload.fields([
  { name: "degreeThumbnail", maxCount: 1 },
  { name: "courseThumbnails" },
  { name: "lessonFiles" },
  { name: "subLessonFiles" }
]), async (req, res) => {
  const tempFiles = [];

  try {
    const { degreeId } = req.params;
    const { title, description, price, courses, sublessonIndexes } = req.body;

    if (!courses) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedCourses = JSON.parse(courses);

    let parsedIndexes = [];
    try {
      parsedIndexes = JSON.parse(req.body.sublessonIndexes || "[]");
      console.log("Parsed Sublesson Indexes:", parsedIndexes);
    } catch (error) {
      console.error("Failed to parse sublessonIndexes:", error);
      return res.status(400).json({ message: "Invalid sublessonIndexes format" });
    }
    
    // Finding the existing degree by degreeId
    const degree = await Degree.findById(degreeId);
    if (!degree) {
      return res.status(404).json({ message: "Degree not found" });
    }

    // Handle degree thumbnail (if provided)
    const uploadedDegreeThumbnail = req.files["degreeThumbnail"]?.[0];
    let degreeThumbnailUrl = degree.thumbnail; // Retain old thumbnail unless updated
    if (uploadedDegreeThumbnail) {
      const filePath = uploadedDegreeThumbnail.path;
      tempFiles.push(filePath);
      const fileName = uploadedDegreeThumbnail.originalname;
      degreeThumbnailUrl = await uploadFile(filePath, fileName);
    }

    // Handle course thumbnails (if provided)
    const uploadedCourseThumbnails = req.files["courseThumbnails"] || [];
    const courseThumbnailsUrls = await Promise.all(
      uploadedCourseThumbnails.map(async (file, index) => {
        const filePath = file.path;
        tempFiles.push(filePath);
        const fileName = file.originalname;
        return await uploadFile(filePath, fileName) || degree.courses[index].thumbnail;  // Retain old thumbnail if not provided
      })
    );

    // Handle lesson files (if provided)
    const uploadedLessonFiles = req.files["lessonFiles"] || [];
    const lessonFilesUrls = await Promise.all(
      uploadedLessonFiles.map(async (file, lessonIndex) => {
        const filePath = file.path;
        tempFiles.push(filePath);
        const fileName = file.originalname;
        return await uploadFile2(filePath, fileName) || degree.courses[lessonIndex]?.chapters[lessonIndex]?.lessons[lessonIndex]?.file;  // Retain old file if not provided
      })
    );

    // Handle sublesson files (if provided)
    const uploadedSubLessonFiles = req.files["subLessonFiles"] || [];
    const subLessonFilesUrls = [];

// Handle sublesson files (if provided)
if (uploadedSubLessonFiles.length > 0 && parsedIndexes.length > 0) {
  let globalSubLessonIndex = 0; // Start a global counter for sublesson indexing

  await Promise.all(
    uploadedSubLessonFiles.map(async (file, index) => {
      // Find the target sublesson index from parsedIndexes
      const sublessonIndex = parsedIndexes[index];
      if (sublessonIndex !== undefined) {
        let found = false;

        // Iterate through the courses, chapters, lessons, and subLessons
        degree.courses = degree.courses.map((course) => ({
          ...course,
          chapters: course.chapters.map((chapter) => ({
            ...chapter,
            lessons: chapter.lessons.map((lesson) => ({
              ...lesson,
              subLessons: lesson.subLessons.map((subLesson) => {
                if (globalSubLessonIndex === sublessonIndex && !found) {
                  // Process the uploaded file
                  const filePath = file.path;
                  tempFiles.push(filePath); // Store for cleanup
                  const fileName = file.originalname;
                  const fileType = file.mimetype; // Get the file type

                  // Upload the file
                  const uploadResult = uploadFile2(filePath, fileName);
                  if (uploadResult && uploadResult.url) {
                    console.log(`Uploaded file for subLesson ${sublessonIndex}: ${uploadResult.url}`);
                    found = true; // Mark the match as found
                    return {
                      ...subLesson,
                      file: uploadResult.url, // Update the file URL
                      fileType, // Update the file type
                    };
                  }
                }
                globalSubLessonIndex++; // Increment the global index
                return subLesson; // Return unchanged subLesson
              }),
            })),
          })),
        }));
      }
    })
  );
}



    // const uploadedSubLessonFiles = req.files["subLessonFiles"] || [];
    // const subLessonFilesUrls = []; // Array to store updated URLs
    
    // if (uploadedSubLessonFiles.length > 0 && parsedIndexes.length > 0) {
    //   // Loop through the files and their corresponding indexes
    //   await Promise.all(
    //     uploadedSubLessonFiles.map(async (file, index) => {
    //       const sublessonIndex = parsedIndexes[index]; // Get the specific index
    //       if (sublessonIndex !== undefined) {
    //         const filePath = file.path;
    //         tempFiles.push(filePath); // Store temporary path for cleanup
    //         const fileName = file.originalname;
    
    //         // Upload the file
    //         const uploadResult = await uploadFile2(filePath, fileName);
    //         console.log(`File uploaded for sublesson ${sublessonIndex}:`, uploadResult);
    
    //         if (uploadResult && uploadResult.url) {
    //           subLessonFilesUrls[sublessonIndex] = uploadResult.url; // Assign uploaded URL to the specific sublesson
    //         }
    //       }
    //     })
    //   );
    // }
    
    console.log("Mapped SubLesson Files URLs:", subLessonFilesUrls);
    console.log("Parsed Indexes:", parsedIndexes);
    console.log("Uploaded Files:", uploadedSubLessonFiles.map(file => file.originalname));




    // Update the degree details with the updated fields
    degree.title = title || degree.title;  // Retain old title if not provided
    degree.description = description || degree.description;  // Retain old description if not provided
    degree.price = price || degree.price;  // Retain old price if not provided
    degree.thumbnail = degreeThumbnailUrl;

    degree.courses = parsedCourses.map((course, courseIndex) => ({
      ...degree.courses[courseIndex],
      title: course.title || degree.courses[courseIndex].title,  // Retain old title if not provided
      description: course.description || degree.courses[courseIndex].description,  // Retain old description if not provided
      thumbnail: courseThumbnailsUrls[courseIndex] || degree.courses[courseIndex].thumbnail,
      test: course.test || degree.courses[courseIndex].test,
      overviewPoints: course.overviewPoints || degree.courses[courseIndex].overviewPoints,
      chapters: (course.chapters || []).map((chapter, chapterIndex) => ({
        ...degree.courses[courseIndex].chapters[chapterIndex],
        title: chapter.title || degree.courses[courseIndex].chapters[chapterIndex].title,  // Retain old chapter title if not provided
        description: chapter.description || degree.courses[courseIndex].chapters[chapterIndex].description,
        test: chapter.test || degree.courses[courseIndex].chapters[chapterIndex].test,
        lessons: (chapter.lessons || []).map((lesson, lessonIndex) => ({
          ...degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex],
          title: lesson.title || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].title,  // Retain old lesson title if not provided
          file: lessonFilesUrls[lessonIndex] || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].file,  // Retain old file if not provided
          fileType: lesson.fileType || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].fileType,
          test: lesson.test || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].test,
          subLessons: (lesson.subLessons || []).map((subLesson, subLessonIndex) => ({
            ...degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].subLessons[subLessonIndex],
            title: subLesson.title || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].subLessons[subLessonIndex].title,
            file: subLessonFilesUrls[subLessonIndex] || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].subLessons[subLessonIndex].file, // Use new file URL or retain the old one
            fileType: subLesson.fileType || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].subLessons[subLessonIndex].fileType,
            test: subLesson.test || degree.courses[courseIndex].chapters[chapterIndex].lessons[lessonIndex].subLessons[subLessonIndex].test,
          }))
                   
        }))
      }))
    }));

    await degree.save();

    res.status(200).json({ message: "Degree updated successfully", degree });
  } catch (error) {
    console.error("Error updating degree:", error);
    res.status(500).json({ message: "Failed to update degree", error: error.message });
  } finally {
    await Promise.all(tempFiles.map(async (filePath) => {
      try {
        const fileExists = await fs.promises.access(filePath).then(() => true).catch(() => false);
        if (fileExists) {
          await fs.promises.unlink(filePath);
          console.log(`Temporary file deleted: ${filePath}`);
        }
      } catch (error) {
        console.error(`Failed to delete temp file: ${filePath}`, error);
      }
    }));
  }
});




router.get('/', async (req, res) => {
    try {
      const degrees = await Degree.find();
      res.status(200).json({
        message: "All degrees fetched successfully",
        degrees,
      });
    } catch (error) {
      console.error("Error fetching degrees:", error);
      res.status(500).json({
        message: "Failed to fetch degrees",
        error: error.message,
      });
    }
  });
  
  
  router.get('/:degreeId', async (req, res) => {
    try {
      const { degreeId } = req.params;
  
      const degree = await Degree.findById(degreeId);
  
      if (!degree) {
        return res.status(404).json({ message: "Degree not found" });
      }
  
      res.status(200).json({
        message: "Degree fetched successfully",
        degree,
      });
    } catch (error) {
      console.error("Error fetching degree by ID:", error);
      res.status(500).json({
        message: "Failed to fetch degree",
        error: error.message,
      });
    }
  });
  

  router.get('/:degreeId/:courseId', async (req, res) => {
    try {
      const { degreeId, courseId } = req.params;
  
      const degree = await Degree.findById(degreeId);
  
      if (!degree) {
        return res.status(404).json({ message: "Degree not found" });
      }
      const course = degree.courses.find(c => c._id.toString() === courseId);
  
      if (!course) {
        return res.status(404).json({ message: "Course not found in this degree" });
      }
  
      res.status(200).json({
        message: "Course fetched successfully",
        course,
      });
    } catch (error) {
      console.error("Error fetching course by ID:", error);
      res.status(500).json({
        message: "Failed to fetch course",
        error: error.message,
      });
    }
  });

  router.delete("/:degreeId", async (req, res) => {
    try {
      const { degreeId } = req.params;
      const degree = await Degree.findById(degreeId);
      if (!degree) {
        return res.status(404).json({ message: "Degree not found" });
      }
      if (degree.thumbnail) {
        try {
          await deleteFileFromStorage(degree.thumbnail);
        } catch (error) {
          console.error(`Failed to delete degree thumbnail: ${degree.thumbnail}`, error);
        }
      }

      for (const course of degree.courses) {
        if (course.thumbnail) {
          try {
            await deleteFileFromStorage(course.thumbnail);
          } catch (error) {
            console.error(`Failed to delete course thumbnail: ${course.thumbnail}`, error);
          }
        }
  
        for (const chapter of course.chapters) {
          for (const lesson of chapter.lessons) {
            if (lesson.file) {
              try {
                await deleteFileFromStorage(lesson.file);
              } catch (error) {
                console.error(`Failed to delete lesson file: ${lesson.file}`, error);
              }
            }
  
            for (const subLesson of lesson.subLessons) {
              if (subLesson.file) {
                try {
                  await deleteFileFromStorage(subLesson.file);
                } catch (error) {
                  console.error(`Failed to delete sublesson file: ${subLesson.file}`, error);
                }
              }
            }
          }
        }
      }
      // Delete degree from database
      await Degree.findByIdAndDelete(degreeId);
  
      res.status(200).json({ message: "Degree deleted successfully" });
    } catch (error) {
      console.error("Error deleting degree:", error);
      res.status(500).json({
        message: "Failed to delete degree",
        error: error.message,
      });
    }
  });
  


module.exports = router;

