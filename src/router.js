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

export default router;
