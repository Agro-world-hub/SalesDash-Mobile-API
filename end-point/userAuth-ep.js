// const userDao = require('../dao/userAuth-dao');
// const jwt = require('jsonwebtoken');
// const asyncHandler = require("express-async-handler");



// exports.login = async (req, res) => {
//   const { username, password } = req.body;
//   console.log('req.body', req.body)

//   if (!username || !password) {
//     return res.status(400).json({ success: false, message: 'Username and password are required' });
//   }

//   try {
//     const result = await userDao.loginUser(username, password);
//     console.log('====================================');
//     console.log(result);

//     console.log('====================================');

//     // Create JWT token
//     const token = jwt.sign(
//       { username: result.username, id: result.id, passwordUpdate: result.passwordUpdate },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: { username: result.username, token, id: result.id, passwordUpdate: result.passwordUpdate } 
//     });
//   } catch (err) {
//     return res.status(401).json({ success: false, message: err.message });
//   }
// };


const userDao = require("../dao/userAuth-dao");
const jwt = require("jsonwebtoken");
const { loginSchema, updateUserProfileSchema, updatePasswordSchema } = require("../Validations/Auth-validations");
const asyncHandler = require("express-async-handler");

exports.login = asyncHandler(async (req, res) => {
  // Validate request body using Joi
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  console.log(error)

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((err) => err.message),
    });
  }

  const { empId, password } = req.body;
  console.log("Login request received:", req.body);

  try {
    const result = await userDao.loginUser(empId, password);
    console.log("User login successful:", result);

    // Create JWT token
    const token = jwt.sign(
      { empId: result.empId, id: result.id, passwordUpdate: result.passwordUpdate },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send token as HTTP-only cookie (More Secure)
    res.cookie("authToken", token, {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // Secure flag for HTTPS in production
      sameSite: "Strict",
      maxAge: 3600000, // 1 hour
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { empId: result.empId, token, id: result.id, passwordUpdate: result.passwordUpdate },
    });
  } catch (err) {
    console.error("Login failed:", err.message);
    return res.status(401).json({ success: false, message: err.message });
  }
});



// exports.getUserProfile = asyncHandler(async (req, res) => {
//   // Extract id from the decoded JWT token in req.user
//   const id = req.user.id;
//   console.log(req.user) // Assuming req.user has been populated by the auth middleware

//   try {
//     // Call the DAO function to get user profile by ID
//     const user = await userDao.getUserProfile(id);

//     return res.status(200).json({
//       success: true,
//       message: 'Profile fetched successfully',
//       data: user, // Return the user data
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });
// exports.updateUserProfile = asyncHandler(async (req, res) => {
//   const id = req.user.id; // Assuming you are using empId from the token payload

//   const updatedData = req.body; // Get the updated data from request body

//   const results = await userDao.updateUserProfile(id, updatedData);

//   if (results.affectedRows === 0) {
//     return res.status(404).json({
//       status: "error",
//       message: "User not found or no changes made",
//     });
//   }

//   return res.status(200).json({
//     status: "success",
//     message: "User profile updated successfully",
//   });
// });

// Get User Profile
exports.getUserProfile = asyncHandler(async (req, res) => {
  const id = req.user.id;

  try {
    const user = await userDao.getUserProfile(id);
    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Update User Profile
// exports.updateUserProfile = asyncHandler(async (req, res) => {
//   const id = req.user.id;  // Extract user ID from the decoded token
//   const updatedData = req.body;  // Extract updated data from the request body

//   // Validate request body using Joi
//   const { error } = updateUserProfileSchema.validate(updatedData, { abortEarly: false });

//   if (error) {
//     return res.status(400).json({
//       status: "error",
//       message: "Validation failed",
//       errors: error.details.map((err) => err.message),
//     });
//   }

//   try {
//     const results = await userDao.updateUserProfile(id, updatedData);  // Pass the ID and updated data

//     return res.status(200).json({
//       status: "success",
//       message: "User profile updated successfully",
//     });
//   } catch (err) {
//     console.error('Error during profile update:', err);  // Log any errors
//     return res.status(500).json({
//       status: "error",
//       message: err.message,
//     });
//   }
// });

exports.updateUserProfile = asyncHandler(async (req, res) => {
  const id = req.user.id; // Getting user ID from the decoded token
  const updatedData = req.body; // Get the updated data from the request body

  // Validate request body with Joi schema
  const { error } = updateUserProfileSchema.validate(updatedData, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: error.details.map((err) => err.message),
    });
  }

  try {
    const result = await userDao.updateUserProfile(id, updatedData); // Update the profile using DAO
    return res.status(200).json({
      status: "success",
      message: "User profile updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});



// exports.updatePassword = async (req, res) => {
//   const { oldPassword, newPassword } = req.body;
//   const userId = req.user.id; // Assuming `id` is available in `req.user` from authentication middleware

//   if (!oldPassword || !newPassword) {
//     return res.status(400).json({ error: 'Old password and new password are required' });
//   }

//   try {
//     const result = await userDao.updatePassword(userId, oldPassword, newPassword);
//     res.status(200).json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };

exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Validate the request body with Joi schema
  const { error } = updatePasswordSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: error.details.map((err) => err.message),
    });
  }

  const userId = req.user.id; // Assuming `id` is available in `req.user` from authentication middleware

  try {
    const result = await userDao.updatePassword(userId, oldPassword, newPassword);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
