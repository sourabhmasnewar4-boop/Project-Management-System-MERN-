const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const File = require('../models/File');
const { protect } = require('../middleware/auth');

// Helper to push notification via Socket.io and DB
const pushNotification = async (req, recipientId, type, title, message) => {
  try {
    if (!recipientId || recipientId.toString() === req.user._id.toString()) return;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type,
      title,
      message,
    });

    const io = req.app.get('io');
    if (io) {
      // Emit to user-specific channel
      io.to(recipientId.toString()).emit('notification', notification);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Helper to emit real-time project updates to all project members
const emitProjectUpdate = (req, projectId, eventType, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`project_${projectId.toString()}`).emit(eventType, data);
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // If no project specified and user is not admin, limit tasks to projects user is member/owner of
    if (!project && req.user.role !== 'admin') {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      filter.project = { $in: projectIds };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'title owner members')
      .populate('attachments')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ message: 'Server error retrieving tasks' });
  }
});

// @desc    Get details of a single task
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'title owner members')
      .populate('attachments');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Task details fetch error:', error);
    res.status(500).json({ message: 'Server error retrieving task details' });
  }
});

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, priority, dueDate, project: projectId, assignedTo } = req.body;

    if (!title || !dueDate || !projectId) {
      return res.status(400).json({ message: 'Title, due date, and project are required' });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Auth check: Admin, Project Owner, or Project Member
    const isMember = project.members.some((m) => m.toString() === req.user._id.toString());
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this project' });
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'Medium',
      dueDate,
      project: projectId,
      assignedTo: assignedTo || null,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'title owner members')
      .populate('attachments');

    // Notify assigned user
    if (assignedTo) {
      await pushNotification(
        req,
        assignedTo,
        'TASK_ASSIGNED',
        'New Task Assigned',
        `You have been assigned to task "${title}" in project "${project.title}"`
      );
    }

    // Notify other members of project-specific room
    emitProjectUpdate(req, projectId, 'task_created', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'title owner members');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = task.project;

    // Check project membership / authorization
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some((m) => m.toString() === req.user._id.toString());
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isOwner && !isMember && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, priority, dueDate, status, assignedTo, attachments } = req.body;

    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo;

    // If team member is not admin/manager/owner, they can ONLY update status
    if (req.user.role === 'team-member' && !isOwner) {
      task.status = status !== undefined ? status : task.status;
    } else {
      // Admins and managers/owners can update everything
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.priority = priority || task.priority;
      task.dueDate = dueDate || task.dueDate;
      task.status = status !== undefined ? status : task.status;
      task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
      if (attachments !== undefined) task.attachments = attachments;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'title owner members')
      .populate('attachments');

    // Notify assigned user if assignment changed
    if (assignedTo && oldAssignedTo && assignedTo.toString() !== oldAssignedTo.toString()) {
      await pushNotification(
        req,
        assignedTo,
        'TASK_ASSIGNED',
        'New Task Assigned',
        `You have been assigned to task "${task.title}" in project "${project.title}"`
      );
    } else if (assignedTo && !oldAssignedTo) {
      await pushNotification(
        req,
        assignedTo,
        'TASK_ASSIGNED',
        'New Task Assigned',
        `You have been assigned to task "${task.title}" in project "${project.title}"`
      );
    }

    // Notify when status changes
    if (status && status !== oldStatus) {
      const msg = `Task "${task.title}" was moved from ${oldStatus} to ${status}`;
      // Notify project owner
      await pushNotification(req, project.owner, 'TASK_UPDATED', 'Task Status Updated', msg);
      // Notify assigned user
      if (task.assignedTo) {
        await pushNotification(req, task.assignedTo, 'TASK_UPDATED', 'Task Status Updated', msg);
      }
    }

    // Notify project-specific room
    emitProjectUpdate(req, project._id, 'task_updated', populatedTask);

    res.json(populatedTask);
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'owner');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions: Admin or Project Owner
    const isOwner = task.project.owner.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const projectId = task.project._id;
    const taskId = task._id;

    // Delete comments associated with the task
    await Comment.deleteMany({ task: taskId });

    // Note: In local file storage, files would stay in /uploads, but let's delete File documents
    await File.deleteMany({ _id: { $in: task.attachments } });

    await task.deleteOne();

    // Broadcast delete event
    emitProjectUpdate(req, projectId, 'task_deleted', { taskId });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Task deletion error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

module.exports = router;
