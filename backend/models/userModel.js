const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
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
      required: false, // Made optional since we generate it from username
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);