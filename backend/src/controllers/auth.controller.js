import supabase from "../config/supabase.js";

// Sign up new user
export const signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Invalid email format" 
      });
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long" 
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
      },
    });

    if (error) {
      return res.status(400).json({ 
        error: error.message 
      });
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return res.status(200).json({
        message: "Signup successful! Please check your email to confirm your account.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    }

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      error: "Internal server error during signup" 
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
        error: "Email and password are required" 
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ 
        error: "Invalid credentials" 
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      error: "Internal server error during login" 
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: "Missing Authorization header" 
      });
    }

    const token = authHeader.split(" ")[1];

    // Sign out from Supabase
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      return res.status(400).json({ 
        error: error.message 
      });
    }

    res.status(200).json({ 
      message: "Logout successful" 
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ 
      error: "Internal server error during logout" 
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ 
        error: "Refresh token is required" 
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res.status(401).json({ 
        error: "Invalid or expired refresh token" 
      });
    }

    res.status(200).json({
      message: "Token refreshed successfully",
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ 
      error: "Internal server error during token refresh" 
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
      error: "Internal server error" 
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        error: "New password is required" 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long" 
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    // Update password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({ 
        error: error.message 
      });
    }

    res.status(200).json({ 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: "Email is required" 
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ 
        error: error.message 
      });
    }

    res.status(200).json({ 
      message: "Password reset email sent" 
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
};
