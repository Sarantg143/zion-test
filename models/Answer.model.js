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

// -------------------------------------------------------------------------


// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const TestAnswerSchema = new Schema({
//   question: { type: String },
//   userAnswer: { type: Schema.Types.Mixed },
//   correctAnswer: { type: Schema.Types.Mixed },
//   type: { type: String, enum: ["MCQ", "QuestionAnswer"] },
//   marks: { type: Number },
//   fileUrl: { type: String },
// });

// const AttemptSchema = new Schema({
//   answers: [TestAnswerSchema],
//   marksObtained: { type: Number, required: true },
//   attemptedAt: { type: Date, default: Date.now },
//   isBest: { type: Boolean, default: false }
// });

// const CourseAnswerSchema = new Schema({
//   courseId: { type: mongoose.Schema.Types.ObjectId },
//   maxMarks: { type: Number },
//   attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
//   bestMarks: { type: Number, default: 0 }
// });

// function arrayLimit(val) {
//   return val.length <= 5;
// }


// const ChapterAnswerSchema = new Schema({ 
//   courseId: { type: mongoose.Schema.Types.ObjectId},
//   maxMarks: { type: Number},
//   attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
//   bestMarks: { type: Number, default: 0 }
 
// });
// const LessonAnswerSchema = new Schema({ 
//   lessonId: { type: mongoose.Schema.Types.ObjectId },
//   maxMarks: { type: Number},
//   attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
//   bestMarks: { type: Number, default: 0 }
// });
// const SubLessonAnswerSchema = new Schema({ 
//   sublessonId: { type: mongoose.Schema.Types.ObjectId },
//   maxMarks: { type: Number },
//   attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
//   bestMarks: { type: Number, default: 0 }
// });
 
// const AnswerSchema = new Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
//   degreeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Degree' },
//   totalMarks: { type: Number, default: 0 },
//   totalPossibleMarks: { type: Number, default: 0 },
//   percentage: { type: Number, default: 0 },
//   courses: [CourseAnswerSchema],
//   chapters: [ChapterAnswerSchema],
//   lessons: [LessonAnswerSchema],
//   subLessons: [SubLessonAnswerSchema],
// }, { timestamps: true });

// AnswerSchema.pre('save', function(next) {
//   let totalMarks = 0;
//   let totalPossibleMarks = 0;

//   // Calculate marks for all entities
//   const calculate = (entities) => {
//     entities.forEach(entity => {
//       totalMarks += entity.bestMarks;
//       totalPossibleMarks += entity.maxMarks;
//     });
//   };

//   calculate(this.courses);
//   calculate(this.chapters);
//   calculate(this.lessons);
//   calculate(this.subLessons);

//   this.totalMarks = totalMarks;
//   this.totalPossibleMarks = totalPossibleMarks;
//   this.percentage = totalPossibleMarks > 0 ? 
//     Math.round((totalMarks / totalPossibleMarks) * 100 * 100) / 100 : 0;

//   next();
// });

// module.exports = mongoose.model('Answer', AnswerSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const TestAnswerSchema = new Schema({
  question: { type: String },
  userAnswer: { type: Schema.Types.Mixed },
  correctAnswer: { type: Schema.Types.Mixed },
  type: { 
    type: String, 
    enum: ["MCQ", "QuestionAnswer"],
    required: true 
  },
  marks: { type: Number },
  maxMark: {  // Added field for question's maximum marks
    type: Number,
    required: true,
    default: 1  // Default for MCQ questions
  },
  fileUrl: { type: String },
});

const AttemptSchema = new Schema({
  answers: [TestAnswerSchema],
  marksObtained: { type: Number, required: true },
  attemptedAt: { type: Date, default: Date.now },
  isBest: { type: Boolean, default: false }
});

// Helper function for attempt limit validation
function arrayLimit(val) {
  return val.length <= 5;
}

// Simplified entity schemas without maxMarks
const CourseAnswerSchema = new Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
  bestMarks: { type: Number, default: 0 }
});

const ChapterAnswerSchema = new Schema({ 
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
  bestMarks: { type: Number, default: 0 }
});

const LessonAnswerSchema = new Schema({ 
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  attempts: { type: [AttemptSchema], validate: [arrayLimit, 'Maximum 5 attempts allowed'] },
  bestMarks: { type: Number, default: 0 }
});

const SubLessonAnswerSchema = new Schema({ 
  sublessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sublesson' },
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

  // Calculate maxMarks from first attempt's answers
  const calculateEntityMarks = (entities) => {
    entities.forEach(entity => {
      let entityMaxMarks = 0;
      
      if (entity.attempts.length > 0) {
        // Get max marks from first attempt's answers
        entityMaxMarks = entity.attempts[0].answers.reduce(
          (sum, answer) => sum + answer.maxMark,
          0
        );
      }
      
      totalMarks += entity.bestMarks;
      totalPossibleMarks += entityMaxMarks;
    });
  };

  calculateEntityMarks(this.courses);
  calculateEntityMarks(this.chapters);
  calculateEntityMarks(this.lessons);
  calculateEntityMarks(this.subLessons);

  // Calculate percentage with 100% cap
  this.totalMarks = totalMarks;
  this.totalPossibleMarks = totalPossibleMarks;
  this.percentage = totalPossibleMarks > 0
    ? Math.min(Math.round((totalMarks / totalPossibleMarks) * 100 * 100) / 100, 100)
    : 0;

  next();
});

module.exports = mongoose.model('Answer', AnswerSchema);