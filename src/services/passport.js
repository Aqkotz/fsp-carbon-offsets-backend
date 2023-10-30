/* eslint-disable import/no-extraneous-dependencies */
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
import User from '../models/user_model';

// loads in .env file if needed
dotenv.config({ silent: true });

// options for local strategy, we'll use email AS the username
// not have separate ones
const localOptions = { usernameField: 'email' };

// options for jwt strategy
// we'll pass in the jwt in an `authorization` header
// so passport can find it there
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.AUTH_SECRET,
};
// NOTE: we are not calling this a bearer token (although it technically is), if you see people use Bearer in front of token on the internet you could either ignore it, use it but then you have to parse it out here as well as prepend it on the frontend.

// username/email + password authentication strategy
const localLogin = new LocalStrategy(localOptions, async (email, password, done) => {
  let user;
  let isMatch;

  try {
    // finding a user with the given email
    user = await User.findOne({ email });
    // if no user exists with that email, call done with false
    if (!user) {
      return done(null, false);
    }
    // otherwise, we compare passwords and see if `password` equal to user.password. these are both hashed passwords
    // isMatch is a boolean that stores the result of this comparison
    isMatch = await user.comparePassword(password);
    // if they don't match, return done with false
    if (!isMatch) {
      return done(null, false);
    } else {
      // if they do match, call done with the user
      return done(null, user);
    }
  } catch (error) {
    // if there are any errors, call done with the error
    return done(error);
  }
});

const jwtLogin = new JwtStrategy(jwtOptions, async (payload, done) => {
  // See if the user ID in the payload exists in our database
  // If it does, call 'done' with that other
  // otherwise, call done without a user object
  let user;
  try {
    // finding a user with the given email
    user = await User.findById(payload.sub);
  } catch (error) {
    done(error, false);
  }
  // a user exists, send it back
  if (user) {
    done(null, user);
  } else {
    // if not than done with no user and false
    done(null, false);
  }
});

// Tell passport to use this strategy
passport.use(jwtLogin); // for 'jwt'
passport.use(localLogin); // for 'local'

// middleware functions to use in routes
export const requireAuth = passport.authenticate('jwt', { session: false });
export const requireSignin = passport.authenticate('local', { session: false });
