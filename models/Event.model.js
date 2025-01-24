const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  duration: {
    type: Number, 
  },
});


EventSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    this.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); 
  }
  next();
});

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;