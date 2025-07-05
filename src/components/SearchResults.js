'use client';

import { useRole } from '@/hooks/useRole';
import { useState } from 'react';
import styles from './SearchResults.module.css';

export default function SearchResults({ students, pagination, isLoading }) {
  const { isSuperAdmin } = useRole();
  const [selectedStudent, setSelectedStudent] = useState(null);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Searching students...</p>
        </div>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(selectedStudent?._id === student._id ? null : student);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Search Results</h3>
        {pagination && (
          <div className={styles.pagination}>
            <span className={styles.resultCount}>
              {pagination.totalStudents} student(s) found
            </span>
          </div>
        )}
      </div>

      <div className={styles.resultsGrid}>
        {students.map((student) => (
          <div 
            key={student._id} 
            className={`${styles.studentCard} ${selectedStudent?._id === student._id ? styles.selected : ''}`}
            onClick={() => handleStudentClick(student)}
          >
            <div className={styles.cardHeader}>
              <h4 className={styles.studentName}>{student.name}</h4>
              <span className={styles.ugNumber}>{student.ugNumber}</span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Branch:</span>
                <span className={styles.value}>{student.branch || 'N/A'}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.label}>Division:</span>
                <span className={styles.value}>{student.division || 'N/A'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Batch:</span>
                <span className={styles.value}>{student.batch || 'N/A'}</span>
              </div>

              {isSuperAdmin && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Admission Date:</span>
                  <span className={styles.value}>{formatDate(student.dateOfAdmission)}</span>
                </div>
              )}

              {selectedStudent?._id === student._id && (
                <div className={styles.expandedDetails}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Enrollment No:</span>
                      <span className={styles.value}>{student.enrollmentNo || 'N/A'}</span>
                    </div>
                    
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Course Type:</span>
                      <span className={styles.value}>{student.btechDiploma || 'N/A'}</span>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.label}>MFT Name:</span>
                      <span className={styles.value}>{student.mftName || 'N/A'}</span>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.label}>Phone:</span>
                      <span className={styles.value}>{student.phoneNumber || 'N/A'}</span>
                    </div>

                    {student.email && (
                      <div className={styles.infoRow}>
                        <span className={styles.label}>Email:</span>
                        <span className={styles.value}>{student.email}</span>
                      </div>
                    )}

                    {student.roomNumber && (
                      <div className={styles.infoRow}>
                        <span className={styles.label}>Room:</span>
                        <span className={styles.value}>{student.roomNumber}</span>
                      </div>
                    )}

                    <div className={styles.infoRow}>
                      <span className={styles.label}>Year:</span>
                      <span className={styles.value}>{student.year || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.clickHint}>
                {selectedStudent?._id === student._id ? 'Click to collapse' : 'Click for more details'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
