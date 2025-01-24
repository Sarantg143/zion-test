const mongoose = require('mongoose');
const User = require('../models/User.model');
const Degree = require('../models/Degree.model');

const updateLessonProgress = async (userId, degreeId, lessonId, subLessonId = null) => {
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    let degreeProgress = user.degreeProgress.find(progress => progress.degreeId.toString() === degreeId);
    if (!degreeProgress) {
      const degree = await Degree.findOne({ _id: degreeId });
      if (!degree) {
        throw new Error('Degree not found');
      }

      degreeProgress = {
        degreeId: degree._id,
        isDegreeComplete: false,
        progressPercentage: 0,
        courses: degree.courses.map(course => ({
          courseId: course.courseId,
          isComplete: false,
          progressPercentage: 0,
          chapters: course.chapters.map(chapter => ({
            chapterId: chapter.chapterId,
            isComplete: false,
            progressPercentage: 0,
            lessons: chapter.lessons.map(lesson => ({
              lessonId: lesson.lessonId,
              isComplete: false,
              progressPercentage: 0,
              subLessons: lesson.subLessons.map(subLesson => ({
                subLessonId: subLesson.subLessonId,
                isComplete: false
              }))
            }))
          }))
        }))
      };

      user.degreeProgress.push(degreeProgress);
    }

    let totalLessons = 0, completedLessons = 0;

    degreeProgress.courses.forEach(course => {
      let totalLessonsInCourse = 0;
      let completedLessonsInCourse = 0;

      course.chapters.forEach(chapter => {
        chapter.lessons.forEach(lesson => {
          let totalSubLessons = lesson.subLessons.length;
          let completedSubLessons = 0;

          if (lesson.lessonId.toString() === lessonId) {
            if (totalSubLessons === 0) {
              lesson.isComplete = true;
              lesson.progressPercentage = 100;
            } else {
              lesson.subLessons.forEach(subLesson => {
                if (subLessonId && subLesson.subLessonId.toString() === subLessonId) {
                  subLesson.isComplete = true;
                }
                if (subLesson.isComplete) completedSubLessons++;
              });

              lesson.isComplete = lesson.subLessons.every(subLesson => subLesson.isComplete);
              lesson.progressPercentage = totalSubLessons === 0 ? 100 : Math.round((completedSubLessons / totalSubLessons) * 100);
            }
          }

          totalLessonsInCourse++;
          if (lesson.isComplete) completedLessonsInCourse++;
        });

        chapter.isComplete = chapter.lessons.every(lesson => lesson.isComplete);
        chapter.progressPercentage = chapter.lessons.length === 0 ? 100 : Math.round(
          (chapter.lessons.filter(lesson => lesson.isComplete).length / chapter.lessons.length) * 100
        );
      });

      course.isComplete = completedLessonsInCourse === totalLessonsInCourse;
      course.progressPercentage = totalLessonsInCourse === 0 ? 100 : Math.round(
        (completedLessonsInCourse / totalLessonsInCourse) * 100
      );

      totalLessons += totalLessonsInCourse;
      completedLessons += completedLessonsInCourse;
    });

    degreeProgress.isDegreeComplete = degreeProgress.courses.every(course => course.isComplete);
    degreeProgress.progressPercentage = totalLessons === 0 ? 100 : Math.round((completedLessons / totalLessons) * 100);

    await user.save();
    return degreeProgress;
  } catch (error) {
    console.error('Error updating progress:', error.message);
    throw new Error(error.message);
  }
};

module.exports = { updateLessonProgress };
