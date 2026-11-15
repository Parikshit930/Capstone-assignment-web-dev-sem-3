const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const seedData = require('../src/scripts/seed');

jest.setTimeout(60000);

let adminToken = '';
let facultyTuringToken = '';
let facultyHopperToken = '';
let studentAliceToken = '';
let studentBobToken = '';
let studentCharlieToken = '';

let cs201Id = '';
let cs201SectionAId = '';
let cs201SectionBId = '';
let aliceId = '';
let bobId = '';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await seedData();

  // Login as Admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@campus.edu', password: 'Password@123' });
  adminToken = adminRes.body.data.tokens.accessToken;

  // Login as Faculty Turing (assigned to CS201 Section A)
  const turingRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alan.turing@campus.edu', password: 'Password@123' });
  facultyTuringToken = turingRes.body.data.tokens.accessToken;

  // Login as Faculty Hopper (assigned to CS201 Section B)
  const hopperRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'grace.hopper@campus.edu', password: 'Password@123' });
  facultyHopperToken = hopperRes.body.data.tokens.accessToken;

  // Login as Student Alice
  const aliceRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@campus.edu', password: 'Password@123' });
  studentAliceToken = aliceRes.body.data.tokens.accessToken;
  aliceId = aliceRes.body.data.user.id;

  // Login as Student Bob
  const bobRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'bob@campus.edu', password: 'Password@123' });
  studentBobToken = bobRes.body.data.tokens.accessToken;
  bobId = bobRes.body.data.user.id;

  // Login as Student Charlie
  const charlieRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'charlie@campus.edu', password: 'Password@123' });
  studentCharlieToken = charlieRes.body.data.tokens.accessToken;

  // Fetch course & section IDs
  const coursesRes = await request(app)
    .get('/api/courses')
    .set('Authorization', `Bearer ${adminToken}`);
  const cs201 = coursesRes.body.data.find(c => c.courseCode === 'CS201');
  cs201Id = cs201._id;

  const sectionsRes = await request(app)
    .get(`/api/sections?courseId=${cs201Id}`)
    .set('Authorization', `Bearer ${adminToken}`);
  const secA = sectionsRes.body.data.find(s => s.sectionName === 'SECTION A');
  const secB = sectionsRes.body.data.find(s => s.sectionName === 'SECTION B');
  cs201SectionAId = secA._id;
  cs201SectionBId = secB._id;
});

afterAll(async () => {
  await disconnectDB();
});

describe('1. Health Check Endpoint', () => {
  it('GET /api/health should return 200 and online status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toBe('University Campus Management API');
  });
});

describe('2. Authentication & JWT Token Management', () => {
  it('Success: Valid login returns 200, user data and JWT tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@campus.edu', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe('alice@campus.edu');
  });

  it('Negative: Login with invalid password returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@campus.edu', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('Validation Failure: Missing email and password returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('Refresh Token: Valid refresh token issues new tokens', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@campus.edu', password: 'Password@123' });

    const refToken = loginRes.body.data.tokens.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.tokens).toHaveProperty('accessToken');
    expect(refreshRes.body.data.tokens).toHaveProperty('refreshToken');
  });

  it('Duplicate Conflict: Registering an existing email returns 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Duplicate',
        email: 'alice@campus.edu',
        password: 'Password@123'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('3. Role-Based Access Control (RBAC) & Protected Routes', () => {
  it('Unauthorized: Request without token to protected route returns 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('No token provided');
  });

  it('Forbidden: Student attempting admin-only user management returns 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentAliceToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access forbidden');
  });

  it('Authorized: Admin accessing user management returns 200 and paginated list', async () => {
    const res = await request(app)
      .get('/api/users?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });
});

describe('4. Course & Section Management (CRUD & Validation)', () => {
  let createdCourseId = '';

  it('Success: Admin creates a new course CS301', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        courseCode: 'CS301',
        title: 'Distributed Systems & Cloud Computing',
        description: 'Advanced distributed architectures and consensus algorithms',
        credits: 4,
        department: 'Computer Science',
        semester: 5
      });

    expect(res.status).toBe(201);
    expect(res.body.data.course.courseCode).toBe('CS301');
    createdCourseId = res.body.data.course._id;
  });

  it('Duplicate Conflict: Creating course with same code returns 409', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        courseCode: 'CS301',
        title: 'Another Distributed Course',
        credits: 4,
        department: 'Computer Science',
        semester: 5
      });

    expect(res.status).toBe(409);
  });

  it('Not Found: Accessing invalid/non-existent course ID returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/courses/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('5. Enrollment Workflows & Business Rules', () => {
  it('Duplicate Enrollment Conflict: Enrolling in a course already enrolled in returns 409', async () => {
    const res = await request(app)
      .post('/api/enrollments/enroll')
      .set('Authorization', `Bearer ${studentAliceToken}`)
      .send({
        courseId: cs201Id,
        sectionId: cs201SectionAId
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already actively enrolled');
  });

  it('Success: Student views enrolled courses', async () => {
    const res = await request(app)
      .get('/api/enrollments/my-courses')
      .set('Authorization', `Bearer ${studentAliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.enrollments.length).toBeGreaterThan(0);
    expect(res.body.data.enrollments[0].course.courseCode).toBe('CS201');
  });
});

describe('6. Attendance Management & Business Rules Enforcement', () => {
  it('Success: Faculty Turing marks attendance for assigned section CS201 Section A', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${facultyTuringToken}`)
      .send({
        sectionId: cs201SectionAId,
        courseId: cs201Id,
        date: '2026-11-01',
        sessionNumber: 5,
        topicCovered: 'Real-time WebSockets with Socket.IO',
        records: [
          { student: aliceId, status: 'present', remarks: 'Good questions' },
          { student: bobId, status: 'present', remarks: 'On time' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.attendance.sessionNumber).toBe(5);
  });

  it('Forbidden: Faculty Hopper tries to mark attendance for Section A assigned to Turing', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${facultyHopperToken}`)
      .send({
        sectionId: cs201SectionAId,
        courseId: cs201Id,
        date: '2026-11-02',
        sessionNumber: 6,
        topicCovered: 'Unauthorized session attempt',
        records: [{ student: aliceId, status: 'present' }]
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('not authorized to mark attendance for a course/section not assigned to you');
  });

  it('Duplicate Attendance Conflict: Marking attendance twice for same date and session returns 409', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${facultyTuringToken}`)
      .send({
        sectionId: cs201SectionAId,
        courseId: cs201Id,
        date: '2026-11-01',
        sessionNumber: 5,
        topicCovered: 'Duplicate session',
        records: [{ student: aliceId, status: 'present' }]
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Duplicate Attendance Error');
  });

  it('Forbidden: Student Alice attempts to view Bob private attendance record', async () => {
    const res = await request(app)
      .get(`/api/attendance/student/${bobId}`)
      .set('Authorization', `Bearer ${studentAliceToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('cannot view another student private attendance record');
  });

  it('Success: Student Alice views her own attendance percentage and session list', async () => {
    const res = await request(app)
      .get('/api/attendance/student')
      .set('Authorization', `Bearer ${studentAliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summaries');
    expect(res.body.data).toHaveProperty('detailedSessions');
    expect(res.body.data.summaries.length).toBeGreaterThan(0);
    expect(res.body.data.summaries[0].percentage).toBeGreaterThanOrEqual(75);
  });
});

describe('7. Announcements & Permissions', () => {
  it('Success: Admin creates global university announcement', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Campus Hackathon 2026',
        content: 'Registration is now open for the annual 48-hour hackathon!',
        priority: 'high',
        targetAudience: 'all'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.announcement.title).toBe('Campus Hackathon 2026');
  });

  it('Forbidden: Student tries to create an announcement returns 403', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${studentAliceToken}`)
      .send({
        title: 'Spam announcement',
        content: 'Should be rejected',
        targetAudience: 'all'
      });

    expect(res.status).toBe(403);
  });
});

describe('8. MongoDB Aggregation Pipelines (Reports & Analytics)', () => {
  it('Aggregation Pipeline 1: Subject-wise attendance calculation & defaulters threshold', async () => {
    const res = await request(app)
      .get('/api/reports/attendance-analytics?threshold=75&defaultersOnly=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('threshold', 75);
    expect(res.body.data).toHaveProperty('defaultersCount');
    expect(Array.isArray(res.body.data.analytics)).toBe(true);

    // Charlie Davis has < 75% attendance so he should be flagged as defaulter
    const charlie = res.body.data.analytics.find(a => a.student.name === 'Charlie Davis');
    if (charlie) {
      expect(charlie.isDefaulter).toBe(true);
      expect(charlie.attendancePercentage).toBeLessThan(75);
    }
  });

  it('Aggregation Pipeline 2: Section & Course Enrolment Capacity Analytics', async () => {
    const res = await request(app)
      .get('/api/reports/enrollment-capacity')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalSectionsAnalyzed');
    expect(Array.isArray(res.body.data.sections)).toBe(true);
    expect(res.body.data.sections[0]).toHaveProperty('occupancyPercentage');
    expect(res.body.data.sections[0]).toHaveProperty('remainingCapacity');
  });

  it('Aggregation Pipeline 3: Department-wise Academic Summary', async () => {
    const res = await request(app)
      .get('/api/reports/department-summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.departments)).toBe(true);
    expect(res.body.data.departments.length).toBeGreaterThan(0);
  });
});
