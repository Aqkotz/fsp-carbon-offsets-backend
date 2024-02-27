/* eslint-disable no-lonely-if */
import Goal from '../models/goal_model';
import User from '../models/user_model';

const allGoals = [
  {
    description: 'Eat a meatless meal',
    carbonOffset: 2.5,
    theme: 'food',
  },
  {
    description: 'Eat a meal with locally sourced (less than 100 miles)',
    carbonOffset: 0.5,
    theme: 'food',
  },
  {
    description: 'Eat a vegan meal',
    carbonOffset: 3,
    theme: 'food',
  },
  {
    description: 'Take public transportation rather than driving',
    carbonOffset: 1,
    theme: 'travel',
  },
  {
    description: 'Take a train instead of plane',
    carbonOffset: 150,
    theme: 'travel',
  },
  {
    description: 'Bring a resuable coffee cup',
    carbonOffset: 0.11,
    theme: 'food',
  },
  {
    description: 'Use and refil a reusable water bottle',
    carbonOffset: 0.08,
    theme: 'food',
  },
  {
    description: 'Take a shower under X minutes',
    carbonOffset: 0.02,
    theme: 'house',
  },
  {
    description: 'Set your room tempeature to X',
    carbonOffset: 2.79,
    theme: 'house',
  },
  {
    description: 'Use Pfand for a single use container',
    carbonOffset: 0.05,
    theme: 'food',
  },
  {
    description: 'Bring a resusable bag to the grocery store',
    carbonOffset: 0.015,
    theme: 'food',
  },
  {
    description: 'Donate one item of clothing',
    carbonOffset: 3,
    theme: 'house',
  },
  {
    description: 'Air dry your clothes',
    carbonOffset: 2.3,
    theme: 'house',
  },
  {
    description: 'Walk to class',
    carbonOffset: 0.15,
    theme: 'travel',
  },
  {
    description: 'Reuse your pong cups',
    carbonOffset: 1.21,
    theme: 'food',
  },
  {
    description: 'Bring your lunch in reusable container rather than single use',
    carbonOffset: 0.04,
    theme: 'food',
  },
  {
    description: 'Turn off lights when not in use',
    carbonOffset: 0.06,
    theme: 'house',
  },
  {
    description: 'Use a lamp instead of overhead lighting',
    carbonOffset: 0.12,
    theme: 'house',
  },
  {
    description: 'Use electronic copies rather than printed copies',
    carbonOffset: 0.0225,
    theme: 'house',
  },
  {
    description: 'Take the stairs instead of an elevator',
    carbonOffset: 0.008,
    theme: 'travel',
  },
  {
    description: 'By secondhand goods instead of new',
    carbonOffset: 3,
    theme: 'house',
  },
  {
    description: 'Turn off unused electronics',
    carbonOffset: 0.048,
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
      return res.status(400).json({ error: 'Goal status already set today' });
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
  today.setHours(0, 0, 0, 0); // Normalize today's date for comparison
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
      completed = streakEntry.completed;
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
  const totalCarbonReduction = goal.streak.reduce((total, streak) => {
    return total + (streak.completed === 'completed' ? goal.carbonOffset : 0) ?? 0;
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

  await goal.save();
  return goal;
}
