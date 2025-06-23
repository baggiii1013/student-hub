import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { authenticateRequest, createErrorResponse, createResponse } from '@/lib/auth';
import connectDB from '@/lib/dbConnection';
import Student from '@/models/Student';
import * as XLSX from 'xlsx';

export async function POST(request) {
  console.log('Upload API POST called');
  
  // Wrap everything in try-catch to ensure we always return JSON
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected');

    // Authenticate user (handles both NextAuth sessions and JWT tokens)
    console.log('Starting authentication...');
    const authResult = await authenticateRequest(request, authOptions);
    
    if (!authResult.authenticated) {
      console.log('Authentication failed:', authResult.error);
      return createErrorResponse(authResult.error, 401);
    }

    console.log('User authenticated:', authResult.user?.email || 'unknown', 'via', authResult.authType);

    console.log('Getting form data...');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      console.log('No file provided');
      return createErrorResponse('No file provided', 400);
    }

    console.log('File received:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return createErrorResponse('Invalid file type. Please upload an Excel or CSV file.', 400);
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let workbook;
    let data;

    try {
      // Parse the file based on type
      if (file.type === 'text/csv') {
        workbook = XLSX.read(buffer, { type: 'buffer' });
      } else {
        workbook = XLSX.read(buffer, { type: 'buffer' });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return createErrorResponse('The spreadsheet appears to be empty', 400);
      }

      // Check for very large files that might timeout on Vercel
      if (data.length > 1000) {
        return createErrorResponse('File too large. Please upload files with 1000 or fewer records to avoid timeouts.', 400);
      }

      console.log(`Processing ${data.length} rows from spreadsheet`);

    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return createErrorResponse('Error parsing the file. Please ensure it\'s a valid Excel or CSV file.', 400);
    }

    // Validate and process data
    const processedStudents = [];
    const errors = [];
    const validStudents = [];
    let updated = 0;
    let created = 0;

    console.log('Starting data validation and processing...');

    // First pass: validate all data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row numbers start from 1, plus header row

      try {
        // Map spreadsheet columns to our model fields
        const studentData = {
          srNo: parseInt(row['Sr No'] || row['srNo'] || row['Sr. No.'] || 0),
          seqInDivision: parseInt(row['Seq in Division'] || row['seqInDivision'] || row['Sequence'] || 0),
          ugNumber: row['UG Number'] || row['ugNumber'] || row['UG No'] || row['UG_Number'],
          enrollmentNo: row['Enrollment No'] || row['enrollmentNo'] || row['Enrollment'] || '',
          name: row['Name'] || row['name'] || row['Student Name'],
          branch: row['Branch'] || row['branch'] || row['Department'],
          btechDiploma: row['BTech/Diploma'] || row['btechDiploma'] || row['Course Type'] || 'BTech',
          division: row['Division'] || row['division'] || row['Div'],
          batch: parseInt(row['Batch'] || row['batch'] || row['Batch Year'] || new Date().getFullYear()),
          mftName: row['MFT Name'] || row['mftName'] || row['Faculty Name'] || '',
          mftContactNumber: row['MFT Contact'] || row['mftContactNumber'] || row['Faculty Contact'] || '',
          phoneNumber: row['Phone Number'] || row['phoneNumber'] || row['Contact'] || '',
          timeTable: row['Time Table'] || row['timeTable'] || row['Timetable'] || '',
          roomNumber: row['Room Number'] || row['roomNumber'] || row['Room'] || '',
          email: row['Email'] || row['email'] || row['Email ID'] || '',
          year: row['Year'] || row['year'] || row['Academic Year'] || '1st Year'
        };

        // Validate required fields
        if (!studentData.name || !studentData.ugNumber) {
          errors.push({
            row: rowNumber,
            error: 'Missing required fields: Name and UG Number are required',
            data: row
          });
          continue;
        }

        // Validate branch enum
        const validBranches = ['CSE', 'AI', 'IT', 'ECE', 'ME', 'CE', 'EE', 'CH', 'BT', 'MT', 'PT', 'TT'];
        if (studentData.branch && !validBranches.includes(studentData.branch)) {
          errors.push({
            row: rowNumber,
            error: `Invalid branch: ${studentData.branch}. Valid options: ${validBranches.join(', ')}`,
            data: row
          });
          continue;
        }

        // Validate btechDiploma enum
        const validCourseTypes = ['BTech', 'Diploma', 'D2D'];
        if (studentData.btechDiploma && !validCourseTypes.includes(studentData.btechDiploma)) {
          studentData.btechDiploma = 'BTech'; // Default value
        }

        validStudents.push(studentData);

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          error: error.message,
          data: row
        });
      }
    }

    console.log(`Validated ${validStudents.length} students, ${errors.length} errors`);

    if (validStudents.length === 0) {
      return createErrorResponse('No valid students found to process', 400);
    }

    // Second pass: bulk database operations
    console.log('Starting bulk database operations...');

    try {
      // Get all existing UG numbers in one query
      const ugNumbers = validStudents.map(s => s.ugNumber);
      const existingStudents = await Student.find({ 
        ugNumber: { $in: ugNumbers } 
      }).select('ugNumber name').lean();
      
      const existingUgNumbers = new Set(existingStudents.map(s => s.ugNumber));
      
      console.log(`Found ${existingUgNumbers.size} existing students`);

      // Separate into updates and creates
      const studentsToUpdate = [];
      const studentsToCreate = [];

      validStudents.forEach(studentData => {
        // Generate search keywords for bulk operations
        const keywords = [
          studentData.name?.toLowerCase(),
          studentData.ugNumber?.toLowerCase(),
          studentData.branch?.toLowerCase(),
          studentData.division?.toLowerCase(),
          studentData.mftName?.toLowerCase(),
          studentData.enrollmentNo?.toLowerCase()
        ].filter(Boolean);
        
        studentData.searchKeywords = keywords;

        if (existingUgNumbers.has(studentData.ugNumber)) {
          studentsToUpdate.push(studentData);
        } else {
          studentsToCreate.push(studentData);
        }
      });

      console.log(`Will create ${studentsToCreate.length}, update ${studentsToUpdate.length}`);

      // Bulk create new students
      if (studentsToCreate.length > 0) {
        console.log('Bulk creating new students...');
        const createResult = await Student.insertMany(studentsToCreate, { ordered: false });
        created = createResult.length;
        console.log(`Created ${created} students`);
        
        // Add to processed list
        createResult.forEach(student => {
          processedStudents.push({
            ugNumber: student.ugNumber,
            name: student.name,
            action: 'created'
          });
        });
      }

      // Bulk update existing students
      if (studentsToUpdate.length > 0) {
        console.log('Bulk updating existing students...');
        const bulkOps = studentsToUpdate.map(studentData => ({
          updateOne: {
            filter: { ugNumber: studentData.ugNumber },
            update: { $set: studentData }
          }
        }));

        const updateResult = await Student.bulkWrite(bulkOps);
        updated = updateResult.modifiedCount;
        console.log(`Updated ${updated} students`);

        // Add to processed list
        studentsToUpdate.forEach(studentData => {
          processedStudents.push({
            ugNumber: studentData.ugNumber,
            name: studentData.name,
            action: 'updated'
          });
        });
      }

    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return createErrorResponse('Database error during bulk operations: ' + dbError.message, 500);
    }

    const responseData = {
      message: 'Spreadsheet processed successfully',
      summary: {
        totalRows: data.length,
        processed: processedStudents.length,
        created,
        updated,
        errors: errors.length
      },
      processedStudents: processedStudents.slice(0, 10), // Show first 10 for preview
      errors: errors.slice(0, 5), // Show first 5 errors
      hasMoreErrors: errors.length > 5
    };

    console.log('Sending response:', responseData);
    return createResponse(responseData);

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Always return JSON, even on unexpected errors
    try {
      return createErrorResponse('Internal server error during file processing: ' + error.message, 500);
    } catch (responseError) {
      console.error('Failed to create error response:', responseError);
      // Last resort: manual JSON response
      return new Response(JSON.stringify({
        success: false,
        error: true,
        message: 'Critical server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// GET method to download a sample template
export async function GET(request) {
  console.log('Upload API GET called for template download');
  
  try {
    console.log('Starting template generation...');
    
    // Authenticate user (handles both NextAuth sessions and JWT tokens)
    const authResult = await authenticateRequest(request, authOptions);
    if (!authResult.authenticated) {
      console.log('GET Authentication failed:', authResult.error);
      return createErrorResponse(authResult.error, 401);
    }

    console.log('GET User downloading template:', authResult.user?.email || 'unknown', 'via', authResult.authType);

    // Create sample data
    const sampleData = [
      {
        'Sr No': 1,
        'Seq in Division': 1,
        'UG Number': 'UG/2024/001',
        'Enrollment No': 'EN2024001',
        'Name': 'John Doe',
        'Branch': 'CSE',
        'BTech/Diploma': 'BTech',
        'Division': 'A',
        'Batch': 2024,
        'MFT Name': 'Dr. Smith',
        'MFT Contact': '9876543210',
        'Phone Number': '9876543211',
        'Time Table': 'Schedule A',
        'Room Number': '101',
        'Email': 'john.doe@example.com',
        'Year': '1st Year'
      },
      {
        'Sr No': 2,
        'Seq in Division': 2,
        'UG Number': 'UG/2024/002',
        'Enrollment No': 'EN2024002',
        'Name': 'Jane Smith',
        'Branch': 'IT',
        'BTech/Diploma': 'BTech',
        'Division': 'A',
        'Batch': 2024,
        'MFT Name': 'Dr. Johnson',
        'MFT Contact': '9876543212',
        'Phone Number': '9876543213',
        'Time Table': 'Schedule B',
        'Room Number': '102',
        'Email': 'jane.smith@example.com',
        'Year': '1st Year'
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="student_template.xlsx"'
      }
    });

  } catch (error) {
    console.error('Template download error:', error);
    console.error('Template error stack:', error.stack);
    
    // Ensure JSON response for template errors too
    try {
      return createErrorResponse('Failed to generate template: ' + error.message, 500);
    } catch (responseError) {
      console.error('Failed to create template error response:', responseError);
      return new Response(JSON.stringify({
        success: false,
        error: true,
        message: 'Critical template generation error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
