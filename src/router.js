import { Router } from 'express';
import * as Users from './controllers/user_controller';
import * as Trips from './controllers/trip_controller';
import * as Post from './controllers/post_controller';
import * as Team from './controllers/team_controller';
import * as Goal from './controllers/goal_controller';
import { requireAuth, requireSignin } from './services/passport';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to FSP Carbon Offsets' });
});

router.get('/user', requireAuth, Users.getUser);

router.post('/validate', Users.validateTicket);

router.post('/signin', requireSignin, Users.signin);

router.get('/carbonfootprint', requireAuth, Trips.getCarbonFootprint);

router.post('/trips', requireAuth, Trips.createTrip);

router.post('/trips/estimate', requireAuth, Trips.getTripEstimate);

router.post('/trips/:id', requireAuth, Trips.updateTrip);

router.delete('/trips/:id', requireAuth, Trips.deleteTrip);

router.get('/trips', requireAuth, Trips.getTrips);

router.post('/posts', requireAuth, Post.createPost);

router.get('/posts', requireAuth, Post.getPosts);

router.get('/posts/:id', requireAuth, Post.getPost);

router.delete('/posts/:id', requireAuth, Post.deletePost);

router.post('/posts/:id', requireAuth, Post.updatePost);

router.get('/posts/theme/:theme', requireAuth, Post.getPostsByTheme);

router.post('/teams', requireAuth, Team.createTeam);

router.get('/teams', requireAuth, Team.getTeam);

router.post('/teams/join', requireAuth, Team.joinTeam);

router.get('/teams/joincode', requireAuth, Team.getJoinCode);

router.post('/teams/leave', requireAuth, Team.leaveTeam);

router.post('/teams/transfer', requireAuth, Team.transferOwnership);

router.delete('/teams', requireAuth, Team.deleteTeam);

router.post('/user/foodemissions', Users.getUserFoodEmission);

router.post('/user/houseemissions', Users.getUserHouseEmission);

router.post('/food', requireAuth, Users.addFoodWeeklyConsumption);

router.get('/food', requireAuth, Users.getFood);

router.post('/house', requireAuth, Users.setHouseData);

router.get('/house', requireAuth, Users.getHouse);

router.get('/themes', Goal.getThemes);

router.get('/goals/:theme', Goal.getGoalsByTheme);

router.post('/goals', requireAuth, Goal.setGoal);

router.get('/goals', requireAuth, Goal.getGoals);

router.delete('/goals/:id', requireAuth, Goal.deleteGoal);

router.post('/goals/status/:id', requireAuth, Goal.setGoalStatusForDay);

export default router;
