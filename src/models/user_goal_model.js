import mongoose, { Schema } from 'mongoose';

const UserGoalSchema = new Schema({
  description: { type: String },
  completedToday: { type: Boolean, default: false },
  streak: { type: Number, default: 0 },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const UserGoalModel = mongoose.model('UserGoal', UserGoalSchema);

export default UserGoalModel;
