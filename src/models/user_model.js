import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  netid: { type: String, unique: true },
  password: { type: String },
  goals: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
  name: { type: String },
  carbonFootprint: {
    weekly: {
      total: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      house: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
    },
    allTime: {
      total: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      house: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
    },
  },
  carbonFootprint_isStale: { type: Boolean, default: true },
  trips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
  adminOf: { type: Schema.Types.ObjectId, ref: 'Team' },
  footprintData: {
    house: {
      surface: { type: Number, default: 0 },
      built: { type: String, default: '' },
      type: { type: String, default: '' },
      heater: { type: String, default: '' },
    },
    food: { type: [Schema.Types.Mixed], default: [{}] },
  },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

UserSchema.pre('save', async function beforeYourModelSave(next) {
  // this is a reference to our model
  // the function runs in some other context so DO NOT bind it
  const user = this;

  if (!user.isModified('password')) return next();

  try {
    // salt, hash, then set password to hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    return next();
  } catch (error) {
    return next(error);
  }
});

// function to compare a password and return a boolean
UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  console.log('comparePassword', candidatePassword, this.password);
  const comparison = await bcrypt.compare(candidatePassword, this.password);
  return comparison;
};

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
