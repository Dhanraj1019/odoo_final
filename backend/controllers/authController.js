const passport = require("passport");
const User = require("../models/User");

// Signup Controller
const signup = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      instagramid,
      linkdinid,
      imageurl,
      publicurl,
      role,
    } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Email, username, and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create user
    const newUser = new User({
      username: username.trim(),
      email: normalizedEmail,
      password,
      firstName: firstName?.trim() || "",
      lastName: lastName?.trim() || "",
      phone: phone?.trim() || "",
      instagramid: instagramid?.trim() || "",
      linkdinid: linkdinid?.trim() || "",
      imageurl: imageurl || "",
      publicurl: publicurl || "",
      role: role || "user",
    });

    await newUser.save();

    // Automatically log in after registration
    req.login(newUser, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
        user: newUser,
      });
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error during signup.",
    });
  }
};

// Login Controller
const login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid email or password.",
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.status(200).json({
        success: true,
        message: "Logged in successfully.",
        user,
      });
    });
  })(req, res, next);
};

// Logout Controller
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          return next(destroyErr);
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({
          success: true,
          message: "Logged out successfully.",
        });
      });
    } else {
      res.clearCookie("connect.sid");
      return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    }
  });
};

// Get Current Logged In User
const getMe = (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
  return res.status(200).json({
    success: false,
    user: null,
    message: "No active session.",
  });
};

module.exports = {
  signup,
  login,
  logout,
  getMe,
};
