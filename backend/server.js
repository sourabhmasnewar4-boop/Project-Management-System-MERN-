const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // For development, allow all origins. Can refine later.
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Save socket io instance on app context to access it in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medinex_pm';
console.log('Connecting to MongoDB at:', mongoURI);

mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB connection established successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Running backend with database warning... Ensure MongoDB is running locally!');
  });

// Socket.io room registrations
io.on('connection', (socket) => {
  console.log('Client connected to WebSockets:', socket.id);

  // User joins their personal room to receive real-time notifications
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`Socket ${socket.id} joined personal room: ${userId}`);
    }
  });

  // User joins project room for live project dashboard updates
  socket.on('join_project', (projectId) => {
    if (projectId) {
      socket.join(`project_${projectId.toString()}`);
      console.log(`Socket ${socket.id} joined project room: project_${projectId}`);
    }
  });

  // User leaves project room when navigating away
  socket.on('leave_project', (projectId) => {
    if (projectId) {
      socket.leave(`project_${projectId.toString()}`);
      console.log(`Socket ${socket.id} left project room: project_${projectId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from WebSockets:', socket.id);
  });
});

// REST API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/files', require('./routes/files'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: err.message || 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
