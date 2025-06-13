const express = require("express");                                                
const { registerUser, currentUser, loginUser, 
    redirectToLogin, getUserProfile, updateUserProfile  } = require("../controller/userController");
const validateToken = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/current",validateToken, currentUser);
router.get("/redirect-to-login", redirectToLogin);
router.get("/profile/:slug", validateToken, getUserProfile);
router.put("/profile/:slug", validateToken, updateUserProfile);

module.exports = router;