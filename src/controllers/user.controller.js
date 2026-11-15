const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * List all users with pagination, role filtering, and search
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, department, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (department) query.department = new RegExp(department, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
        { facultyId: new RegExp(search, 'i') }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return ApiResponse.paginate(res, 'Users fetched successfully', users, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }
    return ApiResponse.success(res, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Create user (Admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone, studentId, facultyId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'User with this email already exists', 409);
    }

    const user = await User.create({
      name,
      email,
      password: password || 'Password@123',
      role,
      department,
      phone,
      studentId,
      facultyId
    });

    return ApiResponse.created(res, 'User created successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, role, department, phone, isActive, studentId, facultyId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department) user.department = department;
    if (phone) user.phone = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (studentId) user.studentId = studentId;
    if (facultyId) user.facultyId = facultyId;

    await user.save();

    return ApiResponse.success(res, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete / deactivate user (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Soft delete by setting isActive to false or full remove
    await User.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
