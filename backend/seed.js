const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const File = require('./models/File');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medinex_pm';

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding.');

    // Clear existing collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});
    await File.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Users (passwords will be hashed by Mongoose pre-save)
    const users = await User.create([
      {
        name: 'Admin Medinex',
        email: 'admin@medinex.com',
        password: 'Admin123!',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: 'Chief Operations Administrator.',
      },
      {
        name: 'Jane Manager',
        email: 'manager@medinex.com',
        password: 'Manager123!',
        role: 'manager',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        bio: 'Product Manager. Focused on execution and deadlines.',
      },
      {
        name: 'Alex Developer',
        email: 'member@medinex.com',
        password: 'Member123!',
        role: 'team-member',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Frontend Engineer. Coding bugs away.',
      },
      {
        name: 'Sarah Designer',
        email: 'sarah@medinex.com',
        password: 'Member123!',
        role: 'team-member',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        bio: 'Lead UI/UX Designer.',
      },
    ]);

    const [admin, manager, dev, designer] = users;
    console.log('Seeded users:', users.map(u => `${u.name} (${u.role})`));

    // 2. Create Projects
    const project1 = await Project.create({
      title: 'Codetech Website Redesign',
      description: 'Overhaul of the main product marketing website. Improving responsive layout, landing page conversions, and adding a dark mode toggler.',
      startDate: new Date(),
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      status: 'In Progress',
      owner: manager._id,
      members: [admin._id, dev._id, designer._id],
    });

    const project2 = await Project.create({
      title: 'Mobile Workload App',
      description: 'Developing the initial prototype for our mobile companion app. Target platform: iOS and Android using React Native.',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'Not Started',
      owner: admin._id,
      members: [manager._id, dev._id],
    });

    console.log('Seeded projects:', project1.title, ',', project2.title);

    // 3. Create Tasks for Project 1 (Website Redesign)
    const task1 = await Task.create({
      title: 'Create interactive Figma mockups',
      description: 'Design the homepage dashboard and authentication UI mockups. Include dark and light options.',
      priority: 'High',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'Completed',
      project: project1._id,
      assignedTo: designer._id,
    });

    const task2 = await Task.create({
      title: 'Set up Vite & Tailwind boilerplate',
      description: 'Configure React with Vite, install Tailwind CSS, and set up routing paths.',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'In Progress',
      project: project1._id,
      assignedTo: dev._id,
    });

    const task3 = await Task.create({
      title: 'Implement MongoDB connections & API skeleton',
      description: 'Write models, auth token signing, and controllers. Verify API testing hooks.',
      priority: 'High',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'Review',
      project: project1._id,
      assignedTo: manager._id,
    });

    const task4 = await Task.create({
      title: 'QA testing & SEO optimization',
      description: 'Execute speed indexes, add meta description tags, check responsive columns.',
      priority: 'Low',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: 'To Do',
      project: project1._id,
      assignedTo: dev._id,
    });

    // 4. Create Tasks for Project 2 (Mobile App)
    const task5 = await Task.create({
      title: 'Research native components wrapper library',
      description: 'Compare React Native Paper vs NativeBase. Draft a brief technical recommendations page.',
      priority: 'Low',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'To Do',
      project: project2._id,
      assignedTo: dev._id,
    });

    const task6 = await Task.create({
      title: 'Draft API contracts document',
      description: 'Confirm JWT payload sizes, notification routes, and data payload schemas.',
      priority: 'High',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue task!
      status: 'In Progress',
      project: project2._id,
      assignedTo: manager._id,
    });

    console.log('Seeded tasks.');

    // 5. Create Comments
    await Comment.create([
      {
        task: task3._id,
        author: dev._id,
        content: 'JWT verify and role middleware tests look good on my end. Ready to merge once approved.',
      },
      {
        task: task3._id,
        author: manager._id,
        content: 'Awesome work Alex! Let me quickly double check the JWT token expiration settings.',
      },
      {
        task: task2._id,
        author: designer._id,
        content: 'I uploaded the SVG assets and color variables sheet. Let me know if you need specific exports.',
      },
    ]);
    console.log('Seeded task comments.');

    // 6. Create Notifications
    await Notification.create([
      {
        recipient: dev._id,
        sender: manager._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: 'You have been assigned to task "Set up Vite & Tailwind boilerplate"',
      },
      {
        recipient: dev._id,
        sender: manager._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: 'You have been assigned to task "QA testing & SEO optimization"',
      },
      {
        recipient: manager._id,
        sender: dev._id,
        type: 'TASK_UPDATED',
        title: 'Task Ready for Review',
        message: 'Alex Developer marked "Implement MongoDB connections & API skeleton" as ready for Review',
      },
    ]);
    console.log('Seeded initial notifications.');

    console.log('Database seeding completed successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
