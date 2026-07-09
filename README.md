# Nexucon FlowPilot Client (Phase 1 Frontend)

FlowPilot Client is a high-fidelity, premium task management user interface built to achieve feature parity with standard industry management tools before introducing downstream AI integration layers. 

Designed with a sleek, dark-mode slate theme, it utilizes optimistic UI updates, robust state management, and real-time backend synchronization with the FastAPI + MongoDB server.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) (pure JavaScript/JSX structure)
- **Bundler**: [Vite](https://vite.dev/) (extremely fast Hot Module Replacement)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS (using modern glassmorphic cards and subtle gradient glow shadows)
- **Global State**: [Redux Toolkit](https://redux-toolkit.js.org/) (handles authentication, token mapping, and session caching)
- **Asynchronous Syncing**: [TanStack React Query](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/) (handles data caching, queries, and optimistic drag-and-drop state saves)
- **Drag-and-Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) (a maintained, React 18/19 compatible fork of `react-beautiful-dnd`)

---

## 🚀 Core Features

### 1. Authentication Flow (Login & Signup)
- Responsive, custom animated sign-up and login forms.
- Form data encoding (`application/x-www-form-urlencoded`) matching FastAPI's `OAuth2PasswordRequestForm` requirement.
- Bearer token mapping on Axios interceptors for authenticated API requests.
- Automatic routing redirects (`AuthGuard` and `PublicRoute` wrappers).

### 2. High-Level Project Dashboard
- Lists active projects allocated to the user.
- Performs parallel queries to aggregate real-time workspace metrics:
  - Total Backlog tasks
  - Active Work in Progress (WIP)
  - Done vs. Target counts
  - Accumulated estimated effort hours
  - Progress percentage trackers with animated bars

### 3. Drag-and-Drop Kanban Board
- 4-column workflow layout: **To Do**, **In Progress**, **In Review**, and **Done**.
- Integrated with drag-and-drop actions that execute immediate `PATCH` updates to change task statuses on the MongoDB database.
- Utilizes **Optimistic Updates**—cards snap to columns instantly, reverting gracefully in case of connectivity errors to ensure an instant-feedback user experience.
- Priority-based card styling and type badges (EPIC, TASK, SUBTASK, BUG).
- Text search and priority filters.

### 4. Role-based Ticket Creator Modal
- Allows clients and managers to raise new tickets.
- Pulls live assignee drop-down lists from the server.
- Restricts button accessibility based on authenticated Redux roles (Client/Manager/Admin).

---

## 📂 Project Directory Structure

```bash
Flowpilot-Client/
├── .vscode/               # VS Code workspace overrides (ignores Tailwind CSS linting markers)
├── src/
│   ├── api/               # Axios client instance, requests, and service configurations
│   │   ├── client.js      # Interceptors for auth token injection and 401 handling
│   │   ├── auth.js        # Form-urlencoded login and signup endpoints
│   │   ├── users.js       # Current user and assignment retrieval
│   │   └── tasks.js       # CRUD operations for Kanban tasks and status patches
│   ├── components/        # Reusable UI elements (Sidebar, Header, TaskCard, Modal wrapper)
│   ├── pages/             # App page views (Login, Signup, Dashboard, ProjectBoard)
│   ├── store/             # Redux slices and store configuration
│   ├── App.jsx            # App routes and Route Guard definitions
│   ├── index.css          # Tailwind imports, base classes, scrollbars, and scroll locking
│   └── main.jsx           # App entry point wrapping Redux & React Query providers
├── .env.example           # Environment template file
├── tailwind.config.js     # Brand colors, typography, shadow values, and extensions
├── postcss.config.js      # PostCSS configuration loading @tailwindcss/postcss
└── vite.config.js         # Build plugin and environment targets
```

---

## ⚡ Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### 1. Configuration
Copy the template environment variables:
```bash
cp .env.example .env
```
Ensure the API URL matches your running FastAPI server endpoint (defaults to `http://localhost:8000`):
```ini
VITE_API_URL=http://localhost:8000
```

### 2. Dependency Installation
Install all required node packages:
```bash
npm install
```

### 3. Running Locally
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Building for Production
Create the production-optimized build bundles:
```bash
npm run build
```
The compiled output will be generated inside the `/dist` directory.
