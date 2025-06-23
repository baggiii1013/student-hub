import { createErrorResponse, createResponse } from '@/lib/auth';
import connectDB from '@/lib/dbConnection';
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

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const branch = searchParams.get('branch') || '';
    const division = searchParams.get('division') || '';
    const batch = searchParams.get('batch') || '';
    const btechDiploma = searchParams.get('btechDiploma') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build search filter
    const filter = {};
    
    // Text search across multiple fields (handle both formats)
    if (query) {
      filter.$or = [
        { "Name Of Student": { $regex: query, $options: 'i' } },
        { "UG Number": { $regex: query, $options: 'i' } },
        { "ENROLLMENT Number": { $regex: query, $options: 'i' } },
        { "Branch": { $regex: query, $options: 'i' } },
        { "Division": { $regex: query, $options: 'i' } },
        { "MFT Name": { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { ugNumber: { $regex: query, $options: 'i' } },
        { enrollmentNo: { $regex: query, $options: 'i' } },
        { branch: { $regex: query, $options: 'i' } },
        { division: { $regex: query, $options: 'i' } },
        { mftName: { $regex: query, $options: 'i' } }
      ];
    }

    // Additional filters
    if (branch) filter["Branch"] = branch;
    if (division) filter["Division"] = division;
    if (batch) filter["Batch"] = parseInt(batch);
    if (btechDiploma) filter["BTech/Diploma"] = btechDiploma;

    // Sort options - map to actual field names in database
    const sortOptions = {};
    const sortFieldMap = {
      'name': 'Name Of Student',
      'ugNumber': 'UG Number',
      'branch': 'Branch',
      'division': 'Division',
      'batch': 'Batch',
      'year': 'year'
    };
    const actualSortField = sortFieldMap[sortBy] || sortBy;
    sortOptions[actualSortField] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Execute search
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
        btechDiploma
      }
    });

  } catch (error) {
    console.error('Search students error:', error);
    return createErrorResponse('Error searching students', 500);
  }
}
