const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const ApiResponse = require('../utils/apiResponse');
const { DEFAULT_ATTENDANCE_THRESHOLD } = require('../config/constants');

/**
 * Aggregation Pipeline 1: Subject-wise attendance calculation & Low Attendance Defaulter List
 * Calculates attendance percentage per student per subject, and filters by configurable threshold.
 */
const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const { courseId, sectionId, threshold = DEFAULT_ATTENDANCE_THRESHOLD, defaultersOnly = 'false' } = req.query;
    const minThreshold = Number(threshold);

    const matchStage = {};
    if (courseId) {
      matchStage.course = new mongoose.Types.ObjectId(courseId);
    }
    if (sectionId) {
      matchStage.section = new mongoose.Types.ObjectId(sectionId);
    }

    const pipeline = [
      // Stage 1: Filter by course / section if provided
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

      // Stage 2: Deconstruct records array to handle each student record individually
      { $unwind: '$records' },

      // Stage 3: Group by student and course
      {
        $group: {
          _id: {
            student: '$records.student',
            course: '$course'
          },
          totalClasses: { $sum: 1 },
          attendedClasses: {
            $sum: {
              $cond: [
                { $in: ['$records.status', ['present', 'late']] },
                1,
                0
              ]
            }
          },
          absentClasses: {
            $sum: {
              $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0]
            }
          },
          excusedClasses: {
            $sum: {
              $cond: [{ $eq: ['$records.status', 'excused'] }, 1, 0]
            }
          }
        }
      },

      // Stage 4: Compute attendance percentage
      {
        $project: {
          studentId: '$_id.student',
          courseId: '$_id.course',
          totalClasses: 1,
          attendedClasses: 1,
          absentClasses: 1,
          excusedClasses: 1,
          attendancePercentage: {
            $round: [
              {
                $multiply: [
                  {
                    $cond: [
                      { $eq: ['$totalClasses', 0] },
                      0,
                      { $divide: ['$attendedClasses', '$totalClasses'] }
                    ]
                  },
                  100
                ]
              },
              2
            ]
          }
        }
      },

      // Stage 5: Lookup student user details
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },

      // Stage 6: Lookup course details
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },

      // Stage 7: Filter by threshold if defaultersOnly is true
      ...(defaultersOnly === 'true'
        ? [
            {
              $match: {
                attendancePercentage: { $lt: minThreshold }
              }
            }
          ]
        : []),

      // Stage 8: Format final projection
      {
        $project: {
          _id: 0,
          student: {
            id: '$student._id',
            name: '$student.name',
            email: '$student.email',
            studentId: '$student.studentId',
            department: '$student.department'
          },
          course: {
            id: '$course._id',
            courseCode: '$course.courseCode',
            title: '$course.title',
            department: '$course.department'
          },
          totalClasses: 1,
          attendedClasses: 1,
          absentClasses: 1,
          excusedClasses: 1,
          attendancePercentage: 1,
          isDefaulter: {
            $lt: ['$attendancePercentage', minThreshold]
          }
        }
      },

      // Stage 9: Sort by attendance percentage ascending (defaulters first)
      { $sort: { attendancePercentage: 1, 'student.name': 1 } }
    ];

    const results = await Attendance.aggregate(pipeline);

    const defaultersCount = results.filter(r => r.isDefaulter).length;

    return ApiResponse.success(res, 'Attendance analytics generated successfully', {
      threshold: minThreshold,
      totalEvaluated: results.length,
      defaultersCount,
      analytics: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aggregation Pipeline 2: Course & Section Enrolment Capacity Analytics
 * Aggregates section-wise student counts, capacity utilization percentage, and faculty assignments.
 */
const getEnrollmentCapacityAnalytics = async (req, res, next) => {
  try {
    const pipeline = [
      // Stage 1: Filter only active enrollments
      { $match: { status: 'enrolled' } },

      // Stage 2: Group by section and course
      {
        $group: {
          _id: {
            course: '$course',
            section: '$section'
          },
          enrolledCount: { $sum: 1 }
        }
      },

      // Stage 3: Join section details
      {
        $lookup: {
          from: 'sections',
          localField: '_id.section',
          foreignField: '_id',
          as: 'section'
        }
      },
      { $unwind: '$section' },

      // Stage 4: Join course details
      {
        $lookup: {
          from: 'courses',
          localField: '_id.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },

      // Stage 5: Join faculty assigned to section
      {
        $lookup: {
          from: 'users',
          localField: 'section.faculty',
          foreignField: '_id',
          as: 'faculty'
        }
      },
      { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },

      // Stage 6: Calculate capacity utilization and format projection
      {
        $project: {
          _id: 0,
          sectionId: '$section._id',
          sectionName: '$section.sectionName',
          academicYear: '$section.academicYear',
          roomNumber: '$section.roomNumber',
          schedule: '$section.schedule',
          maxCapacity: '$section.maxCapacity',
          enrolledCount: 1,
          remainingCapacity: {
            $subtract: ['$section.maxCapacity', '$enrolledCount']
          },
          occupancyPercentage: {
            $round: [
              {
                $multiply: [
                  {
                    $cond: [
                      { $eq: ['$section.maxCapacity', 0] },
                      0,
                      { $divide: ['$enrolledCount', '$section.maxCapacity'] }
                    ]
                  },
                  100
                ]
              },
              2
            ]
          },
          course: {
            id: '$course._id',
            courseCode: '$course.courseCode',
            title: '$course.title',
            credits: '$course.credits',
            department: '$course.department'
          },
          faculty: {
            id: '$faculty._id',
            name: '$faculty.name',
            email: '$faculty.email',
            facultyId: '$faculty.facultyId'
          }
        }
      },

      // Stage 7: Sort by course code and section name
      { $sort: { 'course.courseCode': 1, sectionName: 1 } }
    ];

    const results = await Enrollment.aggregate(pipeline);

    return ApiResponse.success(res, 'Course and section enrollment analytics generated successfully', {
      totalSectionsAnalyzed: results.length,
      sections: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aggregation Pipeline 3: Department-wise Academic Summary
 */
const getDepartmentSummary = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$department',
          totalCourses: { $sum: 1 },
          avgCredits: { $avg: '$credits' },
          courses: {
            $push: {
              id: '$_id',
              code: '$courseCode',
              title: '$title',
              credits: '$credits'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          totalCourses: 1,
          avgCredits: { $round: [{ $ifNull: ['$avgCredits', 0] }, 2] },
          courses: 1
        }
      },
      { $sort: { department: 1 } }
    ];

    const summary = await Course.aggregate(pipeline);

    return ApiResponse.success(res, 'Department academic summary retrieved successfully', {
      departments: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceAnalytics,
  getEnrollmentCapacityAnalytics,
  getDepartmentSummary
};
