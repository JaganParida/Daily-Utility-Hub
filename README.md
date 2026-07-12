# 🛠️ Daily Utility Hub


![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

**Daily Utility Hub** is a powerful, all-in-one web application that provides over 80+ everyday utility tools in a single, fast, and beautiful interface. Whether you are a developer, student, or office professional, this platform eliminates the need to visit dozens of different websites for simple daily tasks.

---

## ✨ Key Features

- **🚀 80+ Tools in One Place:** From PDF manipulation to developer tools, everything is instantly accessible.
- **📄 PDF Utilities:** Merge, split, compress, edit, convert, encrypt, decrypt, and add watermarks to your PDF documents.
- **🖼️ Image Processing:** Compress, resize, crop, convert formats, create collages, extract colors, and add watermarks securely.
- **💻 Developer & Text Tools:** JSON Formatter, Regex Tester, Base64 Encoder/Decoder, Text Diff Checker, Markdown Editor, JWT Decoder, and more.
- **🔒 Security & Crypto:** Secure Password Generator, File Vault (AES Encryption), Hash Generator, Bcrypt Generator, and UUID generation.
- **⏱️ Productivity:** Pomodoro Timer, Temporary File Sharing (Temp Share), Google Search Builder (Dorking), Tax/EMI/SIP Calculators.
- **📱 PWA Ready:** Install it directly on your desktop or mobile device for a native app-like experience.
- **⚡ Fast & Modern:** Built with React and Vite for lightning-fast performance, featuring a sleek, responsive UI with dark mode support.
- **🛡️ Secure:** Client-side processing is prioritized for privacy. Server-side operations are secured and rate-limited.

---

## 💻 Tech Stack

### Frontend
- **Framework:** React.js (built with Vite)
- **Styling:** Tailwind CSS + Custom CSS
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **PWA:** Vite PWA Plugin
- **State Management:** React Context API

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** Firebase Auth (Client) + JWT Session Sync (Server)
- **Database:** MongoDB Atlas (Mongoose)
- **File Handling:** Multer

---

## 🌐 Live Demo

Experience the live application here: **[Daily Utility Hub](https://daily-utility-hub-orpin.vercel.app/)**

*(Ensure you have registered an account to access advanced features like personalized dashboards, tool pinning, and history tracking.)*

---

## 🛠️ Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- A MongoDB cluster/URI
- A Firebase project for authentication

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/JaganParida/Daily-Utility-Hub.git
cd Daily-Utility-Hub
\`\`\`

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

Create a `.env` file in the `backend` folder:
\`\`\`env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
\`\`\`

Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
\`\`\`bash
cd frontend
npm install
\`\`\`

Create a `.env.local` file in the `frontend` folder:
\`\`\`env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
\`\`\`

Start the frontend development server:
\`\`\`bash
npm run dev
\`\`\`


