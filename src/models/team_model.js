const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  members: [{ type: Object, required: true, ref: 'User' }],
  admins: [{ type: Object, required: true, ref: 'User' }],
  joinCode: { type: String },
  carbonFootprint: { type: Number, default: 0 },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
