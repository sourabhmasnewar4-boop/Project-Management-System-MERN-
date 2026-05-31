const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const File = require('../models/File');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// @desc    Upload a single file
// @route   POST /api/files/upload
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Prepare host URL
    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const newFile = await File.create({
      name: req.file.originalname,
      path: req.file.path,
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error('File upload route error:', error);
    res.status(500).json({ message: error.message || 'Server error uploading file' });
  }
});

// @desc    Delete a file reference
// @route   DELETE /api/files/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check ownership: Admin or File Uploader
    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete MongoDB document
    await file.deleteOne();

    // Remove file reference from any tasks
    await Task.updateMany({ attachments: file._id }, { $pull: { attachments: file._id } });

    // Note: We leave the actual file in the filesystem to avoid locking/permissions issues on Windows,
    // which is perfectly fine for portfolio display.

    res.json({ message: 'File reference deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Server error deleting file' });
  }
});

module.exports = router;
