const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: true
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
  license: {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2
    },
    expirationDate: {
      type: Date,
      required: true
    }
  },
  vehicle: {
    make: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    licensePlate: {
      type: String,
      required: true,
      trim: true
    },
    insurance: {
      company: {
        type: String,
        required: true,
        trim: true
      },
      policyNumber: {
        type: String,
        required: true,
        trim: true
      },
      expirationDate: {
        type: Date,
        required: true
      }
    },
    features: {
      rollatorAccessible: {
        type: Boolean,
        default: false
      },
      airConditioning: {
        type: Boolean,
        default: true
      },
      maxPassengers: {
        type: Number,
        default: 4,
        min: 1,
        max: 8
      }
    }
  },
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
      },
      endTime: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
      }
    }],
    isAvailable: {
      type: Boolean,
      default: true
    },
    maxRidesPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 20
    },
    preferredAreas: [{
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true,
        maxlength: 2
      },
      maxDistance: {
        type: Number,
        default: 50 // miles
      }
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'pending'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRides: {
      type: Number,
      default: 0
    },
    totalRating: {
      type: Number,
      default: 0
    }
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
driverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
driverSchema.virtual('age').get(function() {
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

// Method to check if driver is available for a specific time
driverSchema.methods.isAvailableAt = function(dateTime) {
  if (!this.availability.isAvailable) return false;
  
  const day = dateTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const time = dateTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  const schedule = this.availability.schedule.find(s => s.day === day);
  if (!schedule) return false;
  
  return time >= schedule.startTime && time <= schedule.endTime;
};

// Method to update rating
driverSchema.methods.updateRating = function(newRating) {
  this.rating.totalRides += 1;
  this.rating.totalRating += newRating;
  this.rating.average = this.rating.totalRating / this.rating.totalRides;
  return this.save();
};

// Method to get driver without sensitive info
driverSchema.methods.toPublicJSON = function() {
  const driver = this.toObject();
  delete driver.license;
  delete driver.vehicle.insurance;
  delete driver.address;
  return driver;
};

// Indexes for better query performance
driverSchema.index({ firstName: 1, lastName: 1 });
driverSchema.index({ email: 1 });
driverSchema.index({ phone: 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ 'availability.isAvailable': 1 });
driverSchema.index({ 'rating.average': -1 });
driverSchema.index({ 'vehicle.features.wheelchairAccessible': 1 });

module.exports = mongoose.model('Driver', driverSchema); 