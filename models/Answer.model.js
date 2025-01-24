const mongoose = require('mongoose');
const { Schema } = mongoose;

const TestAnswerSchema = new Schema({
  question: { type: String },
  userAnswer: { type: Schema.Types.Mixed },
  correctAnswer: { type: Schema.Types.Mixed },
  type: { type: String }, // "MCQ" or "QuestionAnswer"
  marks: { type: Number },
  fileUrl: { type: String }, // For file upload 
});

const CourseAnswerSchema = new Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  testAnswers: [TestAnswerSchema],
  marks: { type: Number }, // Total marks for this course
});

const ChapterAnswerSchema = new Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  testAnswers: [TestAnswerSchema],
  marks: { type: Number },
});

const LessonAnswerSchema = new Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  testAnswers: [TestAnswerSchema],
  marks: { type: Number },
});

const SubLessonAnswerSchema = new Schema({
  subLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubLesson' },
  testAnswers: [TestAnswerSchema],
  marks: { type: Number },
});

const AnswerSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  degreeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Degree' },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  courses: [CourseAnswerSchema],
  chapters: [ChapterAnswerSchema],
  lessons: [LessonAnswerSchema],
  subLessons: [SubLessonAnswerSchema],
}, { timestamps: true });

module.exports = mongoose.model('Answer', AnswerSchema);
