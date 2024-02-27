import mongoose, { Schema } from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  members: [{ type: Schema.Types.ObjectId, required: true, ref: 'User' }],
  admins: [{ type: Schema.Types.ObjectId, required: true, ref: 'User' }],
  joinCode: { type: String },
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
  },
  carbonFootprint_isStale: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now, required: true },
  leaderboard: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  leaderboard_isStale: { type: Boolean, default: true },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
