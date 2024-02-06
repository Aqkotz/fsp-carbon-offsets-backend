import Post from '../models/post_model';

export const createPost = async (req, res) => {
  try {
    const post = new Post(req.body);
    post.creator = req.user._id;
    await post.save();
    return res.json(post);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({});
    return res.json(posts);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    return res.json(post);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await Post.deleteOne({ _id: id });
    return res.json({ id });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    post.set(req.body);
    await post.save();
    return res.json(post);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const posts = await Post.find({
      category,
    });
    return res.json(posts);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
