const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  members: [{ type: Object, required: true, ref: 'User' }],
  admins: [{ type: Object, required: true, ref: 'User' }],
  joinCode: { type: String },
  carbonFootprint: {
    travel: { type: Number },
    house: { type: Number },
    food: { type: Number },
    total: { type: Number },
  },
  carbonFootprint_isStale: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now, required: true },
  // currentWeek: { type: Number, default: 0 },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
