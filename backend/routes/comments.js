const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// @desc    Get comments for a specific task
// @route   GET /api/comments/:taskId
// @access  Private
router.get('/:taskId', protect, async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email role avatar')
      .sort({ createdAt: 1 }); // Oldest first for chat flow

    res.json(comments);
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({ message: 'Server error retrieving comments' });
  }
});

// @desc    Create a comment
// @route   POST /api/comments
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ message: 'Task ID and content are required' });
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name email role avatar'
    );

    // Emit comment event to project room
    const io = req.app.get('io');
    if (io && task.project) {
      io.to(`project_${task.project._id.toString()}`).emit('comment_created', {
        taskId,
        comment: populatedComment,
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ message: 'Server error posting comment' });
  }
});

module.exports = router;
