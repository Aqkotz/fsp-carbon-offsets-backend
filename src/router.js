import { Router } from 'express';
import * as Users from './controllers/user_controller';
import * as UserGoals from './controllers/user_goal_controller';
import { requireAuth, requireSignin } from './services/passport';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to FSP Carbon Offsets' });
});

router.get('/user', requireAuth, Users.getUser);

router.post('/validate', Users.validateTicket);

router.post('/signin', requireSignin, Users.signin);

router.post('/goals', requireAuth, UserGoals.setGoal);

router.get('/goals', requireAuth, UserGoals.getUserGoals);

router.delete('/goals/:id', requireAuth, UserGoals.deleteGoal);

router.post('/goals/complete/:id', requireAuth, UserGoals.completeGoal);

router.post('/goals/fail/:id', requireAuth, UserGoals.failGoal);

router.post('/updatestreaks', Users.updateStreaks);

router.post('/fix', Users.fixFlights);

router.post('/stops', requireAuth, Users.setStops);

router.get('/stops', requireAuth, Users.getStops);

export default router;
