const mongoose = require('mongoose');

const CompletedLessonSchema = mongoose.Schema({
    userId: {
        type: String,
        required: [true, "User ID is required"],
    },
    degreeId: {
        type: String,
        required: [true, "Degree ID is required"],
    },
    courseId: {
        type: String,
        required: [true, "Course ID is required"],
    },
    completedLessons: {
        type: [String],
        default: [],
    },
});

// Create a compound index to enforce uniqueness for userId and courseId
CompletedLessonSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Completed = mongoose.model("CompletedLesson", CompletedLessonSchema);

module.exports = Completed;
