const asyncHandler = require('express-async-handler');
const Student = require('../models/studentModel');

// @desc    Search students
// @route   GET /api/students/search
// @access  Public
const searchStudents = asyncHandler(async (req, res) => {
  const { 
    query = '', 
    branch = '', 
    division = '', 
    batch = '', 
    btechDiploma = '',
    page = 1, 
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  try {
    // Build search filter
    const filter = {};
    
    // Text search across multiple fields
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { ugNumber: { $regex: query, $options: 'i' } },
        { enrollmentNo: { $regex: query, $options: 'i' } },
        { branch: { $regex: query, $options: 'i' } },
        { division: { $regex: query, $options: 'i' } },
        { mftName: { $regex: query, $options: 'i' } }
      ];
    }

    // Additional filters
    if (branch) filter.branch = branch;
    if (division) filter.division = division;
    if (batch) filter.batch = parseInt(batch);
    if (btechDiploma) filter.btechDiploma = btechDiploma;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const students = await Student.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v -searchKeywords');

    // Get total count for pagination
    const totalStudents = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / parseInt(limit));

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStudents,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        query,
        branch,
        division,
        batch,
        btechDiploma
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching students',
      error: error.message
    });
  }
});

// @desc    Get all students
// @route   GET /api/students
// @access  Public
const getAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const students = await Student.find()
      .sort({ srNo: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v -searchKeywords');

    const totalStudents = await Student.countDocuments();
    const totalPages = Math.ceil(totalStudents / parseInt(limit));

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStudents,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// @desc    Get student by UG number
// @route   GET /api/students/:ugNumber
// @access  Public
const getStudentByUgNumber = asyncHandler(async (req, res) => {
  const { ugNumber } = req.params;

  try {
    const student = await Student.findOne({ ugNumber }).select('-__v -searchKeywords');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
});

// @desc    Create a new student
// @route   POST /api/students
// @access  Private (Admin only)
const createStudent = asyncHandler(async (req, res) => {
  const studentData = req.body;

  try {
    // Check if student with UG number already exists
    const existingStudent = await Student.findOne({ ugNumber: studentData.ugNumber });
    
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this UG number already exists'
      });
    }

    const student = await Student.create(studentData);

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
});

// @desc    Update student
// @route   PUT /api/students/:ugNumber
// @access  Private (Admin only)
const updateStudent = asyncHandler(async (req, res) => {
  const { ugNumber } = req.params;
  const updateData = req.body;

  try {
    const student = await Student.findOneAndUpdate(
      { ugNumber },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v -searchKeywords');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:ugNumber
// @access  Private (Admin only)
const deleteStudent = asyncHandler(async (req, res) => {
  const { ugNumber } = req.params;

  try {
    const student = await Student.findOneAndDelete({ ugNumber });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});

// @desc    Get student statistics
// @route   GET /api/students/stats
// @access  Public
const getStudentStats = asyncHandler(async (req, res) => {
  try {
    // Get total count
    const totalStudents = await Student.countDocuments();

    // Get count by branch
    const byBranch = await Student.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get count by batch
    const byBatch = await Student.aggregate([
      { $group: { _id: '$batch', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get count by BTech/Diploma
    const byType = await Student.aggregate([
      { $group: { _id: '$btechDiploma', count: { $sum: 1 } } }
    ]);

    // Get count by division
    const byDivision = await Student.aggregate([
      { $group: { _id: '$division', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        byBranch,
        byBatch,
        byType,
        byDivision
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// @desc    Bulk import students
// @route   POST /api/students/bulk-import
// @access  Private (Admin only)
const bulkImportStudents = asyncHandler(async (req, res) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of students'
    });
  }

  try {
    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const studentData of students) {
      try {
        // Check if student already exists
        const existingStudent = await Student.findOne({ ugNumber: studentData.ugNumber });
        
        if (existingStudent) {
          results.skipped++;
          continue;
        }

        await Student.create(studentData);
        results.created++;
      } catch (error) {
        results.errors.push({
          ugNumber: studentData.ugNumber,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Bulk import completed. Created: ${results.created}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during bulk import',
      error: error.message
    });
  }
});

module.exports = {
  searchStudents,
  getAllStudents,
  getStudentByUgNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  bulkImportStudents
};
