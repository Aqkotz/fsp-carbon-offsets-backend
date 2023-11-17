import mongoose, { Schema } from 'mongoose';

const UserGoalSchema = new Schema({
  name: { type: String },
  description: { type: String },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const UserGoalModel = mongoose.model('UserGoal', UserGoalSchema);

export default UserGoalModel;
