const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  members: [{ type: Object, required: true, ref: 'User' }],
  admins: [{ type: Object, required: true, ref: 'User' }],
  joinCode: { type: String, required: true },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

const Post = mongoose.model('Goal', teamSchema);

module.exports = Post;
