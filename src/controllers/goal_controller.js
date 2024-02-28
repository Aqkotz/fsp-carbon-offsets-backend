/* eslint-disable no-lonely-if */
import Goal from '../models/goal_model';
import User from '../models/user_model';

const allGoals = [
  {
    description: 'Eat a meatless meal',
    carbonReduction: 2.5,
    theme: 'food',
  },
  {
    description: 'Eat a meal with locally sourced (less than 100 miles)',
    carbonReduction: 0.5,
    theme: 'food',
  },
  {
    description: 'Eat a vegan meal',
    carbonReduction: 3,
    theme: 'food',
  },
  {
    description: 'Take public transportation rather than driving',
    carbonReduction: 1,
    theme: 'travel',
  },
  {
    description: 'Take a train instead of plane',
    carbonReduction: 150,
    theme: 'travel',
  },
  {
    description: 'Bring a resuable coffee cup',
    carbonReduction: 0.11,
    theme: 'food',
  },
  {
    description: 'Use and refil a reusable water bottle',
    carbonReduction: 0.08,
    theme: 'food',
  },
  {
    description: 'Take a shower under X minutes',
    carbonReduction: 0.02,
    theme: 'house',
  },
  {
    description: 'Set your room tempeature to X',
    carbonReduction: 2.79,
    theme: 'house',
  },
  {
    description: 'Use Pfand for a single use container',
    carbonReduction: 0.05,
    theme: 'food',
  },
  {
    description: 'Bring a resusable bag to the grocery store',
    carbonReduction: 0.015,
    theme: 'food',
  },
  {
    description: 'Donate one item of clothing',
    carbonReduction: 3,
    theme: 'house',
  },
  {
    description: 'Air dry your clothes',
    carbonReduction: 2.3,
    theme: 'house',
  },
  {
    description: 'Walk to class',
    carbonReduction: 0.15,
    theme: 'travel',
  },
  {
    description: 'Reuse your pong cups',
    carbonReduction: 1.21,
    theme: 'food',
  },
  {
    description: 'Bring your lunch in reusable container rather than single use',
    carbonReduction: 0.04,
    theme: 'food',
  },
  {
    description: 'Turn off lights when not in use',
    carbonReduction: 0.06,
    theme: 'house',
  },
  {
    description: 'Use a lamp instead of overhead lighting',
    carbonReduction: 0.12,
    theme: 'house',
  },
  {
    description: 'Use electronic copies rather than printed copies',
    carbonReduction: 0.0225,
    theme: 'house',
  },
  {
    description: 'Take the stairs instead of an elevator',
    carbonReduction: 0.008,
    theme: 'travel',
  },
  {
    description: 'By secondhand goods instead of new',
    carbonReduction: 3,
    theme: 'house',
  },
  {
    description: 'Turn off unused electronics',
    carbonReduction: 0.048,
    theme: 'house',
  },
];

export async function getThemes(req, res) {
  try {
    const themes = allGoals.map((goal) => {
      return goal.theme;
    });
    return res.json(Array.from(new Set(themes)));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getGoalsByTheme(req, res) {
  try {
    const { theme } = req.params;
    const goals = allGoals.filter((goal) => {
      return goal.theme === theme;
    });
    return res.json(goals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function setGoal(req, res) {
  try {
    const user = await User.findById(req.user._id);
    const goal = new Goal(req.body);
    await goal.save();
    user.goals.push(goal);
    await user.save();
    return res.json(goal);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getGoals(req, res) {
  try {
    let user = await User.findById(req.user._id).populate('goals');
    await Promise.all(user.goals.map(async (goal) => {
      if (goal.data_isStale) {
        await updateGoalData(goal);
      }
      return Promise.resolve();
    }));
    user = await User.findById(req.user._id).populate('goals');
    const { goals } = user;
    return res.json(goals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function deleteGoal(req, res) {
  try {
    const { id } = req.params;
    await Goal.deleteOne({ _id: id });
    const user = await User.findOne({ goals: id });
    user.goals.pull(id);
    await user.save();
    return res.json({ id });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function setGoalStatusForDay(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const goal = await Goal.findById(id);
    if (goal.streak.some((streak) => { return streak.date >= (new Date()).setHours(0, 0, 0, 0); })) {
      return res.json('goal already set for today');
    }
    goal.streak.push({ completed: status, date: new Date() });
    goal.data_isStale = true;
    await goal.save();
    return res.json(goal);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

function currentWeekForGoal(goal) {
  const currentWeek = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    let completed;
    const streakEntry = goal.streak.find((streak) => {
      const streakDate = new Date(streak.date);
      streakDate.setHours(0, 0, 0, 0);
      return streakDate.getTime() === date.getTime();
    });

    if (streakEntry) {
      completed = streakEntry.completed === 'completed' ? 'completed' : 'failed';
    } else {
      if (date < today) {
        completed = 'past';
      } else if (date > today) {
        completed = 'future';
      }
    }

    const entry = {
      completed,
      date,
    };
    currentWeek.push(entry);
  }
  return currentWeek;
}

export async function updateGoalData(goal) {
  try {
    console.log('Updating goal data', goal.description);
    const totalCarbonReduction = goal.streak.reduce((total, streak) => {
      return total + (streak.completed === 'completed' ? goal.carbonReduction : 0) ?? 0;
    }, 0) ?? 0;

    console.log(totalCarbonReduction);

    goal.currentWeek = currentWeekForGoal(goal);
    goal.streakLength = 0;
    for (let i = goal.streak.length - 1; i >= 0; i -= 1) {
      if (goal.streak[i].completed === 'completed') {
        goal.streakLength += 1;
      } else {
        break;
      }
    }
    goal.totalCarbonReduction = totalCarbonReduction;
    goal.data_isStale = false;

    const { team } = await User.findOne({ goals: goal._id }).populate('team');
    team.leaderboard_isStale = true;
    team.carbonFootprint_isStale = true;
    await team.save();
    await goal.save();
    return goal;
  } catch (error) {
    console.error('Error updating goal data: ', error);
    throw error;
  }
}

export async function setAllGoalsStale() {
  try {
    const goals = await Goal.find({});
    await Promise.all(goals.map(async (goal) => {
      goal.data_isStale = true;
      return goal.save();
    }));
  } catch (error) {
    console.error('Failed to set all teams stale: ', error);
    throw error;
  }
}
