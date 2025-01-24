const mongoose = require("mongoose");

const DegreeProgressSchema = new mongoose.Schema({
  degreeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Degree', required: true },
  courses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, required: true },
      isComplete: { type: Boolean, default: false },
      progressPercentage: { type: Number, default: 0 },
      chapters: [
        {
          chapterId: { type: mongoose.Schema.Types.ObjectId, required: true },
          isComplete: { type: Boolean, default: false },
          progressPercentage: { type: Number, default: 0 },
          lessons: [
            {
              lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
              isComplete: { type: Boolean, default: false },
              progressPercentage: { type: Number, default: 0 },
              subLessons: [
                {
                  subLessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
                  isComplete: { type: Boolean, default: false }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  isDegreeComplete: { type: Boolean, default: false },
  progressPercentage: { type: Number, default: 0 }
});

module.exports = DegreeProgressSchema;
