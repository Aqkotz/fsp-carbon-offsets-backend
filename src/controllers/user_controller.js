/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import jwt from 'jwt-simple';
import axios from 'axios';
import xml2js from 'xml2js';
import User from '../models/user_model';
import Trip from '../models/trip_model';
import Team from '../models/team_model';
import Goal from '../models/goal_model';
import {
  getFoodEmissionWeekly, getFoodEmissionAllTime, getHouseEmissionWeekly, getHouseEmissionAllTime,
} from '../utilities/carbon_calculation';
import { updateGoalData } from './goal_controller';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.json(users);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const signin = (user) => {
  return tokenForUser(user);
};

export async function createUser({
  netid, password, name, goals,
}) {
  const existingUser = await User.findOne({ netid });
  if (existingUser) {
    console.log('existing user!!!');
    throw new Error('Netid is in use');
  }

  const user = new User();

  user.netid = netid;
  user.password = password;
  user.name = name;
  user.goals = goals;
  user.team = null;

  try {
    const newUser = await user.save();
    const token = tokenForUser(newUser);
    return ({ newUser, token });
  } catch (error) {
    throw new Error(`create user error: ${error}`);
  }
}

async function handleCasAuthenticationSuccess(result) {
  const uid = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][0].$.value;
  const name = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][1].$.value;
  const netid = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][3].$.value;

  const existingUser = await User.findOne({ netid });
  if (existingUser) {
    // const { goals } = existingUser;
    // await User.findOneAndDelete({ netid });
    // const user = {
    //   netid,
    //   password: uid,
    //   name,
    //   goals,
    // };
    // const { token, newUser } = await createUser(user);
    const token = signin(existingUser);
    return { token, newUser: existingUser };
  } else {
    try {
      const user = {
        netid,
        password: uid,
        name,
        goals: [],
      };
      const { token, newUser } = await createUser(user);
      return { token, newUser };
    } catch (error) {
      console.log('error creating user: ', error);
      throw new Error(error.toString());
    }
  }
}

export async function validateTicket(req, res) {
  try {
    const { ticket, service } = req.body;

    const response = await axios.get(`https://login.dartmouth.edu/cas/serviceValidate?service=${service}/signedin&ticket=${ticket}`);
    const { data } = response;

    let parsedResult;
    try {
      parsedResult = await xml2js.parseStringPromise(data);
    } catch (error) {
      return res.status(400).send('Error parsing XML');
    }

    const result = parsedResult['cas:serviceResponse'];
    if (!result) {
      return res.status(400).json({ error: 'XML parse failed' });
    }

    const authSuccess = result['cas:authenticationSuccess'];
    if (authSuccess) {
      const { token, ...userData } = await handleCasAuthenticationSuccess(parsedResult);
      return res.json({ token, ...userData });
    } else {
      return res.status(400).json({ error: 'Authentication failed' });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, process.env.AUTH_SECRET);
}

export async function updateUserCarbonFootprint(user) {
  try {
    await Promise.all(user.trips.map(async (trip) => {
      if (trip.isStale) {
        console.log('Updating carbon footprint for trip: ', trip._id);
        return Trip.updateCarbonFootprint(trip);
      }
      return Promise.resolve();
    }));

    const team = await Team.findById(user.team);
    const programDays = !team ? 7 : Math.floor((Date.now() - team.startDate) / (1000 * 60 * 60 * 24));
    const week = !team ? 1 : Math.floor((Date.now() - team.startDate) / (1000 * 60 * 60 * 24 * 7)) + 1;
    const startDateTimestamp = !team ? 0 : (team.startDate instanceof Date ? team.startDate.getTime() : team.startDate);
    const weekStartDateTimestamp = !team ? 0 : startDateTimestamp + (week - 1) * 7 * 24 * 60 * 60 * 1000;
    const weekStartDate = !team ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : new Date(weekStartDateTimestamp);
    weekStartDate.setHours(0, 0, 0, 0);
    const lastWeekStartDate = new Date(weekStartDate);
    lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 7);

    const newFootprint = {
      weekly: {},
      allTime: {},
      reduction: {},
      weeklyReduction: {},
    };

    newFootprint.allTime.travel = user.trips
      .filter((trip) => { return trip !== null && typeof trip.actualCarbonFootprint === 'number'; })
      .reduce((total, trip) => { return total + trip.actualCarbonFootprint; }, 0);
    newFootprint.weekly.travel = user.trips
      .filter((trip) => { return trip !== null && typeof trip.actualCarbonFootprint === 'number' && trip.date > weekStartDate; })
      .reduce((total, trip) => { return total + trip.actualCarbonFootprint; }, 0);

    if (user.footprintData.food.length > 0) {
      const lastFood = user.footprintData.food[user.footprintData.food.length - 1];
      newFootprint.allTime.food = getFoodEmissionAllTime(user.footprintData.food);
      newFootprint.weekly.food = lastFood.date >= lastWeekStartDate ? getFoodEmissionWeekly(lastFood) : 0;
    } else {
      newFootprint.allTime.food = 0;
      newFootprint.weekly.food = 0;
    }

    newFootprint.allTime.house = getHouseEmissionAllTime(user.footprintData.house, programDays) ?? 0;
    newFootprint.weekly.house = getHouseEmissionWeekly(user.footprintData.house) ?? 0;

    await user.populate('goals');
    await Promise.all(user.goals.map(async (goal) => {
      if (goal.data_isStale) {
        console.log(`Updating goal data for goal ${goal._id}...`);
        return updateGoalData(goal);
      }
      return Promise.resolve();
    }));

    newFootprint.reduction.travel = user.goals
      .filter((goal) => { return goal.theme === 'travel'; })
      .reduce((total, goal) => { return total + goal.totalCarbonReduction; }, 0);
    newFootprint.reduction.food = user.goals
      .filter((goal) => { return goal.theme === 'food'; })
      .reduce((total, goal) => { return total + goal.totalCarbonReduction; }, 0);
    newFootprint.reduction.house = user.goals
      .filter((goal) => { return goal.theme === 'house'; })
      .reduce((total, goal) => { return total + goal.totalCarbonReduction; }, 0);

    newFootprint.weeklyReduction.travel = user.goals
      .filter((goal) => { return goal.theme === 'travel'; })
      .reduce((total, goal) => { return total + goal.currentWeek.reduce((weekTotal, entry) => { return weekTotal + (entry.completed === 'completed' ? goal.carbonReduction : 0); }, 0); }, 0);
    newFootprint.weeklyReduction.food = user.goals
      .filter((goal) => { return goal.theme === 'food'; })
      .reduce((total, goal) => { return total + goal.currentWeek.reduce((weekTotal, entry) => { return weekTotal + (entry.completed === 'completed' ? goal.carbonReduction : 0); }, 0); }, 0);
    newFootprint.weeklyReduction.house = user.goals
      .filter((goal) => { return goal.theme === 'house'; })
      .reduce((total, goal) => { return total + goal.currentWeek.reduce((weekTotal, entry) => { return weekTotal + (entry.completed === 'completed' ? goal.carbonReduction : 0); }, 0); }, 0);

    Object.keys(newFootprint).forEach((key) => {
      newFootprint[key].total = Object.keys(newFootprint[key]).reduce((total, subKey) => {
        if (subKey !== 'total') {
          return total + newFootprint[key][subKey];
        }
        return total;
      }, 0);
    });

    user.carbonFootprint = newFootprint;
    user.carbonFootprint_isStale = false;
    user.footprintData.loggedLastWeekFood = user.footprintData.food.some((food) => {
      console.log(`food date: ${food.date}, lastWeekStartDate: ${lastWeekStartDate}, food date >= lastWeekStartDate: ${food.date >= lastWeekStartDate}`);
      return food.date >= lastWeekStartDate;
    });
    await user.save();
  } catch (error) {
    console.error('Error updating carbon footprints: ', error);
    throw error;
  }
}

export async function getUserFoodEmission(req, res) {
  try {
    const { consumption } = req.body;
    const emission = getFoodEmissionWeekly(consumption);
    return res.json(emission);
  } catch (error) {
    console.error('Failed to get food emission: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function getUserHouseEmission(req, res) {
  try {
    const { house } = req.body;
    const emission = getHouseEmissionAllTime(house);
    return res.json(emission);
  } catch (error) {
    console.error('Failed to get house emission: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function addFoodWeeklyConsumption(req, res) {
  try {
    const user = await User.findById(req.user._id);
    const { consumption } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    consumption.date = startOfWeek;
    if (user.footprintData.loggedLastWeekFood) {
      return res.status(400).json({ error: 'Food consumption already logged for last week' });
    }
    user.footprintData.food.push(consumption);
    user.carbonFootprint_isStale = true;
    const team = await Team.findById(user.team);
    team.carbonFootprint_isStale = true;
    team.save();
    await user.save();
    return res.json(user.footprintData.food);
  } catch (error) {
    console.error('Failed to add food consumption: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function setHouseData(req, res) {
  try {
    const user = await User.findById(req.user._id);
    const { house } = req.body;
    console.log('house: ', house);
    user.footprintData.house = house;
    user.carbonFootprint_isStale = true;
    const team = await Team.findById(user.team);
    if (team) {
      team.carbonFootprint_isStale = true;
      team.save();
    }
    await user.save();
    return res.json(user.footprintData.house);
  } catch (error) {
    console.error('Failed to set house data: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function getFood(req, res) {
  try {
    const user = await User.findById(req.user._id);
    return res.json(user.footprintData.food);
  } catch (error) {
    console.error('Failed to get food consumption: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function getHouse(req, res) {
  try {
    const user = await User.findById(req.user._id);
    return res.json(user.footprintData.house);
  } catch (error) {
    console.error('Failed to get house data: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function setAllUsersStale() {
  try {
    const users = await User.find({});
    await Promise.all(users.map(async (user) => {
      user.carbonFootprint_isStale = true;
      await user.save();
    }));
  } catch (error) {
    console.error('Failed to set all users stale: ', error);
    throw error;
  }
}

export async function fixTeams(req, res) {
  try {
    const users = await User.find({});
    await Promise.all(users.map(async (user) => {
      if (!user.team) {
        user.team = null;
        await user.save();
      }
    }));
    return res.json({ message: 'Fixed teams' });
  } catch (error) {
    console.error('Failed to fix teams: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.user._id);
    await Promise.all(user.trips.map(async (trip) => {
      await Trip.findByIdAndDelete(trip);
    }));
    await Promise.all(user.goals.map(async (goal) => {
      await Goal.findByIdAndDelete(goal);
    }));
    await Promise.all(user.pastGoals.map(async (goal) => {
      await Goal.findByIdAndDelete(goal);
    }));
    await User.findByIdAndDelete(req.user._id);
    return res.json({ message: `Deleted user ${user.name}` });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
