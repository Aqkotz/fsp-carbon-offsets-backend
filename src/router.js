/* eslint-disable no-unused-vars */
import { Router } from 'express';
import schedule from 'node-schedule';
import * as Users from './controllers/user_controller';
import * as UserGoals from './controllers/user_goal_controller';
import { requireAuth, requireSignin } from './services/passport';

schedule.scheduleJob('0 0 * * *', () => { UserGoals.updateStreaks(); });

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to FSP Carbon Offsets' });
});

router.get('/user', requireAuth, Users.getUser);

router.post('/validate', Users.validateTicket);

router.post('/goals', requireAuth, UserGoals.updateGoal);

router.get('/goals', requireAuth, UserGoals.getUserGoals);

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
