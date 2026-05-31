const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all users (for assigning to tasks and projects)
// @route   GET /api/users
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving users list' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @desc    Get users workload statistics
// @route   GET /api/users/workload
// @access  Private
router.get('/workload', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('name email role avatar');
    
    const workloads = await Promise.all(
      users.map(async (user) => {
        const assignedTasks = await Task.find({
          assignedTo: user._id,
          status: { $ne: 'Completed' },
        });

        const completedTasksCount = await Task.countDocuments({
          assignedTo: user._id,
          status: 'Completed',
        });

        return {
          user,
          activeTasksCount: assignedTasks.length,
          completedTasksCount,
          tasks: assignedTasks,
        };
      })
    );

    res.json(workloads);
  } catch (error) {
    console.error('Workload fetch error:', error);
    res.status(500).json({ message: 'Server error fetching workloads' });
  }
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'manager', 'team-member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing user role' });
  }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Reassign tasks to null
    await Task.updateMany({ assignedTo: user._id }, { assignedTo: null });

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;
