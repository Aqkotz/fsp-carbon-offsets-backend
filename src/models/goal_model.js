const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  description: { type: String },
  completedToday: { type: Boolean, default: false },
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
