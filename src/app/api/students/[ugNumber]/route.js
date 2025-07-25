import { authenticateRequest, createErrorResponse, createResponse } from '@/lib/auth';
import { generateCacheKey, invalidateStudentCache, withCache } from '@/lib/cache';
import { generalRateLimiter, withRateLimit } from '@/lib/rateLimiter';
import withDatabase from '@/lib/withDatabase';
import Student from '@/models/Student';
// ...existing code...

// Transform student data to normalize field names
function transformStudent(studentObj) {
  return {
    _id: studentObj._id,
    name: studentObj["Name Of Student"] || studentObj.name || "",
    ugNumber: studentObj["UG Number"] || studentObj.ugNumber || "",
    enrollmentNo: studentObj["ENROLLMENT Number"] || studentObj.enrollmentNo || "",
    branch: studentObj["Branch"] || studentObj.branch || "",
    division: studentObj["Division"] || studentObj.division || "",
    batch: studentObj["Batch"] || studentObj.batch || "",
    btechDiploma: studentObj["BTech/Diploma"] || studentObj.btechDiploma || "BTech",
    mftName: studentObj["MFT Name"] || studentObj.mftName || "",
    mftContactNumber: studentObj["MFT Contact Number"] || studentObj.mftContactNumber || "",
    phoneNumber: studentObj["Phone Number Of Student"] || studentObj.phoneNumber || "",
    timeTable: studentObj["Time Table"] || studentObj.timeTable || "",
    roomNumber: studentObj["Room Number"] || studentObj.roomNumber || "",
    year: studentObj.year || "1st Year",
    email: studentObj.email || "",
    dateOfAdmission: studentObj.dateOfAdmission || studentObj["Date of Admission"],
    srNo: studentObj["Sr No"] || studentObj.srNo,
    seqInDivision: studentObj["Seq In Division"] || studentObj.seqInDivision,
    fullNameAs12th: studentObj.fullNameAs12th || "",
    whatsappNumber: studentObj.whatsappNumber || "",
    fatherNumber: studentObj.fatherNumber || "",
    motherNumber: studentObj.motherNumber || "",
    caste: studentObj.caste || "General(open)",
    state: studentObj.state || "",
    dateOfBirth: studentObj.dateOfBirth || null,
    tenthMarksheet: studentObj.tenthMarksheet || "no",
    twelfthMarksheet: studentObj.twelfthMarksheet || "no",
    lcTcMigrationCertificate: studentObj.lcTcMigrationCertificate || "no",
    casteCertificate: studentObj.casteCertificate || "NA",
    admissionLetter: studentObj.admissionLetter || "no"
  };
}

async function getStudent(request, { params }) {
  try {
    // Database connection is already established by withDatabase wrapper

    const { ugNumber } = await params;

    // Authenticate request
    const authResult = await authenticateRequest(request);

    // Generate cache key based on authentication status
    const cacheKey = generateCacheKey('student_detail', { ugNumber, auth: authResult?.authenticated ? 'auth' : 'anon' });

    // Check cache first
    const cache = withCache(cacheKey, 300000); // 5 minutes cache for individual students
    const cachedResult = cache.get();
    if (cachedResult) {
      return createResponse(cachedResult);
    }

    // Optimized query using direct ugNumber match first, then fallback
    let student = await Student.findOne({ ugNumber: ugNumber })
      .select('-__v -searchKeywords')
      .lean(); // Use lean() for better performance

    // Fallback to legacy field name if not found
    if (!student) {
      student = await Student.findOne({ "UG Number": ugNumber })
        .select('-__v -searchKeywords')
        .lean();
    }

    if (!student) {
      return createErrorResponse('Student not found', 404);
    }

    let transformedStudent = transformStudent(student);

    // Hide sensitive info for unauthenticated users
    if (!authResult?.authenticated) {
      transformedStudent = {
        ...transformedStudent,
        // Contact information
        phoneNumber: null,
        whatsappNumber: null,
        fatherNumber: null,
        motherNumber: null,
        email: null,
        // Document verification status
        tenthMarksheet: null,
        twelfthMarksheet: null,
        lcTcMigrationCertificate: null,
        casteCertificate: null,
        admissionLetter: null,
        // Sensitive personal info
        caste: null,
        state: null,
        dateOfBirth: null
      };
    }

    const responseData = {
      success: true,
      data: transformedStudent
    };

    // Cache the result
    cache.set(responseData);

    return createResponse(responseData);

  } catch (error) {
    return createErrorResponse('Error fetching student', 500);
  }
}

async function updateStudent(request, { params }) {
  try {
    // Authenticate the request first
    const authResult = await authenticateRequest(request);
    
    if (!authResult?.authenticated) {
      return createErrorResponse('Authentication required', 401);
    }

    // Check if user has permission to update student data
    const userRole = authResult.user?.role;
    if (!['superAdmin', 'admin', 'moderator'].includes(userRole)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Database connection is already established by withDatabase wrapper
    const { ugNumber } = await params;
    const updateData = await request.json();

    // Remove fields that shouldn't be updated via this endpoint
    const { _id, __v, searchKeywords, ...validUpdateData } = updateData;

    // Find and update the student
    const student = await Student.findOneAndUpdate(
      {
        $or: [
          { "UG Number": ugNumber },
          { ugNumber: ugNumber }
        ]
      },
      validUpdateData,
      { 
        new: true, 
        runValidators: true,
        select: '-__v -searchKeywords'
      }
    );

    if (!student) {
      return createErrorResponse('Student not found', 404);
    }

    // Transform the updated student data
    const transformedStudent = transformStudent(student.toObject());

    // IMPORTANT: Invalidate cache after successful update
    invalidateStudentCache(ugNumber);

    return createResponse({
      success: true,
      data: transformedStudent,
      message: 'Student updated successfully'
    });

  } catch (error) {
    console.error('Error updating student:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return createErrorResponse(`Validation error: ${validationErrors.join(', ')}`, 400);
    }

    return createErrorResponse('Error updating student', 500);
  }
}

// Export the wrapped functions with rate limiting
export const GET = withRateLimit(generalRateLimiter)(withDatabase(getStudent));
export const PUT = withRateLimit(generalRateLimiter)(withDatabase(updateStudent));
