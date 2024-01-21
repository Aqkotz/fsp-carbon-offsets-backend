import jwt from 'jwt-simple';
import axios from 'axios';
import xml2js from 'xml2js';
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

export async function createUser({
  netid, password, name, goals,
}) {
  // See if a user with the given netid exists
  const existingUser = await User.findOne({ netid });
  if (existingUser) {
    console.log('existing user!!!');
    // If a user with netid does exist, return an error
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
    const { goals } = existingUser;
    await User.findOneAndDelete({ netid });
    console.log('goals: ', goals);
    const user = {
      netid,
      password: uid,
      name,
      goals,
    };
    const { token, newUser } = await createUser(user);
    console.log('newUser: ', newUser);
    console.log('token: ', token);
    return { token, newUser };
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
