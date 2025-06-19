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
    required: [true, "please add the password"],
  },
  fullName: {
    type: String,
    required: false,
  },
  ugNumber: {
    type: String,
    default: '',
  },
  course: {
    type: String,
    default: '',
  },
  year: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  interests: {
    type: String,
    default: '',
  },
  skills: {
    type: String,
    default: '',
  },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' }
  }
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model("User", userSchema);
