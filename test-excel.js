const Excel = require('exceljs');
const fs = require('fs');

async function testExcelFile() {
  try {
    console.log('Testing Excel file...');
    
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile('./public/Admission.xlsx');
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      console.log('No worksheet found');
      return;
    }
    
    console.log('Worksheet found:', worksheet.name);
    console.log('Row count:', worksheet.rowCount);
    console.log('Column count:', worksheet.columnCount);
    
    // Get headers
    const headerRow = worksheet.getRow(1);
    console.log('Headers:');
    headerRow.eachCell((cell, colNumber) => {
      console.log(`  ${colNumber}: ${cell.value}`);
    });
    
    // Get first few data rows
    console.log('\nFirst 3 data rows:');
    for (let i = 2; i <= Math.min(4, worksheet.rowCount); i++) {
      const row = worksheet.getRow(i);
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value;
        if (header) {
          rowData[header] = cell.value;
        }
      });
      console.log(`Row ${i}:`, JSON.stringify(rowData, null, 2));
    }
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

testExcelFile();
