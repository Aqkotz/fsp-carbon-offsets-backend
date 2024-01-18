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

router.post('/goals', requireAuth, UserGoals.setGoal);

router.get('/goals', requireAuth, UserGoals.getUserGoals);

router.delete('/goals:id', requireAuth, UserGoals.deleteGoal);

router.post('/goals/complete', requireAuth, UserGoals.completeGoal);

export default router;
