const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  creator: { type: Object, required: true, ref: 'User' },
  description: { type: String, required: true },
  category: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String, required: true },
});

const Post = mongoose.model('Goal', postSchema);

module.exports = Post;
