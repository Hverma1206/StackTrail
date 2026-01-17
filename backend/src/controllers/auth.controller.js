import User from "../models/User.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import crypto from "crypto";

// Sign up new user
export const signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    // Create user in MongoDB
    const user = await User.create({
      email,
      password,
      fullName,
    });

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error during signup",
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error during login",
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    // With JWT, logout is handled client-side by removing the token
    // We can implement token blacklisting if needed in the future
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal server error during logout",
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refresh_token);

    if (!decoded) {
      return res.status(401).json({
        error: "Invalid or expired refresh token",
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    // Generate new tokens
    const accessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      message: "Token refreshed successfully",
      session: {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      error: "Internal server error during token refresh",
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { newPassword, currentPassword } = req.body;

    if (!newPassword || !currentPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        message: "If an account exists with this email, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send email with reset link
    // For now, just return success
    // TODO: Implement email service
    console.log("Reset token:", resetToken);
    console.log("Reset URL:", `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

    res.status(200).json({
      message: "If an account exists with this email, a password reset link has been sent",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
