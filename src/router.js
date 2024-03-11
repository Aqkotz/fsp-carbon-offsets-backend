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

// Auth routes
router.post('/validate', Users.validateTicket); // validating duo tickets

router.post('/signin', requireSignin, Users.signin); // sign in didn't work so this deletes a user account, transfers their data, and then creates a new user account

// User routes
router.get('/user', requireAuth, Trips.getUser);

router.get('/carbonfootprint', requireAuth, Trips.getCarbonFootprint);

router.post('/user/foodemissions', Users.getUserFoodEmission);

router.post('/user/houseemissions', Users.getUserHouseEmission);

router.post('/food', requireAuth, Users.addFoodWeeklyConsumption);

router.get('/food', requireAuth, Users.getFood);

router.post('/house', requireAuth, Users.setHouseData);

router.get('/house', requireAuth, Users.getHouse);

router.delete('/user', requireAuth, Users.deleteUser);

// Trips routes
router.post('/trips', requireAuth, Trips.createTrip);

router.post('/trips/estimate', requireAuth, Trips.getTripEstimate);

router.post('/trips/:id', requireAuth, Trips.updateTrip);

router.delete('/trips/:id', requireAuth, Trips.deleteTrip);

router.get('/trips', requireAuth, Trips.getTrips);

// Helpful resources routes
router.post('/posts', requireAuth, Post.createPost);

router.get('/posts', requireAuth, Post.getPosts);

router.get('/posts/:id', requireAuth, Post.getPost);

router.delete('/posts/:id', requireAuth, Post.deletePost);

router.post('/posts/:id', requireAuth, Post.updatePost);

router.get('/posts/theme/:theme', requireAuth, Post.getPostsByTheme);

// Team routes
router.post('/teams', requireAuth, Team.createTeam);

router.get('/teams', requireAuth, Team.getTeam); // This route for some reason took 20 minutes and gave me a 502. No idea why. /testrequest replaces its use in the app.

router.post('/teams/join', requireAuth, Team.joinTeam);

router.get('/teams/joincode', requireAuth, Team.getJoinCode);

router.post('/teams/leave', requireAuth, Team.leaveTeam);

router.post('/teams/transfer', requireAuth, Team.transferOwnership);

router.post('/teams/admin', requireAuth, Team.addAdmin);

router.delete('/teams', requireAuth, Team.deleteTeam);

router.delete('/teams/admin/:id', requireAuth, Team.removeAdmin);

router.post('/teams/goal', requireAuth, Team.setTeamGoal);

// Goal routes
router.get('/goals/themes', Goal.getThemes);

router.get('/goals/:theme', Goal.getGoalsByTheme);

router.post('/goals', requireAuth, Goal.setGoal);

router.get('/pastgoals', requireAuth, Goal.getPastGoals); // I don't know why /goals/past didn't work for this route

router.get('/goals', requireAuth, Goal.getGoals);

router.delete('/goals/:id', requireAuth, Goal.deleteGoal);

router.post('/goals/status/:id', requireAuth, Goal.setGoalStatusForDay);

router.post('/goals/past/:id', requireAuth, Goal.setGoalPast);

// Test routes
router.get('/testrequest', requireAuth, Team.getTeam);

router.post('/fix', requireAuth, Users.fixTeams);

export default router;
