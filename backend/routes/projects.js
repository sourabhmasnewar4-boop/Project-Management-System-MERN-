const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

// Helper function to get stats for projects
const getProjectStats = async (projects) => {
  return await Promise.all(
    projects.map(async (project) => {
      const totalTasks = await Task.countDocuments({ project: project._id });
      const completedTasks = await Task.countDocuments({
        project: project._id,
        status: 'Completed',
      });
      return {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    })
  );
};

// @desc    Get all projects (Admin gets all, Managers/Members get projects they belong to)
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find({})
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      })
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar')
        .sort({ createdAt: -1 });
    }

    const projectsWithStats = await getProjectStats(projects);
    res.json(projectsWithStats);
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({ message: 'Server error retrieving projects' });
  }
});

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Authorization check
    if (
      req.user.role !== 'admin' &&
      project.owner._id.toString() !== req.user._id.toString() &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({
      project: project._id,
      status: 'Completed',
    });
    const stats = {
      totalTasks,
      completedTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };

    res.json({
      ...project.toObject(),
      ...stats,
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({ message: 'Server error retrieving project details' });
  }
});

// @desc    Create new project (Admin & Managers only)
// @route   POST /api/projects
// @access  Private
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { title, description, startDate, deadline, members, status } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ message: 'Title and deadline are required' });
    }

    const project = await Project.create({
      title,
      description,
      startDate: startDate || Date.now(),
      deadline,
      status: status || 'Not Started',
      owner: req.user._id,
      members: members || [],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json({
      ...populatedProject.toObject(),
      totalTasks: 0,
      completedTasks: 0,
      progress: 0,
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// @desc    Update project (Admin & Owner/Manager only)
// @route   PUT /api/projects/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (Admin, or Owner)
    if (req.user.role !== 'admin' && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You are not the project owner' });
    }

    const { title, description, startDate, deadline, members, status } = req.body;

    project.title = title || project.title;
    project.description = description !== undefined ? description : project.description;
    project.startDate = startDate || project.startDate;
    project.deadline = deadline || project.deadline;
    project.members = members !== undefined ? members : project.members;
    project.status = status || project.status;

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({
      project: project._id,
      status: 'Completed',
    });

    res.json({
      ...populatedProject.toObject(),
      totalTasks,
      completedTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    });
  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (Admin, or Owner)
    if (req.user.role !== 'admin' && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You are not the project owner' });
    }

    // Delete all associated tasks
    await Task.deleteMany({ project: project._id });

    await project.deleteOne();
    res.json({ message: 'Project and all associated tasks deleted' });
  } catch (error) {
    console.error('Project deletion error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

module.exports = router;
