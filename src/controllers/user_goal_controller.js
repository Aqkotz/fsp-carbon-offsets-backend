/* eslint-disable import/prefer-default-export */
import UserGoal from '../models/user_goal_model';
import User from '../models/user_model';

export const getUserGoals = async (req, res) => {
  try {
    const userGoals = await UserGoal.find({});
    return res.json(userGoals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const { goal } = req.body;
    const user = await User.findById(req.user._id);
    user.goal = new UserGoal({ description: goal });
    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getUserGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('goal');
    const userGoal = user.goal;
    return res.json(userGoal);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
