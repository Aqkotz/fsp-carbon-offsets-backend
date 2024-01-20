/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import schedule from 'node-schedule';
import apiRoutes from './router';
import UserGoals from './models/user_goal_model';

dotenv.config({ silent: true });

// initialize
const app = express();

app.use(bodyParser.json());

// enable/disable cross origin resource sharing if necessary
app.use(cors());
app.use(express.json());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse the incoming requests with JSON payloads

// additional init stuff should go before hitting the routing

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

app.use('/api', apiRoutes);

// START THE SERVER
// =============================================================================
async function startServer() {
  try {
    // connect DB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/fsp-carbon-offsets-backend';
    await mongoose.connect(mongoURI);
    console.log(`Mongoose connected to: ${mongoURI}`);

    const port = process.env.PORT || 9090;
    app.listen(port);

    console.log(`Listening on port ${port}`);

    schedule.scheduleJob('55 14 * * *', () => {
      console.log('Scheduler triggered at', new Date().toString());
      try {
        UserGoals.updateStreaks();
      } catch (error) {
        console.error('Error in updateStreaks:', error);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

startServer();
