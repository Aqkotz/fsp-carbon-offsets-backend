import mongoose, { Schema } from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, required: true, ref: 'User' }],
  admins: [{ type: Schema.Types.ObjectId, required: true, ref: 'User' }],
  owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  joinCode: { type: String, required: true },
  carbonFootprint: {
    weekly: {
      total: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      house: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
    },
    allTime: {
      total: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      house: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
    },
    reduction: {
      total: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      house: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
    },
    weeklyReduction: {
      total: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      house: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
    },
  },
  teamGoal: {
    carbonReduction: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
  },
  pastTeamGoals: [{
    carbonReduction: { type: Number, default: 0 },
    actualCarbonReduction: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
  }],
  carbonFootprint_isStale: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now, required: true },
  leaderboard: [{
    name: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    carbonReduction: { type: Number, default: 0 },
  }],
  leaderboard_isStale: { type: Boolean, default: true },
  timeZone: { type: String, default: 'America/New_York' },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
