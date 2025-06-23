import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: [true, "username already in use"],
    required: [true, "please add the user name"],
  },
  email: {
    type: String,
    required: [true, "please add the email add."],
    unique: [true, "email already in use"],
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if this is not an OAuth user or if password setup is complete
      return !this.isOAuthUser || this.passwordSetupComplete;
    },
  },
  isOAuthUser: {
    type: Boolean,
    default: false,
  },
  passwordSetupComplete: {
    type: Boolean,
    default: false,
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'github', 'facebook'],
    required: function() {
      return this.isOAuthUser;
    }
  },
  fullName: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model("User", userSchema);
