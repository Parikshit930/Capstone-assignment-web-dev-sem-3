const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token.util');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Section = require('../models/Section');
const { appEvents, EVENT_NAMES } = require('../events/appEvents');
const { ROLES, ANNOUNCEMENT_TARGET } = require('../config/constants');

let ioInstance = null;

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User inactive or not found'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      next();
    } catch (err) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`[Socket.IO] User connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    // Join user's personal notification room
    socket.join(`user:${user.id}`);
    // Join global university announcement room
    socket.join('room:global');

    // Auto-join relevant academic rooms
    try {
      if (user.role === ROLES.STUDENT) {
        const enrollments = await Enrollment.find({
          student: user.id,
          status: 'enrolled'
        }).select('course section');

        enrollments.forEach(enr => {
          socket.join(`course:${enr.course.toString()}`);
          socket.join(`section:${enr.section.toString()}`);
        });
      } else if (user.role === ROLES.FACULTY) {
        const sections = await Section.find({
          faculty: user.id,
          isActive: true
        }).select('_id course');

        sections.forEach(sec => {
          socket.join(`course:${sec.course.toString()}`);
          socket.join(`section:${sec._id.toString()}`);
        });
      }
    } catch (roomErr) {
      console.error('[Socket.IO] Error joining academic rooms:', roomErr.message);
    }

    // Client room join handler
    socket.on('join:room', (roomName) => {
      socket.join(roomName);
      socket.emit('room:joined', { room: roomName, status: 'success' });
    });

    socket.on('leave:room', (roomName) => {
      socket.leave(roomName);
      socket.emit('room:left', { room: roomName, status: 'success' });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${user.name} (${socket.id})`);
    });
  });

  // Decoupled App Event Listeners connecting to Socket.IO broadcasts
  appEvents.on(EVENT_NAMES.ANNOUNCEMENT_CREATED, (announcement) => {
    if (!ioInstance) return;

    const payload = {
      event: 'announcement:new',
      announcement: {
        id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        createdBy: announcement.createdBy?.name || 'Administrator',
        course: announcement.course,
        section: announcement.section,
        createdAt: announcement.createdAt
      }
    };

    if (announcement.targetAudience === ANNOUNCEMENT_TARGET.ALL) {
      ioInstance.to('room:global').emit('announcement:new', payload);
      console.log(`[Socket.IO] Broadcasted global announcement: "${announcement.title}"`);
    } else if (announcement.targetAudience === ANNOUNCEMENT_TARGET.COURSE && announcement.course) {
      const courseId = announcement.course._id || announcement.course;
      ioInstance.to(`course:${courseId}`).emit('announcement:new', payload);
      console.log(`[Socket.IO] Emitted course announcement to room course:${courseId}`);
    } else if (announcement.targetAudience === ANNOUNCEMENT_TARGET.SECTION && announcement.section) {
      const sectionId = announcement.section._id || announcement.section;
      ioInstance.to(`section:${sectionId}`).emit('announcement:new', payload);
      console.log(`[Socket.IO] Emitted section announcement to room section:${sectionId}`);
    }
  });

  appEvents.on(EVENT_NAMES.ATTENDANCE_MARKED, (data) => {
    if (!ioInstance) return;

    // Broadcast attendance update to section room
    ioInstance.to(`section:${data.sectionId}`).emit('attendance:recorded', {
      sectionId: data.sectionId,
      courseId: data.courseId,
      sessionNumber: data.sessionNumber,
      date: data.date,
      message: `Attendance for session #${data.sessionNumber} has been recorded.`
    });

    // Notify individual students privately
    if (Array.isArray(data.records)) {
      data.records.forEach(rec => {
        ioInstance.to(`user:${rec.student}`).emit('attendance:personal_status', {
          sessionNumber: data.sessionNumber,
          date: data.date,
          status: rec.status,
          remarks: rec.remarks
        });
      });
    }
  });

  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO
};
