const mongoose = require("mongoose");
const { Schema } = mongoose;

const TestSchema = new Schema({
  type: {
    type: String, // "MCQ" or "QuestionAnswer"
    required: false,
  },
  questions: [
    {
      question: { type: String, required: false },
      options: [{ type: String }],
      correctAnswer: { type: String },
    },
  ],
});

// SubLesson Schema
const subLessonSchema = new Schema(
  {
    subLessonId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: { type: String, required: false },
    file: { type: String },
    fileType: { type: String },
    duration: { type: Number },
    test: [TestSchema],
  },
  { timestamps: true }
);

// Lesson Schema
const lessonSchema = new Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: { type: String, required: false },
    file: { type: String },
    fileType: { type: String },
    duration: { type: Number },
    subLessons: { type: [subLessonSchema], default: [] },
    test: [TestSchema],
  },
  { timestamps: true }
);

// Chapter Schema
const chapterSchema = new Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: { type: String, required: true },
    description: { type: String },
    lessons: { type: [lessonSchema], default: [] },  // Array of lessons
    test: [TestSchema],
  },
  { timestamps: true }
);

// Course Schema
const courseSchema = new Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String }, // URL for course thumbnail
    overviewPoints: [
      {
        title: { type: String },
        description: { type: String },
      },
    ],
    chapters: [chapterSchema], // Array of chapters
    test: [TestSchema],
  },
  { timestamps: true }
);

// Degree Schema
const degreeSchema = new Schema(
  {
    degreeId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String }, 
    price: { type: Number, required: true },
    courses: [courseSchema], 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Degree", degreeSchema);
