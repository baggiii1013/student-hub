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

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { ugNumber } = await params;

    // Find student by UG number (handle both formats)
    const student = await Student.findOne({
      $or: [
        { "UG Number": ugNumber },
        { ugNumber: ugNumber }
      ]
    }).select('-__v -searchKeywords');
    
    if (!student) {
      return createErrorResponse('Student not found', 404);
    }

    // Transform the student data
    const transformedStudent = transformStudent(student.toObject());

    return createResponse({
      success: true,
      data: transformedStudent
    });

  } catch (error) {
    console.error('Get student error:', error);
    return createErrorResponse('Error fetching student', 500);
  }
}
