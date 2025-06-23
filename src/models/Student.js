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
    unique: true,
    index: true
  },
  enrollmentNo: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  branch: {
    type: String,
    enum: ['CSE', 'AI', 'IT', 'ECE', 'ME', 'CE', 'EE', 'CH', 'BT', 'MT', 'PT', 'TT'],
    default: ''
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

// Create text indexes for search
studentSchema.index({
  name: 'text',
  ugNumber: 'text',
  branch: 'text',
  division: 'text',
  mftName: 'text'
});

// Pre-save hook to generate search keywords
studentSchema.pre('save', function(next) {
  const keywords = [
    this.name?.toLowerCase(),
    this.ugNumber?.toLowerCase(),
    this.branch?.toLowerCase(),
    this.division?.toLowerCase(),
    this.mftName?.toLowerCase(),
    this.enrollmentNo?.toLowerCase()
  ].filter(Boolean);
  
  this.searchKeywords = keywords;
  next();
});

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
