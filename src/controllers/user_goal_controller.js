import UserGoal from '../models/user_goal_model';
import User from '../models/user_model';

export const updateGoal = async (req, res) => {
  try {
    const { goal } = req.body;
    const user = await User.findById(req.user._id);
    user.goals.push(new UserGoal({ description: goal }));
    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getUserGoals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('goals');
    const userGoals = user.goals;
    return res.json(userGoals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const setGoal = async (req, res) => {
  try {
    const { description } = req.body;
    console.log(description);
    const user = await User.findById(req.user._id);
    console.log(user);
    if (user.goals.length >= 3) {
      return res.status(400).json({ error: 'User already has three goals.' });
    }
    console.log(user);
    const goal = new UserGoal({ description });
    console.log(goal);
    goal.save();
    user.goals.push(new UserGoal({ description }));
    console.log(user);
    await user.save();
    return res.json(user.goals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const { goal } = req.body;
    const user = await User.findById(req.user._id);
    user.goals = user.goals.filter((userGoal) => { return userGoal.description !== goal; });
    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const completeGoal = async (req, res) => {
  try {
    const { goal } = req.body;
    const user = await User.findById(req.user._id);
    const userGoal = user.goals.find((g) => { return g.description === goal; });
    userGoal.completedToday = true;
    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateStreaks = async () => {
  try {
    const users = await User.find({});
    users.forEach((user) => {
      user.goals.forEach((goal) => {
        if (goal.completedToday) {
          goal.streak += 1;
          goal.completedToday = false;
        } else {
          goal.streak = 0;
        }
      });
      user.save();
    });
  } catch (error) {
    console.log(error);
  }
};
