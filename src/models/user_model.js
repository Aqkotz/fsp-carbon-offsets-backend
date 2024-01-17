import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  netid: { type: String, unique: true },
  password: { type: String },
  role: { type: String, default: 'user' },
  goals: [{ type: Schema.Types.ObjectId, ref: 'UserGoal' }],
  name: { type: String },
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
