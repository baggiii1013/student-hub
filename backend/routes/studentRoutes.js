const express = require('express');
const router = express.Router();
const {
  searchStudents,
  getAllStudents,
  getStudentByUgNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  bulkImportStudents
} = require('../controller/studentController');
const validateToken = require('../middleware/validateTokenHandler');

// Public routes
router.get('/search', searchStudents);
router.get('/stats', getStudentStats);
router.get('/', getAllStudents);
router.get('/:ugNumber', getStudentByUgNumber);

// Protected routes (require authentication)
router.post('/', validateToken, createStudent);
router.put('/:ugNumber', validateToken, updateStudent);
router.delete('/:ugNumber', validateToken, deleteStudent);
router.post('/bulk-import', validateToken, bulkImportStudents);

module.exports = router;
