// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const TestAnswerSchema = new Schema({
//   question: { type: String },
//   userAnswer: { type: Schema.Types.Mixed },
//   correctAnswer: { type: Schema.Types.Mixed },
//   type: { type: String }, // "MCQ" or "QuestionAnswer"
//   marks: { type: Number },
//   fileUrl: { type: String }, // For file upload 
// });

// const CourseAnswerSchema = new Schema({
//   courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
//   testAnswers: [TestAnswerSchema],
//   marks: { type: Number }, // Total marks for this course
// });

// const ChapterAnswerSchema = new Schema({
//   chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
//   testAnswers: [TestAnswerSchema],
//   marks: { type: Number },
// });

// const LessonAnswerSchema = new Schema({
//   lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
//   testAnswers: [TestAnswerSchema],
//   marks: { type: Number },
// });

// const SubLessonAnswerSchema = new Schema({
//   subLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubLesson' },
//   testAnswers: [TestAnswerSchema],
//   marks: { type: Number },
// });

// const AnswerSchema = new Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
//   degreeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Degree' },
//   totalMarks: { type: Number, default: 0 },
//   percentage: { type: Number, default: 0 },
//   courses: [CourseAnswerSchema],
//   chapters: [ChapterAnswerSchema],
//   lessons: [LessonAnswerSchema],
//   subLessons: [SubLessonAnswerSchema],
// }, { timestamps: true });

// module.exports = mongoose.model('Answer', AnswerSchema);



const mongoose = require('mongoose');
const { Schema } = mongoose;

const TestAnswerSchema = new Schema({
  question: { type: String },
  userAnswer: { type: Schema.Types.Mixed },
  correctAnswer: { type: Schema.Types.Mixed },
  type: { type: String, enum: ["MCQ", "QuestionAnswer"] },
  marks: { type: Number },
  fileUrl: { type: String },
});

const AttemptSchema = new Schema({
  answers: [TestAnswerSchema],
  marksObtained: { type: Number, required: true },
  attemptedAt: { type: Date, default: Date.now },
  isBest: { type: Boolean, default: false }
});

const CourseAnswerSchema = new Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  maxMarks: { type: Number, required: true },
  attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
  bestMarks: { type: Number, default: 0 }
});

function arrayLimit(val) {
  return val.length <= 5;
}


const ChapterAnswerSchema = new Schema({ 
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  maxMarks: { type: Number, required: true },
  attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
  bestMarks: { type: Number, default: 0 }
 
});
const LessonAnswerSchema = new Schema({ 
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  maxMarks: { type: Number, required: true },
  attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
  bestMarks: { type: Number, default: 0 }
});
const SubLessonAnswerSchema = new Schema({ 
  sublessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sublesson' },
  maxMarks: { type: Number, required: true },
  attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
  bestMarks: { type: Number, default: 0 }
});

const AnswerSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  degreeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Degree' },
  totalMarks: { type: Number, default: 0 },
  totalPossibleMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  courses: [CourseAnswerSchema],
  chapters: [ChapterAnswerSchema],
  lessons: [LessonAnswerSchema],
  subLessons: [SubLessonAnswerSchema],
}, { timestamps: true });

AnswerSchema.pre('save', function(next) {
  let totalMarks = 0;
  let totalPossibleMarks = 0;

  // Calculate marks for all entities
  const calculate = (entities) => {
    entities.forEach(entity => {
      totalMarks += entity.bestMarks;
      totalPossibleMarks += entity.maxMarks;
    });
  };

  calculate(this.courses);
  calculate(this.chapters);
  calculate(this.lessons);
  calculate(this.subLessons);

  this.totalMarks = totalMarks;
  this.totalPossibleMarks = totalPossibleMarks;
  this.percentage = totalPossibleMarks > 0 ? 
    Math.round((totalMarks / totalPossibleMarks) * 100 * 100) / 100 : 0;

  next();
});

module.exports = mongoose.model('Answer', AnswerSchema);