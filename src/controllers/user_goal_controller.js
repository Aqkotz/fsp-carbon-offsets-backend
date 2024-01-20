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
    const user = await User.findById(req.user._id);
    if (user.goals.length >= 3) {
      return res.status(400).json({ error: 'User already has three goals.' });
    }
    const goal = new UserGoal({ description });
    await goal.save();
    user.goals.push(goal);
    await user.save();
    return res.json(user.goals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const goal = await UserGoal.findById(id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    user.goals.pull(goal);
    await UserGoal.deleteOne({ _id: id });
    await user.save();

    return res.json((await user.populate('goals')).goals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const completeGoal = async (req, res) => {
  try {
    console.log('A');
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    console.log(id);
    const goal = await UserGoal.findById(id);
    console.log(goal);
    if (user.goals.indexOf(goal.id) === -1) {
      console.log('B');
      return res.status(400).json({ error: 'Goal not found.' });
    }
    if (goal.completedToday) {
      return res.status(400).json({ error: 'Goal already completed today.' });
    }
    goal.completedToday = true;
    await goal.save();
    return res.json(user.goals);
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

export const failGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id).populate('goals');
    const goal = await UserGoal.findById(id);
    if (user.goals.indexOf(goal) === -1) {
      return res.status(400).json({ error: 'Goal not found.' });
    }
    goal.failed = true;
    await goal.save();
    return res.json(user.goals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
