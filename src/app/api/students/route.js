import { createErrorResponse, createResponse } from '@/lib/auth';
import { generateCacheKey, withCache } from '@/lib/cache';
import connectDB from '@/lib/dbConnection';
import { generalRateLimiter, withRateLimit } from '@/lib/rateLimiter';
import withDatabase from '@/lib/withDatabase';
import Student from '@/models/Student';

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
    seqInDivision: studentObj["Seq In Division"] || studentObj.seqInDivision
  };
}

async function getStudents(request) {
  try {
    // Connection is already established by withDatabase wrapper
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100); // Cap limit at 100

    // Generate cache key
    const cacheKey = generateCacheKey('students_list', { page, limit });
    
    // Check cache first
    const cache = withCache(cacheKey, 120000); // 2 minutes cache
    const cachedResult = cache.get();
    if (cachedResult) {
      return createResponse(cachedResult);
    }

    const skip = (page - 1) * limit;
    
    // Use aggregation for better performance
    const pipeline = [
      { $sort: { "Sr No": 1 } },
      {
        $facet: {
          students: [
            { $skip: skip },
            { $limit: limit },
            { $project: { __v: 0, searchKeywords: 0 } }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    const [result] = await Student.aggregate(pipeline);
    const rawStudents = result.students || [];
    const totalStudents = result.totalCount[0]?.count || 0;

    // Transform data to normalize field names
    const students = rawStudents.map(student => transformStudent(student));

    const totalPages = Math.ceil(totalStudents / limit);

    const responseData = {
      success: true,
      data: students,
      pagination: {
        currentPage: page,
        totalPages,
        totalStudents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    // Cache the result
    cache.set(responseData);

    return createResponse(responseData);

  } catch (error) {
    console.error('Get students error:', error);
    return createErrorResponse('Error fetching students', 500);
  }
}

// Export the wrapped function with rate limiting
export const GET = withRateLimit(generalRateLimiter)(withDatabase(getStudents));
