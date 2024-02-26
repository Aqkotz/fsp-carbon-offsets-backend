import mongoose from 'mongoose';

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
  carbonReduction: { type: Number, default: 0 },
  totalCarbonReduction: { type: Number, default: 0 },
  data_isStale: { type: Boolean, default: true },
});

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
