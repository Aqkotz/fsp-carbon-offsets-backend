const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  description: { type: String },
  theme: { type: String, required: true },
  streak: [{
    completed: { type: String, enum: ['completed', 'failed'], required: true },
    date: { type: Date, default: Date.now },
  }],
  streakLength: { type: Number, default: 0 },
  currentWeek: [{
    completed: { type: String, enum: ['completed', 'failed', 'future', 'past'], required: true },
    date: { type: Date, default: Date.now },
  }],
  streakData_isStale: { type: Boolean, default: true },
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
