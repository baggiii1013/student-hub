import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { authenticateRequest, createErrorResponse, createResponse } from '@/lib/auth';
import withDatabase from '@/lib/withDatabase';
import Student from '@/models/Student';

// Transform student data to normalize field names
function transformStudent(studentObj) {
  return {
    _id: studentObj._id,
    name: studentObj.name || "",
    ugNumber: studentObj.ugNumber || "",
    enrollmentNo: studentObj.enrollmentNo || "",
    branch: studentObj.branch || "",
    division: studentObj.division || "",
    batch: studentObj.batch || "",
    btechDiploma: studentObj.btechDiploma || "BTech",
    mftName: studentObj.mftName || "",
    mftContactNumber: studentObj.mftContactNumber || "",
    phoneNumber: studentObj.phoneNumber || "",
    timeTable: studentObj.timeTable || "",
    roomNumber: studentObj.roomNumber || "",
    year: studentObj.year || "1st Year",
    email: studentObj.email || "",
    dateOfAdmission: studentObj.dateOfAdmission,
    srNo: studentObj.srNo,
    seqInDivision: studentObj.seqInDivision
  };
}

async function searchStudents(request) {
  try {
    // Database connection is already established by withDatabase wrapper

    // Authenticate user
    const authResult = await authenticateRequest(request, authOptions);
    
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error || 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const branch = searchParams.get('branch') || '';
    const division = searchParams.get('division') || '';
    const batch = searchParams.get('batch') || '';
    const btechDiploma = searchParams.get('btechDiploma') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;
    const sortBy = searchParams.get('sortBy') || 'dateOfAdmission';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Check if user is superAdmin for advanced filtering
    const isSuperAdmin = authResult.user.role === 'superAdmin';

    // Build search filter
    const filter = {};
    
    // Only search by exact UG number match (case-insensitive)
    if (query) {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        // Return empty results for empty query
        return createResponse({
          success: true,
          data: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalStudents: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          filters: {
            query,
            branch,
            division,
            batch,
            btechDiploma,
            dateFrom,
            dateTo,
            isSuperAdmin
          }
        });
      }

      // Exact match for UG number only (case-insensitive)
      filter.$or = [
        { ugNumber: { $regex: `^${trimmedQuery}$`, $options: 'i' } }
      ];
    }

    // Additional filters
    if (branch) filter.branch = branch;
    if (division) filter.division = division;
    if (batch) filter.batch = parseInt(batch);
    if (btechDiploma) filter.btechDiploma = btechDiploma;

    // SuperAdmin-only filters: branch and admission date filtering
    if (isSuperAdmin) {
      // Allow branch filtering for superAdmin even without a query
      if (branch && !query) {
        delete filter.$or; // Remove UG number requirement for superAdmin
        filter.branch = branch;
      }

      // Add date range filtering for admission date (superAdmin only)
      if (dateFrom || dateTo) {
        filter.dateOfAdmission = {};
        
        if (dateFrom) {
          // Parse the date and set to start of day
          const fromDate = new Date(dateFrom + 'T00:00:00.000Z');
          if (!isNaN(fromDate.getTime())) {
            filter.dateOfAdmission.$gte = fromDate;
            console.log('Date filter FROM:', dateFrom, '-> parsed:', fromDate);
          }
        }
        
        if (dateTo) {
          // Parse the date and set to end of day
          const toDate = new Date(dateTo + 'T23:59:59.999Z');
          if (!isNaN(toDate.getTime())) {
            filter.dateOfAdmission.$lte = toDate;
            console.log('Date filter TO:', dateTo, '-> parsed:', toDate);
          }
        }
        
        console.log('Final date filter:', filter.dateOfAdmission);
      }
    } else {
      // Non-superAdmin users cannot filter by branch or date without a UG number query
      if ((branch && !query) || dateFrom || dateTo) {
        return createErrorResponse('Access denied: Advanced filtering requires SuperAdmin role', 403);
      }
    }

    // Sort options - map to actual field names in database
    const sortOptions = {};
    const sortFieldMap = {
      'name': 'name',
      'ugNumber': 'ugNumber',
      'branch': 'branch',
      'division': 'division',
      'batch': 'batch',
      'year': 'year',
      'dateOfAdmission': 'dateOfAdmission'
    };
    const actualSortField = sortFieldMap[sortBy] || sortBy;
    sortOptions[actualSortField] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Execute search
    console.log('Final search filter:', JSON.stringify(filter, null, 2));
    console.log('Sort options:', sortOptions);
    
    const rawStudents = await Student.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-__v -searchKeywords');

    // Transform data to normalize field names
    const students = rawStudents.map(student => transformStudent(student.toObject()));


    // Get total count for pagination
    const totalStudents = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / limit);

    return createResponse({
      success: true,
      data: students,
      pagination: {
        currentPage: page,
        totalPages,
        totalStudents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        query,
        branch,
        division,
        batch,
        btechDiploma,
        dateFrom,
        dateTo,
        isSuperAdmin
      }
    });

  } catch (error) {
    console.error('Search students error:', error);
    return createErrorResponse('Error searching students', 500);
  }
}

// Export the wrapped function
export const GET = withDatabase(searchStudents);
