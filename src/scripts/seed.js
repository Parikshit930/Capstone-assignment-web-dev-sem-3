require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const { ROLES, ATTENDANCE_STATUS, ENROLLMENT_STATUS, ANNOUNCEMENT_TARGET, ANNOUNCEMENT_PRIORITY } = require('../config/constants');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Cleaning existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Section.deleteMany({}),
      Enrollment.deleteMany({}),
      Attendance.deleteMany({}),
      Announcement.deleteMany({})
    ]);

    console.log('[Seed] Seeding Users...');
    // 1 Admin, 3 Faculty, 5 Students
    const users = await User.create([
      {
        name: 'System Administrator',
        email: 'admin@campus.edu',
        password: 'Password@123',
        role: ROLES.ADMIN,
        department: 'Administration',
        phone: '+1-555-0100'
      },
      {
        name: 'Dr. Alan Turing',
        email: 'alan.turing@campus.edu',
        password: 'Password@123',
        role: ROLES.FACULTY,
        department: 'Computer Science',
        facultyId: 'FAC-CS-001',
        phone: '+1-555-0101'
      },
      {
        name: 'Dr. Grace Hopper',
        email: 'grace.hopper@campus.edu',
        password: 'Password@123',
        role: ROLES.FACULTY,
        department: 'Computer Science',
        facultyId: 'FAC-CS-002',
        phone: '+1-555-0102'
      },
      {
        name: 'Dr. Claude Shannon',
        email: 'claude.shannon@campus.edu',
        password: 'Password@123',
        role: ROLES.FACULTY,
        department: 'Data Science',
        facultyId: 'FAC-DS-001',
        phone: '+1-555-0103'
      },
      {
        name: 'Alice Johnson',
        email: 'alice@campus.edu',
        password: 'Password@123',
        role: ROLES.STUDENT,
        department: 'Computer Science',
        studentId: 'STU-2026-001',
        phone: '+1-555-0201'
      },
      {
        name: 'Bob Smith',
        email: 'bob@campus.edu',
        password: 'Password@123',
        role: ROLES.STUDENT,
        department: 'Computer Science',
        studentId: 'STU-2026-002',
        phone: '+1-555-0202'
      },
      {
        name: 'Charlie Davis',
        email: 'charlie@campus.edu',
        password: 'Password@123',
        role: ROLES.STUDENT,
        department: 'Computer Science',
        studentId: 'STU-2026-003',
        phone: '+1-555-0203'
      },
      {
        name: 'Diana Prince',
        email: 'diana@campus.edu',
        password: 'Password@123',
        role: ROLES.STUDENT,
        department: 'Data Science',
        studentId: 'STU-2026-004',
        phone: '+1-555-0204'
      },
      {
        name: 'Ethan Hunt',
        email: 'ethan@campus.edu',
        password: 'Password@123',
        role: ROLES.STUDENT,
        department: 'Data Science',
        studentId: 'STU-2026-005',
        phone: '+1-555-0205'
      }
    ]);

    const adminUser = users[0];
    const facultyTuring = users[1];
    const facultyHopper = users[2];
    const facultyShannon = users[3];
    const studentAlice = users[4];
    const studentBob = users[5];
    const studentCharlie = users[6];
    const studentDiana = users[7];
    const studentEthan = users[8];

    console.log(`[Seed] Seeded ${users.length} users.`);

    console.log('[Seed] Seeding Courses...');
    const courses = await Course.create([
      {
        courseCode: 'CS101',
        title: 'Introduction to Computer Science and Algorithms',
        description: 'Fundamental concepts of computer systems, algorithm design, and computational complexity.',
        credits: 4,
        department: 'Computer Science',
        semester: 1,
        syllabus: [
          { unit: 1, topic: 'Basic Computations and Logic' },
          { unit: 2, topic: 'Data Structures and Abstract Data Types' }
        ]
      },
      {
        courseCode: 'CS201',
        title: 'Backend Web Development with Node.js & Express',
        description: 'Building robust, scalable RESTful APIs, MVC architecture, middleware chaining and security.',
        credits: 4,
        department: 'Computer Science',
        semester: 3,
        syllabus: [
          { unit: 1, topic: 'Node.js Core Modules & Event Loop' },
          { unit: 2, topic: 'Express MVC Architecture' },
          { unit: 3, topic: 'MongoDB & Mongoose Validation' },
          { unit: 4, topic: 'Security, JWT & Socket.IO' }
        ]
      },
      {
        courseCode: 'DS101',
        title: 'Foundations of Data Science & Machine Learning',
        description: 'Statistical analysis, exploratory data analysis, regression, and data visualization.',
        credits: 3,
        department: 'Data Science',
        semester: 2,
        syllabus: [
          { unit: 1, topic: 'Descriptive & Inferential Statistics' },
          { unit: 2, topic: 'Predictive Modeling' }
        ]
      }
    ]);

    const courseCS101 = courses[0];
    const courseCS201 = courses[1];
    const courseDS101 = courses[2];
    console.log(`[Seed] Seeded ${courses.length} courses.`);

    console.log('[Seed] Seeding Sections & Faculty Assignments...');
    const sections = await Section.create([
      {
        sectionName: 'SECTION A',
        course: courseCS201._id,
        faculty: facultyTuring._id,
        academicYear: '2026-2027',
        term: 'Fall',
        roomNumber: 'Lab-301',
        schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
        maxCapacity: 40,
        currentEnrolled: 3
      },
      {
        sectionName: 'SECTION B',
        course: courseCS201._id,
        faculty: facultyHopper._id,
        academicYear: '2026-2027',
        term: 'Fall',
        roomNumber: 'Lab-302',
        schedule: 'Tue, Thu 02:00 PM - 03:30 PM',
        maxCapacity: 40,
        currentEnrolled: 2
      },
      {
        sectionName: 'SECTION A',
        course: courseDS101._id,
        faculty: facultyShannon._id,
        academicYear: '2026-2027',
        term: 'Fall',
        roomNumber: 'Hall-105',
        schedule: 'Fri 09:00 AM - 12:00 PM',
        maxCapacity: 50,
        currentEnrolled: 2
      }
    ]);

    const sectionCS201A = sections[0];
    const sectionCS201B = sections[1];
    const sectionDS101A = sections[2];
    console.log(`[Seed] Seeded ${sections.length} sections.`);

    console.log('[Seed] Seeding Enrollments...');
    const enrollments = await Enrollment.create([
      // CS201 Section A: Alice, Bob, Charlie
      { student: studentAlice._id, course: courseCS201._id, section: sectionCS201A._id, status: ENROLLMENT_STATUS.ENROLLED },
      { student: studentBob._id, course: courseCS201._id, section: sectionCS201A._id, status: ENROLLMENT_STATUS.ENROLLED },
      { student: studentCharlie._id, course: courseCS201._id, section: sectionCS201A._id, status: ENROLLMENT_STATUS.ENROLLED },

      // CS201 Section B: Diana, Ethan
      { student: studentDiana._id, course: courseCS201._id, section: sectionCS201B._id, status: ENROLLMENT_STATUS.ENROLLED },
      { student: studentEthan._id, course: courseCS201._id, section: sectionCS201B._id, status: ENROLLMENT_STATUS.ENROLLED },

      // DS101 Section A: Diana, Ethan
      { student: studentDiana._id, course: courseDS101._id, section: sectionDS101A._id, status: ENROLLMENT_STATUS.ENROLLED },
      { student: studentEthan._id, course: courseDS101._id, section: sectionDS101A._id, status: ENROLLMENT_STATUS.ENROLLED }
    ]);
    console.log(`[Seed] Seeded ${enrollments.length} enrollments.`);

    console.log('[Seed] Seeding Attendance Records with realistic attendance patterns...');
    // Seed 4 lecture sessions for CS201 Section A
    // Alice has 4/4 (100%), Bob has 3/4 (75%), Charlie has 1/4 (25% - Defaulter!)
    const d1 = new Date('2026-10-01');
    const d2 = new Date('2026-10-08');
    const d3 = new Date('2026-10-15');
    const d4 = new Date('2026-10-22');

    const attendances = await Attendance.create([
      {
        section: sectionCS201A._id,
        course: courseCS201._id,
        faculty: facultyTuring._id,
        date: d1,
        sessionNumber: 1,
        topicCovered: 'Introduction to Express.js and MVC architecture',
        records: [
          { student: studentAlice._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'On time' },
          { student: studentBob._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'On time' },
          { student: studentCharlie._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'On time' }
        ],
        auditLog: []
      },
      {
        section: sectionCS201A._id,
        course: courseCS201._id,
        faculty: facultyTuring._id,
        date: d2,
        sessionNumber: 2,
        topicCovered: 'Middleware chaining and centralized error handling',
        records: [
          { student: studentAlice._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'Active participation' },
          { student: studentBob._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'On time' },
          { student: studentCharlie._id, status: ATTENDANCE_STATUS.ABSENT, remarks: 'Unexcused' }
        ],
        auditLog: []
      },
      {
        section: sectionCS201A._id,
        course: courseCS201._id,
        faculty: facultyTuring._id,
        date: d3,
        sessionNumber: 3,
        topicCovered: 'Mongoose Schemas, Models & Validation',
        records: [
          { student: studentAlice._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'On time' },
          { student: studentBob._id, status: ATTENDANCE_STATUS.LATE, remarks: '10 min late' },
          { student: studentCharlie._id, status: ATTENDANCE_STATUS.ABSENT, remarks: 'Absent' }
        ],
        auditLog: []
      },
      {
        section: sectionCS201A._id,
        course: courseCS201._id,
        faculty: facultyTuring._id,
        date: d4,
        sessionNumber: 4,
        topicCovered: 'JWT Authentication and RBAC Middleware',
        records: [
          { student: studentAlice._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'On time' },
          { student: studentBob._id, status: ATTENDANCE_STATUS.PRESENT, remarks: 'On time' },
          { student: studentCharlie._id, status: ATTENDANCE_STATUS.ABSENT, remarks: 'Medical leave requested' }
        ],
        auditLog: [
          {
            modifiedBy: facultyTuring._id,
            modifiedAt: new Date('2026-10-23'),
            reason: 'Correction of session note',
            changedRecords: []
          }
        ]
      }
    ]);
    console.log(`[Seed] Seeded ${attendances.length} attendance sessions.`);

    console.log('[Seed] Seeding Announcements...');
    const announcements = await Announcement.create([
      {
        title: 'Fall 2026 Semester Schedule & Guidelines',
        content: 'Welcome to the new academic term. Students are advised to verify their course registrations by the end of this week.',
        priority: ANNOUNCEMENT_PRIORITY.HIGH,
        targetAudience: ANNOUNCEMENT_TARGET.ALL,
        createdBy: adminUser._id,
        isPinned: true
      },
      {
        title: 'CS201: Milestone Project Submission Deadline',
        content: 'Please submit your backend capstone source code repository link before Sunday 11:59 PM.',
        priority: ANNOUNCEMENT_PRIORITY.HIGH,
        targetAudience: ANNOUNCEMENT_TARGET.COURSE,
        course: courseCS201._id,
        createdBy: facultyTuring._id
      },
      {
        title: 'Section A: Guest Lecture on Distributed Microservices',
        content: 'An industry expert will conduct a special guest session in Lab-301 this Wednesday.',
        priority: ANNOUNCEMENT_PRIORITY.MEDIUM,
        targetAudience: ANNOUNCEMENT_TARGET.SECTION,
        section: sectionCS201A._id,
        createdBy: facultyTuring._id
      }
    ]);
    console.log(`[Seed] Seeded ${announcements.length} announcements.`);

    console.log('\n======================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY! ');
    console.log('======================================================');
    console.log('Sample Credentials (All passwords are "Password@123"):');
    console.log(' - Admin:   admin@campus.edu');
    console.log(' - Faculty: alan.turing@campus.edu');
    console.log(' - Faculty: grace.hopper@campus.edu');
    console.log(' - Student: alice@campus.edu (100% attendance)');
    console.log(' - Student: bob@campus.edu   (75% attendance)');
    console.log(' - Student: charlie@campus.edu (25% attendance - Defaulter)');
    console.log('======================================================\n');
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
};

if (require.main === module) {
  seedData()
    .then(() => disconnectDB())
    .catch(async () => {
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = seedData;
