const asyncHandler = require("express-async-handler");
const bcrpyt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

//@desc register a user
//@route post/api/user/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("All the fields are mandatory!");
  }

  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("Email already registered");
  }
  const usernameAvailable = await User.findOne({ username });
  if (usernameAvailable) {
    res.status(400);
    throw new Error("username already registered");
  }
  //Hash password
  const hashedPassword = await bcrpyt.hash(password, 10);
  console.log("Hashed password :" + hashedPassword);
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });
  if (user) {
    console.log(`User created successfully ${user}`);
    res.status(201).json({ 
      success: true,
      error: false,
      message: "User registered successfully",
      user: {
        _id: user.id, 
        username: user.username,
        email: user.email 
      }
    });
  } else {
    res.status(400);
    throw new Error("user data is not valid");
  }
});

//@desc login a user
//@route post/api/user/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All the fields are mandatory!");
  }
  const user = await User.findOne({ email });
  // compare the passwords
  if (user && (await bcrpyt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "240m"
      }
    );
    res.status(200).json({ accessToken });
  } else {
    res.status(401);
    throw new Error("email or password not found");
  }
});

//@desc current user
//@route get/api/user/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.json({
    username: req.user.username,
    email: req.user.email,
    id: req.user.id
  });
});

const redirectToLogin = asyncHandler(async (req, res) => {
  res.status(302).json({ 
    redirect: true,
    location: '/login'
  });
});

//@desc get user profile by slug
//@route get/api/users/profile/:slug
//@access private
const getUserProfile = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  // Find user by username (slug)
  const user = await User.findOne({ username: slug }).select('-password');
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  res.json({
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName || user.username.charAt(0).toUpperCase() + user.username.slice(1).replace('-', ' '),
    ugNumber: user.ugNumber || 'Not specified',
    course: user.course || 'Not specified',
    year: user.year || 'Not specified',
    department: user.department || 'Not specified',
    phone: user.phone || 'Not provided',
    bio: user.bio || 'Student at the university.',
    interests: user.interests || 'Not specified',
    skills: user.skills || 'Not specified',
    socialLinks: user.socialLinks || { github: '', linkedin: '', twitter: '' }
  });
});

//@desc update user profile
//@route put/api/users/profile/:slug
//@access private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const userId = req.user.id;
  
  // Find the user to update
  const user = await User.findOne({ username: slug });
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  // Check if the logged-in user is trying to update their own profile
  if (user._id.toString() !== userId) {
    res.status(403);
    throw new Error("You can only update your own profile");
  }
  
  // Update allowed fields
  const allowedUpdates = [
    'fullName', 'ugNumber', 'course', 'year', 'department', 
    'phone', 'bio', 'interests', 'skills', 'socialLinks'
  ];
  
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true }
  ).select('-password');
  
  res.json({
    id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    ugNumber: updatedUser.ugNumber,
    course: updatedUser.course,
    year: updatedUser.year,
    department: updatedUser.department,
    phone: updatedUser.phone,
    bio: updatedUser.bio,
    interests: updatedUser.interests,
    skills: updatedUser.skills,
    socialLinks: updatedUser.socialLinks
  });
});

module.exports = { registerUser, loginUser, currentUser, redirectToLogin, getUserProfile, updateUserProfile };