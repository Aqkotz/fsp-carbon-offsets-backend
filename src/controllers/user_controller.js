import jwt from 'jwt-simple';
import axios from 'axios';
import xml2js from 'xml2js';
import User from '../models/user_model';
import UserGoal from '../models/user_goal_model';
import Trip from '../models/trip_model';
import { getFoodEmissionWeekly, getHouseEmissionEstimated } from '../utilities/carbon_calculation';

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
    console.log('getUser');
    const user = await User.findById(userId);
    return res.json(user);
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
    // console.log(User.findOne({ netid }));
    // console.log('goals: ', goals);
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
      console.log('user: ', user);
      const { token, newUser } = await createUser(user);
      console.log('newUser: ', newUser);
      console.log('token: ', token);
      return { token, newUser };
    } catch (error) {
      console.log('error: ', error);
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

export const updateStreaks = async (req, res) => {
  try {
    console.log('Updating streaks...');
    const goals = await UserGoal.find({});
    goals.forEach((goal) => {
      console.log('goal: ', goal);
      goal.streak.push(goal.completedToday);
      goal.completedToday = false;
      goal.failed = false;
      goal.save();
    });
    return res.json(goals);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export async function updateCarbonFootprint(user) {
  try {
    // Update carbon footprints for all trips
    await Promise.all(user.trips.map(async (trip) => {
      if (trip.isStale) {
        console.log('Updating carbon footprint for trip: ', trip._id);
        return Trip.updateCarbonFootprint(trip);
      }
      return Promise.resolve();
    }));

    const newFootprint = {};

    newFootprint.travel = user.trips
      .filter((trip) => { return trip !== null && typeof trip.actualCarbonFootprint === 'number'; })
      .reduce((total, trip) => { return total + trip.actualCarbonFootprint; }, 0);

    user.carbonFootprint.food = user.footprintData.food.reduce((total, consumption) => { return total + getFoodEmissionWeekly(consumption); }, 0);
    user.carbonFootprint.house = getHouseEmissionEstimated(user.footprintData.house);
    newFootprint.total = newFootprint.travel + user.carbonFootprint.food + user.carbonFootprint.house;

    user.carbonFootprint = newFootprint;
    user.carbonFootprint_isStale = false;
    await user.save();
  } catch (error) {
    console.error('Error updating carbon footprints: ', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

export async function getCarbonFootprint(req, res) {
  try {
    let user = await User.findById(req.user._id).populate('trips');
    if (user.carbonFootprint_isStale) {
      console.log(`Updating carbon footprint for user ${user.name}...`);
      await updateCarbonFootprint(user);
      user = await User.findById(req.user._id);
    }
    return res.json(user.carbonFootprint);
  } catch (error) {
    console.error('Failed to get carbon footprint: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function getUserFoodEmission(req, res) {
  try {
    const { consumption } = req.body;
    const emission = await getFoodEmissionWeekly(consumption);
    return res.json(emission);
  } catch (error) {
    console.error('Failed to get food emission: ', error);
    return res.status(400).json({ error: error.message });
  }
}

export async function getUserHouseEmission(req, res) {
  try {
    const { house } = req.body;
    const emission = getHouseEmissionEstimated(house);
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
    consumption.date = new Date();
    user.footprintData.food.push(consumption);
    user.carbonFootprint_isStale = true;
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
    user.footprintData.house = house;
    user.carbonFootprint_isStale = true;
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
