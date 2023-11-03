/* eslint-disable eqeqeq */
import { Router } from 'express';
import * as Challenges from './controllers/challenge_controller';
import * as Users from './controllers/user_controller';
import * as Submissions from './controllers/submission_controller';
import signS3 from './backendS3';
import { requireAuth, requireSignin } from './services/passport';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to FSP Carbon Offsets' });
});

// sign in a user, this takes a user object with email and password: {email, password}
router.post('/signin', requireSignin, async (req, res) => {
  try {
    const token = Users.signin(req.user);
    res.json({ token, email: req.user.email });
  } catch (error) {
    res.status(422)
      .send({ error: error.toString() });
  }
});

// create a user usign signup route
// req.body should have {email, password, userName}
router.post('/signup', async (req, res) => {
  try {
    let user;
    if (req.body.email && req.body.password && req.body.username) {
      user = req.body;
      console.log(`user body used: ${user}`);
    } else {
      console.log(`user body not used: ${req.body}`);
      user = JSON.parse(Object.keys(req.body)[0]);
    }
    console.log('in signup user, here is what backend is getting', user);
    const { newUser, token } = await Users.createUser(user);
    console.log('newUser', newUser);
    console.log('token', token);
    res.json({ newUser, token });
  } catch (error) {
    res.status(422).send({ error: error.toString() });
  }
});

export default router;
