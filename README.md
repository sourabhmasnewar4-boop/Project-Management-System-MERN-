# Project Management System (MERN Stack)

A robust, real-time Project Management Dashboard built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io for live updates.

## 🚀 Features

- **Real-Time Updates:** Tasks, assignments, and notifications update instantly across all connected clients via Socket.io.
- **Interactive Kanban Board:** Drag-and-drop tasks between columns using `@hello-pangea/dnd`.
- **Project & Task Management:** Complete CRUD operations for projects, tasks, and users.
- **Analytics Dashboard:** Visual representation of project progress and workload using Recharts.
- **File Attachments:** Upload and manage task-specific files using Multer.
- **Role-Based Authentication:** Secure JWT-based login with distinct roles (Admin, Manager, Team Member).
- **Responsive & Beautiful UI:** Built with Tailwind CSS, supporting both Light and Dark themes.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Recharts, React Router, Socket.io-client.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, bcryptjs, Multer.

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sourabhmasnewar4-boop/Project-Management-System-MERN-.git
   cd Project-Management-System-MERN-
   ```

2. **Backend Setup:**
   Navigate to the backend directory, install dependencies, and start the server:
   ```bash
   cd backend
   npm install
   
   # Optional: Seed the database with demo accounts and data
   npm run seed 
   
   # Start the backend server (runs on port 5000 by default)
   npm start
   ```

3. **Frontend Setup:**
   Open a separate terminal, navigate to the frontend directory, install dependencies, and start the Vite dev server:
   ```bash
   cd frontend
   npm install
   
   # Start the frontend app
   npm run dev
   ```

4. **Access the App:**
   Open your browser and navigate to the frontend URL (usually `http://localhost:5173`).

## 🔐 Default Seed Accounts

If you ran the seed script (`npm run seed`), you can log in using the following test accounts:
- **Admin:** `admin@medinex.com` / `Admin123!`
- **Manager:** `manager@medinex.com` / `Manager123!`
- **Member:** `member@medinex.com` / `Member123!`

## 📝 License
This project is for educational and portfolio purposes.