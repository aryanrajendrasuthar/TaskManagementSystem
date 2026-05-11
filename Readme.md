# TaskFlow — Team Task Management System

A full-stack, real-time Kanban task management application built with React, Node.js, PostgreSQL, Redis, and Socket.io.

## Features

- **Kanban Board** — Drag-and-drop task management with optimistic UI updates powered by `@dnd-kit`
- **Real-time Collaboration** — Live updates across all connected clients via Socket.io + Redis pub/sub
- **Workspaces & Boards** — Multi-workspace support with multiple boards per workspace
- **Role-Based Access Control** — OWNER / ADMIN / MEMBER roles enforced per workspace
- **Task Details** — Rich-text descriptions (react-quill), priority levels, due dates, labels, assignees, file attachments
- **Activity Timeline** — Full audit log of task changes per task
- **Notifications** — In-app notification center + optional email notifications (Gmail SMTP)
- **File Uploads** — Multer-based file attachment support (images, PDF, Word, Excel; 10 MB limit)
- **JWT Auth** — Stateless authentication with secure token storage

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| State | React Context + Zustand |
| Backend | Node.js, Express.js, TypeScript |
| Real-time | Socket.io 4, Redis pub/sub (ioredis) |
| Database | PostgreSQL 15, Prisma ORM |
| Auth | JWT, bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| File Uploads | Multer (disk storage) |
| Containerization | Docker, Docker Compose |

## Project Structure

```
TaskManagementSystem/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── boardController.ts
│   │   │   ├── taskController.ts
│   │   │   └── workspaceController.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts          # Prisma client singleton
│   │   │   └── redis.ts           # Redis clients (main, pub, sub)
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT + RBAC middleware
│   │   │   └── upload.ts          # Multer file upload
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── boards.ts
│   │   │   ├── tasks.ts
│   │   │   └── workspaces.ts
│   │   ├── services/
│   │   │   └── emailService.ts    # Nodemailer email helpers
│   │   ├── socket/
│   │   │   └── socketHandlers.ts  # Socket.io event handlers
│   │   └── server.ts              # Express app + HTTP server
│   ├── .env                       # Local dev environment variables
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board/
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   ├── KanbanColumn.tsx
│   │   │   │   └── TaskCard.tsx
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── Task/
│   │   │   │   └── TaskDetailModal.tsx
│   │   │   └── Workspace/
│   │   │       └── TeamPanel.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── SocketContext.tsx
│   │   │   └── WorkspaceContext.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── services/
│   │   │   └── api.ts             # Axios instance + all API calls
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript interfaces
│   │   ├── App.tsx                # React Router + providers
│   │   ├── main.tsx
│   │   └── index.css              # Tailwind + Quill overrides
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+ (optional — app runs without Redis, just without distributed caching)
- Docker & Docker Compose (for containerized setup)

### Option A — Local Development

**1. Clone and install**

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

**2. Set up environment**

```bash
cp .env.example backend/.env
# Edit backend/.env with your PostgreSQL and Redis connection strings
```

**3. Start PostgreSQL and Redis** (using Docker for convenience)

```bash
docker run -d --name taskflow_pg \
  -e POSTGRES_USER=taskflow \
  -e POSTGRES_PASSWORD=taskflow_secret \
  -e POSTGRES_DB=taskflow \
  -p 5432:5432 postgres:15-alpine

docker run -d --name taskflow_redis -p 6379:6379 redis:7-alpine
```

**4. Run database migrations**

```bash
cd backend
npx prisma migrate dev --name init
```

**5. Start development servers**

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Option B — Docker Compose (Production-like)

```bash
# Copy and configure env
cp .env.example .env
# Edit .env with your JWT_SECRET and optional SMTP credentials

# Build and start all services
docker compose up --build -d

# Run migrations
docker compose exec backend npx prisma migrate deploy
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWTs | — |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:5173` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username / email | — |
| `SMTP_PASS` | SMTP password / app password | — |
| `FROM_EMAIL` | Sender display name + email | — |

> Email is optional — if `SMTP_USER` or `SMTP_PASS` are empty, the app skips sending emails silently.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Workspaces
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/workspaces` | List user workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces/:id` | Get workspace with members + boards |
| POST | `/api/workspaces/:id/members` | Invite member |

### Boards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/workspaces/:wId/boards` | List boards |
| POST | `/api/workspaces/:wId/boards` | Create board (auto-creates 4 columns) |
| GET | `/api/workspaces/:wId/boards/:bId` | Get board with columns + tasks |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/columns/:columnId/tasks` | Create task |
| GET | `/api/tasks/:taskId` | Get task with activity log |
| PATCH | `/api/tasks/:taskId` | Update task |
| PATCH | `/api/tasks/:taskId/move` | Move task to column |
| DELETE | `/api/tasks/:taskId` | Delete task |
| POST | `/api/tasks/:taskId/attachments` | Upload file attachment |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/read` | Mark all as read |

## Socket.io Events

### Client → Server
| Event | Payload |
|---|---|
| `workspace:join` | `workspaceId: string` |

### Server → Client
| Event | Payload |
|---|---|
| `task:created` | `{ task, columnId }` |
| `task:updated` | `{ task }` |
| `task:moved` | `{ task, oldColumnId, newColumnId, boardId }` |
| `task:deleted` | `{ taskId, columnId, boardId }` |
| `user:joined` | `{ userId }` |

## Role Permissions

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| Invite members | ✅ | ✅ | ❌ |
| Create/delete boards | ✅ | ✅ | ❌ |
| Create/update/move tasks | ✅ | ✅ | ✅ |
| Delete tasks | ✅ | ✅ | ✅ |
| Delete workspace | ✅ | ❌ | ❌ |
