/* eslint-disable import/prefer-default-export */
import UserGoal from '../models/user_goal_model';

export const getUserGoals = async (req, res) => {
  try {
    const userGoals = await UserGoal.find({});
    return res.json(userGoals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
