const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
    }
  },
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    }
  },
  medicalInfo: {
    conditions: [{
      type: String,
      trim: true
    }],
    medications: [{
      name: {
        type: String,
        trim: true
      },
      dosage: {
        type: String,
        trim: true
      }
    }],
    allergies: [{
      type: String,
      trim: true
    }],
    mobilityAids: [{
      type: String,
      trim: true
    }],
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  preferences: {
    preferredDrivers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    }],
    preferredPickupTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    },
    maxWaitTime: {
      type: Number,
      default: 15,
      min: 5,
      max: 60
    },
    requiresAssistance: {
      type: Boolean,
      default: false
    },
    wheelchairAccessible: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for full name
riderSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
riderSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Method to get rider without sensitive info
riderSchema.methods.toPublicJSON = function() {
  const rider = this.toObject();
  delete rider.medicalInfo;
  delete rider.emergencyContact;
  return rider;
};

// Indexes for better query performance
riderSchema.index({ firstName: 1, lastName: 1 });
riderSchema.index({ phone: 1 });
riderSchema.index({ email: 1 });
riderSchema.index({ status: 1 });
riderSchema.index({ 'address.city': 1, 'address.state': 1 });

module.exports = mongoose.model('Rider', riderSchema); 