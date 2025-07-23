import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  srNo: {
    type: Number,
    default: 0
  },
  seqInDivision: {
    type: Number,
    default: 0
  },
  ugNumber: {
    type: String,
    required: true,
    unique: true
    // Removed index: true since we define it separately below
  },
  enrollmentNo: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true
    // Removed index: true since we define it separately below
  },
  fullNameAs12th: {
    type: String,
    default: '',
    trim: true
  },
  whatsappNumber: {
    type: String,
    default: '',
    trim: true
  },
  fatherNumber: {
    type: String,
    default: '',
    trim: true
  },
  motherNumber: {
    type: String,
    default: '',
    trim: true
  },
  caste: {
    type: String,
    enum: ['General(open)', 'OBC', 'SC', 'ST', 'EBC', 'NT/DNT', 'Other'],
    default: 'General(open)'
  },
  state: {
    type: String,
    default: '',
    trim: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  branch: {
    type: String,
    default: '',
    enum: ['CSE', 'CE', 'AI', 'CS', 'OTHER', ''], // Allow empty string
  },
  // Document verification fields
  tenthMarksheet: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  twelfthMarksheet: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  lcTcMigrationCertificate: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  casteCertificate: {
    type: String,
    enum: ['yes', 'no', 'NA'],
    default: 'NA'
  },
  admissionLetter: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  btechDiploma: {
    type: String,
    enum: ['BTech', 'Diploma', 'D2D'],
    default: 'BTech'
  },
  division: {
    type: String,
    default: ''
  },
  batch: {
    type: Number,
    default: 0
  },
  mftName: {
    type: String,
    default: ''
  },
  mftContactNumber: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  timeTable: {
    type: String,
    default: ''
  },
  roomNumber: {
    type: String,
    default: ''
  },
  dateOfAdmission: {
    type: Date,
    default: Date.now
  },
  email: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: '1st Year'
  },
  searchKeywords: [{
    type: String
  }]
}, {
  timestamps: true
});

// Create optimized indexes for better query performance
studentSchema.index({ ugNumber: 1 }, { unique: true }); // Primary lookup
studentSchema.index({ name: 1 }); // Name searches
studentSchema.index({ branch: 1, division: 1, batch: 1 }); // Filter combinations
studentSchema.index({ dateOfAdmission: 1 }); // Date range queries
studentSchema.index({ "Sr No": 1 }); // Sorting by serial number
studentSchema.index({ branch: 1, dateOfAdmission: 1 }); // SuperAdmin filtering
studentSchema.index({ btechDiploma: 1 }); // Filter by program type

// Create text indexes for search (separate from other indexes for better performance)
studentSchema.index({
  name: 'text',
  fullNameAs12th: 'text',
  ugNumber: 'text',
  branch: 'text',
  division: 'text',
  mftName: 'text',
  state: 'text',
  caste: 'text'
}, {
  name: 'text_search_index',
  weights: {
    ugNumber: 10, // Higher weight for UG number searches
    name: 5,
    fullNameAs12th: 3,
    branch: 1,
    division: 1,
    mftName: 1,
    state: 1,
    caste: 1
  }
});

// Pre-save hook to generate search keywords - only for individual saves
studentSchema.pre('save', function(next) {
  // Skip for bulk operations to improve performance
  if (this.isNew || this.isModified()) {
    const keywords = [
      this.name?.toLowerCase(),
      this.fullNameAs12th?.toLowerCase(),
      this.ugNumber?.toLowerCase(),
      this.branch?.toLowerCase(),
      this.division?.toLowerCase(),
      this.mftName?.toLowerCase(),
      this.enrollmentNo?.toLowerCase(),
      this.state?.toLowerCase(),
      this.caste?.toLowerCase()
    ].filter(Boolean);
    
    this.searchKeywords = keywords;
  }
  next();
});

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
