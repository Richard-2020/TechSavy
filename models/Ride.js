const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  pickupLocation: {
    address: {
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
      trim: true
    },
  },
  destination: {
    address: {
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
      trim: true
    },
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 30
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  rideType: {
    type: String,
    enum: ['medical', 'shopping', 'social', 'other'],
    required: true
  },
  specialRequirements: {
    rollatorAccessible: {
      type: Boolean,
      default: false
    },
    requiresAssistance: {
      type: Boolean,
      default: false
    },
    companionAllowed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  timing: {
    requestedPickupTime: {
      type: Date,
      required: true
    },
    actualPickupTime: {
      type: Date
    },
    actualDropoffTime: {
      type: Date
    },
    estimatedPickupTime: {
      type: Date
    }
  },
  feedback: {
    riderRating: {
      type: Number,
      min: 1,
      max: 5
    },
    riderComment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    driverRating: {
      type: Number,
      min: 1,
      max: 5
    },
    driverComment: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['rider', 'driver', 'dispatcher', 'system']
    },
    cancelledAt: {
      type: Date
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Virtual for ride duration
rideSchema.virtual('actualDuration').get(function() {
  if (this.timing.actualPickupTime && this.timing.actualDropoffTime) {
    return Math.round((this.timing.actualDropoffTime - this.timing.actualPickupTime) / (1000 * 60));
  }
  return null;
});

// Virtual for wait time
rideSchema.virtual('waitTime').get(function() {
  if (this.timing.actualPickupTime && this.timing.requestedPickupTime) {
    return Math.round((this.timing.actualPickupTime - this.timing.requestedPickupTime) / (1000 * 60));
  }
  return null;
});

// Method to check if ride is overdue
rideSchema.methods.isOverdue = function() {
  if (this.status === 'pending' || this.status === 'assigned') {
    const now = new Date();
    const scheduledTime = new Date(this.scheduledTime);
    return now > scheduledTime;
  }
  return false;
};

// Method to get ride summary
rideSchema.methods.getSummary = function() {
  return {
    id: this._id,
    riderName: this.rider ? `${this.rider.firstName} ${this.rider.lastName}` : 'Unknown',
    pickup: this.pickupLocation.address,
    destination: this.destination.address,
    scheduledTime: this.scheduledTime,
    status: this.status,
    priority: this.priority
  };
};

// Indexes for better query performance
rideSchema.index({ rider: 1 });
rideSchema.index({ driver: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ scheduledTime: 1 });
rideSchema.index({ 'pickupLocation.city': 1, 'pickupLocation.state': 1 });
rideSchema.index({ createdBy: 1 });
rideSchema.index({ priority: 1, scheduledTime: 1 });

module.exports = mongoose.model('Ride', rideSchema); 