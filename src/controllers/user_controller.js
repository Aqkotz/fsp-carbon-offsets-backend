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
  email, password, username, firstName, lastName,
}) {
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
  user.firstName = firstName;
  user.lastName = lastName;

  try {
    const newUser = await user.save();
    const token = tokenForUser(newUser);
    console.log('savedUser', newUser);
    return ({ newUser, token });
  } catch (error) {
    throw new Error(`create user error: ${error}`);
  }
}

async function handleCasAuthenticationSuccess(result) {
  const user = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0];
  const uid = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][0].$.value;
  const name = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][1].$.value;
  const did = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][2].$.value;
  const netid = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][3].$.value;
  const affil = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attribute'][4].$.value;

  console.log('attempting signin...');
  let token = signin({ email: user, password: uid });
  if (!token) {
    console.log('attempting signup...');
    try {
      const u = {
        email: user,
        password: uid,
        username: netid,
        firstName: name,
        lastName: name,
      };
      const newUser = await createUser(u);
      token = newUser.token;
      console.log(`signed up user: ${newUser}`);
    } catch (error) {
      throw new Error(error.toString());
    }
  } else {
    console.log(`signed in user: ${user}`);
  }

  return {
    token,
    user: {
      user,
      uid,
      name,
      did,
      netid,
      affil,
    },
  };
}

export async function validateTicket(req, res) {
  try {
    const { ticket } = req.body;
    console.log('ticket: ', ticket);

    const response = await axios.get(`https://login.dartmouth.edu/cas/serviceValidate?service=http://localhost:5174/signedin&ticket=${ticket}`);
    const { data } = response;
    console.log('data: ', data);

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

// encodes a new token for a user object
function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, process.env.AUTH_SECRET);
}
