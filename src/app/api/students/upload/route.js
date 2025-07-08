import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { authenticateRequest, createErrorResponse, createResponse } from '@/lib/auth';
import withDatabase from '@/lib/withDatabase';
import Student from '@/models/Student';
import Excel from 'exceljs';

async function uploadStudents(request) {
  // Wrap everything in try-catch to ensure we always return JSON
  try {
    // Database connection is already established by withDatabase wrapper

    // Authenticate user (handles both NextAuth sessions and JWT tokens)
    const authResult = await authenticateRequest(request, authOptions);
    
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('Invalid file type. Please upload an Excel or CSV file.', 400);
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let data;

    try {
      // Parse the file based on type
      if (file.type === 'text/csv') {
        // For CSV files, we can still use a simple CSV parser or ExcelJS
        const workbook = new Excel.Workbook();
        await workbook.csv.load(buffer);
        const worksheet = workbook.getWorksheet(1);
        data = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            const headerCell = worksheet.getRow(1).getCell(colNumber);
            if (headerCell.value) {
              rowData[headerCell.value] = cell.value;
            }
          });
          data.push(rowData);
        });
      } else {
        // For Excel files (.xlsx, .xls)
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);
        
        // Get headers from first row
        const headers = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value;
        });
        
        // Parse data rows
        data = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            if (headers[colNumber]) {
              rowData[headers[colNumber]] = cell.value;
            }
          });
          if (Object.keys(rowData).length > 0) {
            data.push(rowData);
          }
        });
      }

      if (data.length === 0) {
        return createErrorResponse('The spreadsheet appears to be empty', 400);
      }

      // Check for very large files that might timeout on Vercel
      if (data.length > 1000) {
        return createErrorResponse('File too large. Please upload files with 1000 or fewer records to avoid timeouts.', 400);
      }

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
          name: row['Name'] || row['name'] || row['Student Name'] || row['Name Of Student'],
          fullNameAs12th: row['Full Name As 12th'] || row['fullNameAs12th'] || row['Full Name'] || '',
          whatsappNumber: row['WhatsApp Number'] || row['whatsappNumber'] || row['WhatsApp'] || '',
          fatherNumber: row['Father Number'] || row['fatherNumber'] || row['Father Contact'] || '',
          motherNumber: row['Mother Number'] || row['motherNumber'] || row['Mother Contact'] || '',
          caste: row['Caste'] || row['caste'] || row['Category'] || 'General(open)',
          state: row['State'] || row['state'] || row['Home State'] || '',
          dateOfBirth: row['Date of Birth'] || row['dateOfBirth'] || row['DOB'] || null,
          branch: row['Branch'] || row['branch'] || row['Department'],
          division: row['Division'] || row['division'] || row['Div'],
          batch: parseInt(row['Batch'] || row['batch'] || row['Batch Year'] || new Date().getFullYear()),
          btechDiploma: row['BTech/Diploma'] || row['btechDiploma'] || row['Course Type'] || 'BTech',
          mftName: row['MFT Name'] || row['mftName'] || row['Faculty Name'] || '',
          mftContactNumber: row['MFT Contact'] || row['mftContactNumber'] || row['Faculty Contact'] || '',
          phoneNumber: row['Phone Number'] || row['phoneNumber'] || row['Contact'] || '',
          timeTable: row['Time Table'] || row['timeTable'] || row['Timetable'] || '',
          roomNumber: row['Room Number'] || row['roomNumber'] || row['Room'] || '',
          dateOfAdmission: row['Date of Admission'] || row['dateOfAdmission'] || row['Admission Date'] || new Date(),
          email: row['Email'] || row['email'] || row['Email ID'] || '',
          year: row['Year'] || row['year'] || row['Academic Year'] || '1st Year',
          // Document verification fields
          tenthMarksheet: row['10th Marksheet'] || row['tenthMarksheet'] || row['Tenth Marksheet'] || 'no',
          twelfthMarksheet: row['12th Marksheet'] || row['twelfthMarksheet'] || row['Twelfth Marksheet'] || 'no',
          lcTcMigrationCertificate: row['LC/TC/Migration'] || row['lcTcMigrationCertificate'] || row['Migration Certificate'] || 'no',
          casteCertificate: row['Caste Certificate'] || row['casteCertificate'] || row['Category Certificate'] || 'NA',
          admissionLetter: row['Admission Letter'] || row['admissionLetter'] || row['Admission'] || 'no'
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
        const validBranches = ['CSE', 'AI', 'CE', 'CS', 'OTHER'];
        if (studentData.branch && !validBranches.includes(studentData.branch)) {
          errors.push({
            row: rowNumber,
            error: `Invalid branch: ${studentData.branch}. Valid options: ${validBranches.join(', ')}`,
            data: row
          });
          continue;
        }

        // Validate caste enum
        const validCastes = ['General(open)', 'OBC', 'SC', 'ST', 'EBC', 'NT/DNT', 'Other'];
        if (studentData.caste && !validCastes.includes(studentData.caste)) {
          studentData.caste = 'General(open)'; // Default value
        }

        // Validate btechDiploma enum
        const validCourseTypes = ['BTech', 'Diploma', 'D2D'];
        if (studentData.btechDiploma && !validCourseTypes.includes(studentData.btechDiploma)) {
          studentData.btechDiploma = 'BTech'; // Default value
        }

        // Validate document verification fields
        const validYesNo = ['yes', 'no'];
        const validYesNoNA = ['yes', 'no', 'NA'];
        
        if (studentData.tenthMarksheet && !validYesNo.includes(studentData.tenthMarksheet)) {
          studentData.tenthMarksheet = 'no';
        }
        if (studentData.twelfthMarksheet && !validYesNo.includes(studentData.twelfthMarksheet)) {
          studentData.twelfthMarksheet = 'no';
        }
        if (studentData.lcTcMigrationCertificate && !validYesNo.includes(studentData.lcTcMigrationCertificate)) {
          studentData.lcTcMigrationCertificate = 'no';
        }
        if (studentData.casteCertificate && !validYesNoNA.includes(studentData.casteCertificate)) {
          studentData.casteCertificate = 'NA';
        }
        if (studentData.admissionLetter && !validYesNo.includes(studentData.admissionLetter)) {
          studentData.admissionLetter = 'no';
        }

        // Parse dates
        if (studentData.dateOfBirth && typeof studentData.dateOfBirth === 'string') {
          const parsedDOB = new Date(studentData.dateOfBirth);
          studentData.dateOfBirth = isNaN(parsedDOB.getTime()) ? null : parsedDOB;
        }
        
        if (studentData.dateOfAdmission && typeof studentData.dateOfAdmission === 'string') {
          const parsedAdmission = new Date(studentData.dateOfAdmission);
          studentData.dateOfAdmission = isNaN(parsedAdmission.getTime()) ? new Date() : parsedAdmission;
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

    if (validStudents.length === 0) {
      return createErrorResponse('No valid students found to process', 400);
    }

    // Second pass: bulk database operations
    try {
      // Get all existing UG numbers in one query
      const ugNumbers = validStudents.map(s => s.ugNumber);
      const existingStudents = await Student.find({ 
        ugNumber: { $in: ugNumbers } 
      }).select('ugNumber name').lean();
      
      const existingUgNumbers = new Set(existingStudents.map(s => s.ugNumber));

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


      // Bulk create new students
      if (studentsToCreate.length > 0) {
        const createResult = await Student.insertMany(studentsToCreate, { ordered: false });
        created = createResult.length;
        
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
        const bulkOps = studentsToUpdate.map(studentData => ({
          updateOne: {
            filter: { ugNumber: studentData.ugNumber },
            update: { $set: studentData }
          }
        }));

        const updateResult = await Student.bulkWrite(bulkOps);
        updated = updateResult.modifiedCount;

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
  
  try {
    
    // Authenticate user (handles both NextAuth sessions and JWT tokens)
    const authResult = await authenticateRequest(request, authOptions);
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }


    // Create sample data
    const sampleData = [
      {
        'Sr No': 1,
        'Seq in Division': 1,
        'UG Number': 'UG/2024/001',
        'Enrollment No': 'EN2024001',
        'Name': 'John Doe',
        'Full Name As 12th': 'John Doe Kumar',
        'WhatsApp Number': '9876543210',
        'Father Number': '9876543211',
        'Mother Number': '9876543212',
        'Caste': 'General(open)',
        'State': 'Gujarat',
        'Date of Birth': '2005-01-15',
        'Branch': 'CSE',
        'BTech/Diploma': 'BTech',
        'Division': 'A',
        'Batch': 2024,
        'MFT Name': 'Dr. Smith',
        'MFT Contact': '9876543213',
        'Phone Number': '9876543214',
        'Time Table': 'Schedule A',
        'Room Number': '101',
        'Date of Admission': '2024-07-01',
        'Email': 'john.doe@example.com',
        'Year': '1st Year',
        '10th Marksheet': 'yes',
        '12th Marksheet': 'yes',
        'LC/TC/Migration': 'yes',
        'Caste Certificate': 'NA',
        'Admission Letter': 'yes'
      },
      {
        'Sr No': 2,
        'Seq in Division': 2,
        'UG Number': 'UG/2024/002',
        'Enrollment No': 'EN2024002',
        'Name': 'Jane Smith',
        'Full Name As 12th': 'Jane Smith Patel',
        'WhatsApp Number': '9876543220',
        'Father Number': '9876543221',
        'Mother Number': '9876543222',
        'Caste': 'OBC',
        'State': 'Maharashtra',
        'Date of Birth': '2005-03-20',
        'Branch': 'AI',
        'BTech/Diploma': 'BTech',
        'Division': 'B',
        'Batch': 2024,
        'MFT Name': 'Dr. Johnson',
        'MFT Contact': '9876543223',
        'Phone Number': '9876543224',
        'Time Table': 'Schedule B',
        'Room Number': '102',
        'Date of Admission': '2024-07-02',
        'Email': 'jane.smith@example.com',
        'Year': '1st Year',
        '10th Marksheet': 'yes',
        '12th Marksheet': 'yes',
        'LC/TC/Migration': 'no',
        'Caste Certificate': 'yes',
        'Admission Letter': 'yes'
      }
    ];

    // Create workbook and worksheet using ExcelJS
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Add headers
    const headers = Object.keys(sampleData[0]);
    worksheet.addRow(headers);

    // Add sample data rows
    sampleData.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="student_template.xlsx"'
      }
    });

  } catch (error) {
    console.error('Template download error:', error);
    
    return createErrorResponse('Failed to generate template: ' + error.message, 500);
  }
}

// Export the wrapped function
export const POST = withDatabase(uploadStudents);
