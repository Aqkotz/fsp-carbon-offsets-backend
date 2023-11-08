import jwt from 'jwt-simple';
import User from '../models/user_model';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.json(users);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getUser = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const signin = (user) => {
  // Here we log the user in and return a token
  return tokenForUser(user);
};

export async function createUser({ email, password, username }) {
  // See if a user with the given email exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // If a user with email does exist, return an error
    throw new Error('Email is in use');
  }

  const user = new User();

  user.email = email;
  user.username = username;
  user.password = password;

  try {
    const newUser = await user.save();
    const token = tokenForUser(newUser);
    console.log('savedUser', newUser);
    return ({ newUser, token });
  } catch (error) {
    throw new Error(`create user error: ${error}`);
  }
}

// encodes a new token for a user object
function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, process.env.AUTH_SECRET);
}
