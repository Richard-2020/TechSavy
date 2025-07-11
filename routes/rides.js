const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Ride = require('../models/Ride');
const Rider = require('../models/Rider');
const Driver = require('../models/Driver');
const { dispatcherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rides
// @desc    Get all rides with filtering and pagination
// @access  Private (Dispatcher/Admin)
router.get('/', dispatcherAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'assigned', 'in-progress', 'completed', 'cancelled', 'no-show']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('rideType').optional().isIn(['medical', 'shopping', 'social', 'other']),
  query('date').optional().isISO8601(),
  query('riderId').optional().isMongoId(),
  query('driverId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      status,
      priority,
      rideType,
      date,
      riderId,
      driverId
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (rideType) filter.rideType = rideType;
    if (riderId) filter.rider = riderId;
    if (driverId) filter.driver = driverId;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledTime = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const skip = (page - 1) * limit;

    const rides = await Ride.find(filter)
      .populate('rider', 'firstName lastName phone')
      .populate('driver', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .sort({ scheduledTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ride.countDocuments(filter);

    res.json({
      rides,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rides/:id
// @desc    Get ride by ID
// @access  Private (Dispatcher/Admin)
router.get('/:id', dispatcherAuth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('rider', 'firstName lastName phone email address emergencyContact')
      .populate('driver', 'firstName lastName phone vehicle')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json({ ride });
  } catch (error) {
    console.error('Get ride error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ride not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rides
// @desc    Create a new ride request
// @access  Private (Dispatcher/Admin)
router.post('/', [
  dispatcherAuth,
  body('rider', 'Rider ID is required').isMongoId(),
  body('pickupLocation.address', 'Pickup address is required').not().isEmpty(),
  body('pickupLocation.city', 'Pickup city is required').not().isEmpty(),
  body('pickupLocation.state', 'Pickup state is required').isLength({ min: 2, max: 2 }),
  body('pickupLocation.zipCode', 'Pickup ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('destination.address', 'Destination address is required').not().isEmpty(),
  body('destination.city', 'Destination city is required').not().isEmpty(),
  body('destination.state', 'Destination state is required').isLength({ min: 2, max: 2 }),
  body('destination.zipCode', 'Destination ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('scheduledTime', 'Scheduled time is required').isISO8601(),
  body('rideType', 'Ride type is required').isIn(['medical', 'shopping', 'social', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('specialRequirements.wheelchairAccessible').optional().isBoolean(),
  body('specialRequirements.requiresAssistance').optional().isBoolean(),
  body('specialRequirements.companionAllowed').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if rider exists and is active
    const rider = await Rider.findById(req.body.rider);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    if (rider.status !== 'active') {
      return res.status(400).json({ message: 'Rider is not active' });
    }

    const rideData = {
      ...req.body,
      timing: {
        requestedPickupTime: new Date(req.body.scheduledTime)
      },
      createdBy: req.user.id
    };

    const ride = new Ride(rideData);
    await ride.save();

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ ride: populatedRide });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rides/:id
// @desc    Update ride
// @access  Private (Dispatcher/Admin)
router.put('/:id', [
  dispatcherAuth,
  body('pickupLocation.address', 'Pickup address is required').not().isEmpty(),
  body('pickupLocation.city', 'Pickup city is required').not().isEmpty(),
  body('pickupLocation.state', 'Pickup state is required').isLength({ min: 2, max: 2 }),
  body('pickupLocation.zipCode', 'Pickup ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('destination.address', 'Destination address is required').not().isEmpty(),
  body('destination.city', 'Destination city is required').not().isEmpty(),
  body('destination.state', 'Destination state is required').isLength({ min: 2, max: 2 }),
  body('destination.zipCode', 'Destination ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('scheduledTime', 'Scheduled time is required').isISO8601(),
  body('rideType', 'Ride type is required').isIn(['medical', 'shopping', 'social', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Don't allow updates if ride is completed or cancelled
    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update completed or cancelled ride' });
    }

    // Update ride data
    Object.assign(ride, req.body);
    ride.timing.requestedPickupTime = new Date(req.body.scheduledTime);
    await ride.save();

    const updatedRide = await Ride.findById(ride._id)
      .populate('rider', 'firstName lastName phone')
      .populate('driver', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');

    res.json({ ride: updatedRide });
  } catch (error) {
    console.error('Update ride error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ride not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rides/:id/assign
// @desc    Assign driver to ride
// @access  Private (Dispatcher/Admin)
router.put('/:id/assign', [
  dispatcherAuth,
  body('driverId', 'Driver ID is required').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Can only assign pending rides' });
    }

    // Check if driver exists and is available
    const driver = await Driver.findById(req.body.driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    if (driver.status !== 'active') {
      return res.status(400).json({ message: 'Driver is not active' });
    }

    // Check if driver is available at scheduled time
    if (!driver.isAvailableAt(new Date(ride.scheduledTime))) {
      return res.status(400).json({ message: 'Driver is not available at scheduled time' });
    }

    ride.driver = req.body.driverId;
    ride.status = 'assigned';
    ride.assignedBy = req.user.id;
    ride.timing.estimatedPickupTime = new Date(ride.scheduledTime);
    await ride.save();

    const updatedRide = await Ride.findById(ride._id)
      .populate('rider', 'firstName lastName phone')
      .populate('driver', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');

    res.json({ ride: updatedRide });
  } catch (error) {
    console.error('Assign ride error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ride or driver not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rides/:id/status
// @desc    Update ride status
// @access  Private (Dispatcher/Admin)
router.put('/:id/status', [
  dispatcherAuth,
  body('status', 'Status is required').isIn(['pending', 'assigned', 'in-progress', 'completed', 'cancelled', 'no-show'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const { status } = req.body;
    ride.status = status;

    // Update timing based on status
    if (status === 'in-progress') {
      ride.timing.actualPickupTime = new Date();
    } else if (status === 'completed') {
      ride.timing.actualDropoffTime = new Date();
    } else if (status === 'cancelled') {
      ride.cancellation = {
        cancelledBy: 'dispatcher',
        cancelledAt: new Date(),
        reason: req.body.reason || 'Cancelled by dispatcher'
      };
    }

    await ride.save();

    const updatedRide = await Ride.findById(ride._id)
      .populate('rider', 'firstName lastName phone')
      .populate('driver', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');

    res.json({ ride: updatedRide });
  } catch (error) {
    console.error('Update ride status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ride not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/rides/:id
// @desc    Cancel ride
// @access  Private (Dispatcher/Admin)
router.delete('/:id', dispatcherAuth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed ride' });
    }

    ride.status = 'cancelled';
    ride.cancellation = {
      cancelledBy: 'dispatcher',
      cancelledAt: new Date(),
      reason: req.body.reason || 'Cancelled by dispatcher'
    };
    await ride.save();

    res.json({ message: 'Ride cancelled successfully' });
  } catch (error) {
    console.error('Cancel ride error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ride not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rides/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Dispatcher/Admin)
router.get('/dashboard/stats', dispatcherAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const stats = await Promise.all([
      Ride.countDocuments({ status: 'pending' }),
      Ride.countDocuments({ status: 'assigned' }),
      Ride.countDocuments({ status: 'in-progress' }),
      Ride.countDocuments({ 
        status: 'completed',
        scheduledTime: { $gte: startOfDay, $lt: endOfDay }
      }),
      Ride.countDocuments({ 
        status: 'cancelled',
        scheduledTime: { $gte: startOfDay, $lt: endOfDay }
      })
    ]);

    res.json({
      pending: stats[0],
      assigned: stats[1],
      inProgress: stats[2],
      completedToday: stats[3],
      cancelledToday: stats[4]
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 