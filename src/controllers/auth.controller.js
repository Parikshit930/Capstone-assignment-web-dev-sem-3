const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token.util');
const { ROLES } = require('../config/constants');

/**
 * Register a new user
 * Standard registration creates a Student account; Admins can register any role.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone, studentId, facultyId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'User with this email already exists', 409);
    }

    // Restrict creating Admin/Faculty unless the requester is an Admin
    let assignedRole = ROLES.STUDENT;
    if (role) {
      if ((role === ROLES.ADMIN || role === ROLES.FACULTY) && (!req.user || req.user.role !== ROLES.ADMIN)) {
        return ApiResponse.error(res, 'Only administrators can create Faculty or Admin accounts', 403);
      }
      assignedRole = role;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      department: department || 'General',
      phone,
      studentId: assignedRole === ROLES.STUDENT ? (studentId || `STU-${Date.now().toString().slice(-6)}`) : undefined,
      facultyId: assignedRole === ROLES.FACULTY ? (facultyId || `FAC-${Date.now().toString().slice(-6)}`) : undefined
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return ApiResponse.created(res, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        facultyId: user.facultyId
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'Account is inactive. Contact the administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return ApiResponse.success(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        facultyId: user.facultyId
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return ApiResponse.error(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return ApiResponse.error(res, 'Refresh token has been revoked or is invalid', 401);
    }

    // Token rotation: generate new access token and new refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    return ApiResponse.success(res, 'Tokens refreshed successfully', {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout / Revoke token
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      req.user.refreshToken = null;
      await req.user.save();
    }
    return ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getMe = async (req, res, next) => {
  try {
    return ApiResponse.success(res, 'User profile retrieved successfully', {
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update permitted profile fields
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (department && req.user.role === ROLES.ADMIN) {
      user.department = department;
    }

    await user.save();

    return ApiResponse.success(res, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile
};
