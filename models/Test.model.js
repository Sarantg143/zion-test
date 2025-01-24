const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
    degreeId: { type: mongoose.Schema.Types.ObjectId, ref: "Degree", required: true },
    title: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    subLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLesson" },

    questions: [
        {
            questionText: { type: String, required: true },
            questionType: {
                type: String,
                enum: ["MCQ", "Typed"], 
                required: true
            },
            options: [{ type: String }],  
            correctAnswer: { type: mongoose.Schema.Types.Mixed },   
        }
    ],

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Test", testSchema);
