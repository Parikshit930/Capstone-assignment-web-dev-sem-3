# University Campus Management System - Backend Architecture & REST API

[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/Authentication-JWT%20%2B%20Bcrypt-orange.svg)](https://jwt.io/)
[![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO%204.8-black.svg)](https://socket.io/)
[![Test Coverage](https://img.shields.io/badge/Tests-Jest%20100%25%20Passing-success.svg)](https://jestjs.io/)

---

## 1. Project Overview

The **University Campus Management System** is an enterprise-grade backend platform built with **Node.js, Express.js, MongoDB, and Mongoose**. It orchestrates critical university workflows including student enrollment, faculty allocations, course administration, section management, session-based attendance recording with audit trails, real-time campus announcements, and academic analytics powered by MongoDB aggregation pipelines.

The platform enforces strict **Role-Based Access Control (RBAC)** across three distinct personas:
- **Administrator**: Controls global system settings, user lifecycle, course catalog, section allocations, and institutional announcements.
- **Faculty**: Manages assigned sections, records and audits session attendance, and broadcasts course-specific announcements.
- **Student**: Inspects enrolled courses, verifies personal attendance percentages across subjects, and receives real-time campus notifications.

---

## 2. System Architecture (MVC & Layered Structure)

```
                            ┌──────────────────────────────────┐
                            │    Client (Postman / Browser)    │
                            └─────────────────┬────────────────┘
                                              │ HTTP / WebSocket (JWT)
                                              ▼
                            ┌──────────────────────────────────┐
                            │      Express Server / Sockets    │
                            │ (Helmet, CORS, Morgan, Body-JSON)│
                            └─────────────────┬────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │       REST Routes       │                     │    Socket.IO Handler    │
         └────────────┬────────────┘                     └────────────┬────────────┘
                      │                                               │
         ┌────────────▼────────────┐                     ┌────────────▼────────────┐
         │  Middleware Pipeline    │                     │   Authenticated Handshake│
         │ • JWT Authenticate      │                     │   & Academic Room Joins │
         │ • Role-Based (RBAC)     │                     └─────────────────────────┘
         │ • Express-Validator     │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │       Controllers       │◄────────────┐
         │   (Business Logic &     │             │ Decoupled App Events
         │    Status Code Map)     │             │ (EventEmitter)
         └────────────┬────────────┘             │
                      │                          │
         ┌────────────▼────────────┐             │
         │     Mongoose Models     │─────────────┘
         │ (Schemas, Indexes,      │
         │  Validation, Aggregation│
         └────────────┬────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │     MongoDB Database    │
         └─────────────────────────┘
```

### Folder Structure
```
Capstone/
├── .env.example                                      # Environment template
├── .gitignore                                        # Ignored files
├── package.json                                      # Dependencies and scripts
├── University_Campus_Management_API.postman_collection.json # Complete API collection
├── README.md                                         # Comprehensive documentation
├── PROJECT_REPORT.md                                 # Full Academic Capstone Report
├── src/
│   ├── app.js                                        # Express application configuration
│   ├── server.js                                     # HTTP server & Socket.IO initialization
│   ├── config/
│   │   ├── constants.js                              # Enumerations & system thresholds
│   │   └── db.js                                     # Resilient MongoDB connection handler
│   ├── controllers/
│   │   ├── announcement.controller.js                # Announcements CRUD & broadcasts
│   │   ├── attendance.controller.js                  # Session attendance & audit trail
│   │   ├── auth.controller.js                        # JWT Auth, refresh rotation, logout
│   │   ├── course.controller.js                      # Course CRUD & catalog
│   │   ├── enrollment.controller.js                  # Course enrollments & capacity checks
│   │   ├── report.controller.js                      # MongoDB Aggregation pipelines
│   │   ├── section.controller.js                     # Section management & faculty assignment
│   │   └── user.controller.js                        # Admin user directory
│   ├── events/
│   │   └── appEvents.js                              # Decoupled Node.js EventEmitter
│   ├── middleware/
│   │   ├── auth.middleware.js                        # JWT Bearer token verification
│   │   ├── error.middleware.js                       # Centralized error handler & 404 router
│   │   ├── role.middleware.js                        # Role-based access control (RBAC)
│   │   └── validate.middleware.js                    # Express-validator result parser
│   ├── models/
│   │   ├── Announcement.js                           # Priority & room-targeted announcements
│   │   ├── Attendance.js                             # Session records & revision audit log
│   │   ├── Course.js                                 # Course catalog & syllabus structure
│   │   ├── Enrollment.js                             # Compound-indexed student enrollments
│   │   ├── Section.js                                # Course sections, faculty, capacity
│   │   └── User.js                                   # User schema, bcrypt hash, role guards
│   ├── routes/
│   │   ├── announcement.routes.js
│   │   ├── attendance.routes.js
│   │   ├── auth.routes.js
│   │   ├── course.routes.js
│   │   ├── enrollment.routes.js
│   │   ├── index.js                                  # Root router + /api/health
│   │   ├── report.routes.js
│   │   ├── section.routes.js
│   │   └── user.routes.js
│   ├── scripts/
│   │   └── seed.js                                   # Realistic database seeder
│   ├── sockets/
│   │   └── socketHandler.js                          # JWT-authenticated WebSocket handler
│   └── utils/
│       ├── apiResponse.js                            # Uniform standard API responses
│       ├── token.util.js                             # Access & refresh token generation
│       └── validators.js                             # Express-validator schema rules
└── tests/
    └── api.test.js                                   # 24 automated Jest / Supertest tests
```

---

## 3. Technology Stack & Concepts Demonstrated

| Component | Technology | Syllabus Unit | Purpose |
|---|---|---|---|
| **Runtime** | Node.js (v20+) | Unit 1 | Asynchronous non-blocking runtime, core modules (`http`, `events`), process management. |
| **Framework** | Express.js 4.x | Unit 2 | RESTful routing, MVC pattern, middleware chaining, centralized error handling. |
| **Database** | MongoDB & Mongoose 8.x | Unit 3 | Schemas, validation, compound indexes, `$lookup` & `$group` aggregation pipelines. |
| **Security** | bcryptjs, JWT, Helmet | Unit 4 | Password hashing (salt rounds: 10), short-lived access tokens, refresh token rotation, RBAC. |
| **Real-Time** | Socket.IO 4.x & EventEmitter | Unit 4 | Decoupled domain event dispatching and room-targeted WebSocket broadcasts. |
| **Testing** | Jest & Supertest | All Units | Automated integration tests for success, validation failure, 404, 401, 403, and 409 conflict cases. |

---

## 4. Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (Local service on port 27017 or MongoDB Atlas connection string)
  > *Note: If a local MongoDB instance is not detected, the system automatically initializes an in-memory MongoDB server for testing and evaluation.*

### Step 1: Clone and Navigate
```bash
cd "e:/SEMESTER-3/Web - Dev/Capstone"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory (copied from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/campus_management_db

# Security & Token Configurations
JWT_ACCESS_SECRET=campus_jwt_access_super_secret_key_2026_xyz
JWT_REFRESH_SECRET=campus_jwt_refresh_super_secret_key_2026_abc
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Academic Business Rules
ATTENDANCE_MIN_THRESHOLD=75
CLIENT_ORIGIN=http://localhost:3000
```

### Step 4: Seed the Database
Populate realistic academic data (Users, Courses, Sections, Enrollments, Attendance with Defaulters, Announcements):
```bash
npm run seed
```

### Step 5: Start the Application
- **Development Mode** (with live reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

### Step 6: Execute Automated Test Suite
Run the 24 comprehensive automated integration test cases:
```bash
npm test
```

---

## 5. Seeded Test Credentials

All test accounts are configured with the universal password: `Password@123`

| Role | Name | Email | Details / Context |
|---|---|---|---|
| **Admin** | System Administrator | `admin@campus.edu` | Full platform privileges |
| **Faculty** | Dr. Alan Turing | `alan.turing@campus.edu` | Teaches CS201 Section A |
| **Faculty** | Dr. Grace Hopper | `grace.hopper@campus.edu` | Teaches CS201 Section B |
| **Faculty** | Dr. Claude Shannon | `claude.shannon@campus.edu` | Teaches DS101 Section A |
| **Student** | Alice Johnson | `alice@campus.edu` | Enrolled in CS201-A (100% Attendance) |
| **Student** | Bob Smith | `bob@campus.edu` | Enrolled in CS201-A (75% Attendance) |
| **Student** | Charlie Davis | `charlie@campus.edu` | Enrolled in CS201-A (**25% Attendance - Defaulter**) |
| **Student** | Diana Prince | `diana@campus.edu` | Enrolled in CS201-B & DS101-A |
| **Student** | Ethan Hunt | `ethan@campus.edu` | Enrolled in CS201-B & DS101-A |

---

## 6. REST API Specification

### Authentication & Profile (`/api/auth`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | Public | Register new student or administrative user creation |
| `POST` | `/api/auth/login` | None | Public | Authenticates credentials, issues access & refresh tokens |
| `POST` | `/api/auth/refresh` | None | Public | Validates refresh token and rotates token pair |
| `POST` | `/api/auth/logout` | Bearer | Any | Invalidates active refresh token in database |
| `GET` | `/api/auth/me` | Bearer | Any | Returns currently authenticated user identity |
| `PATCH`| `/api/auth/profile`| Bearer | Any | Updates permitted user profile attributes |

### User Management (`/api/users`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/users` | Bearer | Admin | Paginated list of users with role & department filters |
| `GET` | `/api/users/:id` | Bearer | Admin | Retrieve individual user record |
| `POST` | `/api/users` | Bearer | Admin | Create user account with explicit role assignment |
| `PATCH`| `/api/users/:id` | Bearer | Admin | Update user status, role, or department |
| `DELETE`| `/api/users/:id`| Bearer | Admin | Soft delete / remove user from system |

### Courses & Sections (`/api/courses`, `/api/sections`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/courses` | Bearer | Any | Search and filter active course catalog |
| `GET` | `/api/courses/:id` | Bearer | Any | Get course syllabus and assigned active sections |
| `POST` | `/api/courses` | Bearer | Admin | Create new course (e.g., CS401) |
| `PATCH`| `/api/courses/:id` | Bearer | Admin | Update course syllabus, title, or credits |
| `DELETE`| `/api/courses/:id`| Bearer | Admin | Delete course (prevented if sections exist) |
| `GET` | `/api/sections` | Bearer | Any | List all sections with course & faculty references |
| `GET` | `/api/sections/my-assigned` | Bearer | Faculty | List sections assigned to logged-in faculty member |
| `POST` | `/api/sections` | Bearer | Admin | Create section and assign faculty member |
| `PATCH`| `/api/sections/:id` | Bearer | Admin | Reassign faculty, modify schedule or capacity |

### Enrollment Management (`/api/enrollments`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/enrollments/enroll` | Bearer | Student, Admin | Enroll in course section (capacity & duplicate checked) |
| `DELETE`| `/api/enrollments/:id/drop` | Bearer | Student, Admin | Drop course enrollment and increment available capacity |
| `GET` | `/api/enrollments/my-courses` | Bearer | Student | List courses and sections current student is enrolled in |
| `GET` | `/api/enrollments/section/:sectionId` | Bearer | Faculty, Admin | Roster of students enrolled in specific section |

### Attendance Tracking & Audit (`/api/attendance`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/attendance/mark` | Bearer | Faculty, Admin | Mark session attendance (faculty assignment verified) |
| `PATCH`| `/api/attendance/:id` | Bearer | Faculty, Admin | Correct attendance with mandatory revision audit reason |
| `GET` | `/api/attendance/section/:sectionId` | Bearer | Faculty, Admin | Historical attendance logs for an entire section |
| `GET` | `/api/attendance/student/:studentId?`| Bearer | Any | View subject-wise percentage and attendance breakdown |

### Announcements (`/api/announcements`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/announcements` | Bearer | Any | Get announcements filtered by user eligibility |
| `POST` | `/api/announcements` | Bearer | Faculty, Admin | Post announcement and trigger real-time broadcast |
| `DELETE`| `/api/announcements/:id` | Bearer | Creator, Admin | Remove announcement |

### Reports & Aggregation Analytics (`/api/reports`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/reports/attendance-analytics` | Bearer | Faculty, Admin | **Aggregation Pipeline 1**: Subject attendance % and defaulters below threshold |
| `GET` | `/api/reports/enrollment-capacity` | Bearer | Faculty, Admin | **Aggregation Pipeline 2**: Section capacity utilization & occupancy rates |
| `GET` | `/api/reports/department-summary` | Bearer | Faculty, Admin | **Aggregation Pipeline 3**: Department-wise course counts and average credits |

---

## 7. MongoDB Aggregation Pipelines

### Pipeline 1: Attendance Percentage Calculation & Defaulter List
- **Purpose**: Computes exact percentage of attended classes per student per subject, compares against minimum threshold (default: 75%), and filters academic defaulters.
- **Stages**:
  1. `$match`: Filters by specific course or section if requested.
  2. `$unwind: "$records"`: Deconstructs session attendance array.
  3. `$group`: Groups by `{ student: "$records.student", course: "$course" }` and calculates total classes and attended classes (`present` + `late`).
  4. `$project`: Calculates percentage:
     $$\text{Attendance \%} = \left(\frac{\text{Attended Classes}}{\text{Total Classes}}\right) \times 100$$
  5. `$lookup`: Joins with `users` collection for student name, student ID, and email.
  6. `$lookup`: Joins with `courses` collection for course code and title.
  7. `$match`: Filters `{ attendancePercentage: { $lt: threshold } }` when `defaultersOnly=true`.
  8. `$sort`: Ascending sort by attendance percentage.

### Pipeline 2: Section Capacity & Enrollment Analytics
- **Purpose**: Calculates real-time occupancy percentage and remaining capacity across all sections.
- **Stages**:
  1. `$match: { status: "enrolled" }`: Filters active enrollments.
  2. `$group`: Groups by `{ course, section }` and calculates `enrolledCount: { $sum: 1 }`.
  3. `$lookup`: Joins `sections`, `courses`, and `users` (assigned faculty).
  4. `$project`:
     $$\text{Occupancy \%} = \left(\frac{\text{Enrolled Count}}{\text{Max Capacity}}\right) \times 100$$
  5. `$sort`: Sorted by course code and section name.

---

## 8. Real-Time Architecture (Socket.IO & EventEmitter)

### Decoupled Node.js EventEmitter (`src/events/appEvents.js`)
The application utilizes an internal `EventEmitter` instance to decouple controller write operations from side-effect notification tasks:
1. `attendance.marked`: Dispatched upon saving a class session. Triggers room notification and student status alerts.
2. `announcement.created`: Dispatched when faculty or admin creates an announcement. Dispatches to targeted rooms.
3. `enrollment.created`: Dispatched upon student enrollment.

### Socket.IO Integration (`src/sockets/socketHandler.js`)
- **Handshake Authentication**: Handshake middleware verifies the JWT bearer token before socket connection is accepted.
- **Room Topology**:
  - `user:<userId>`: Private notifications (e.g. personal absence alerts).
  - `room:global`: University-wide broadcasts.
  - `course:<courseId>`: All students and faculty associated with a course.
  - `section:<sectionId>`: Live attendance updates for a specific section.

---

## 9. Viva Voce & Technical Defense Guide

During faculty evaluation, students may be asked to explain design decisions. Use the guide below:

### Q1: Explain the execution flow of a request.
> **Flow**: `HTTP Client` $\rightarrow$ `app.js (Helmet, CORS, Body-parser)` $\rightarrow$ `Router (/api/attendance/mark)` $\rightarrow$ `auth.middleware (verify JWT)` $\rightarrow$ `role.middleware (check if user is Faculty/Admin)` $\rightarrow$ `validate.middleware (check express-validator constraints)` $\rightarrow$ `attendance.controller` $\rightarrow$ `Attendance Model (Mongoose schema validation & compound indexes)` $\rightarrow$ `MongoDB Engine` $\rightarrow$ `appEvents.emit()` $\rightarrow$ `Standardized ApiResponse (201 Created JSON)`.

### Q2: How does the system prevent duplicate attendance records?
> Through two layers:
> 1. **Database Layer**: Compound unique index `{ section: 1, date: 1, sessionNumber: 1 }` on the `Attendance` collection.
> 2. **Controller Layer**: Explicit check querying for existing records matching section, normalized date, and session number, returning a `409 Conflict` before write.

### Q3: How is Role-Based Access Control (RBAC) enforced?
> RBAC is enforced purely on the server via the higher-order middleware function `authorize(...roles)`. If `req.user.role` is not contained in the authorized roles array, the request immediately terminates with `403 Forbidden`.

### Q4: Why use both Access Tokens and Refresh Tokens?
> Access tokens are short-lived (15 minutes) to minimize the attack window if intercepted. Refresh tokens (7 days) are stored in the database, allowing immediate revocation upon logout while maintaining frictionless session renewal without repeatedly asking for user credentials.
