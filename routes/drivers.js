const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Driver = require('../models/Driver');
const { dispatcherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/drivers
// @desc    Get all drivers with filtering and pagination
// @access  Private (Dispatcher/Admin)
router.get('/', dispatcherAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['pending', 'active', 'inactive', 'suspended']),
  query('wheelchairAccessible').optional().isBoolean(),
  query('available').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      search,
      status,
      wheelchairAccessible,
      available
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (wheelchairAccessible !== undefined) filter['vehicle.features.wheelchairAccessible'] = wheelchairAccessible;
    if (available !== undefined) filter['availability.isAvailable'] = available;
    
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;

    const drivers = await Driver.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Driver.countDocuments(filter);

    res.json({
      drivers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/drivers/:id
// @desc    Get driver by ID
// @access  Private (Dispatcher/Admin)
router.get('/:id', dispatcherAuth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ driver });
  } catch (error) {
    console.error('Get driver error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/drivers
// @desc    Create a new driver
// @access  Private (Dispatcher/Admin)
router.post('/', [
  dispatcherAuth,
  body('firstName', 'First name is required').not().isEmpty(),
  body('lastName', 'Last name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('phone', 'Phone number is required').matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  body('dateOfBirth', 'Date of birth is required').isISO8601(),
  body('address.street', 'Street address is required').not().isEmpty(),
  body('address.city', 'City is required').not().isEmpty(),
  body('address.state', 'State is required').isLength({ min: 2, max: 2 }),
  body('address.zipCode', 'Valid ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('license.number', 'License number is required').not().isEmpty(),
  body('license.state', 'License state is required').isLength({ min: 2, max: 2 }),
  body('license.expirationDate', 'License expiration date is required').isISO8601(),
  body('vehicle.make', 'Vehicle make is required').not().isEmpty(),
  body('vehicle.model', 'Vehicle model is required').not().isEmpty(),
  body('vehicle.year', 'Vehicle year is required').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  body('vehicle.color', 'Vehicle color is required').not().isEmpty(),
  body('vehicle.licensePlate', 'License plate is required').not().isEmpty(),
  body('vehicle.insurance.company', 'Insurance company is required').not().isEmpty(),
  body('vehicle.insurance.policyNumber', 'Insurance policy number is required').not().isEmpty(),
  body('vehicle.insurance.expirationDate', 'Insurance expiration date is required').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ 
      $or: [
        { email: req.body.email },
        { 'license.number': req.body.license.number }
      ]
    });
    
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this email or license number already exists' });
    }

    const driverData = {
      ...req.body,
      createdBy: req.user.id
    };

    const driver = new Driver(driverData);
    await driver.save();

    const populatedDriver = await Driver.findById(driver._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ driver: populatedDriver });
  } catch (error) {
    console.error('Create driver error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Driver with this email or license number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/drivers/:id
// @desc    Update driver
// @access  Private (Dispatcher/Admin)
router.put('/:id', [
  dispatcherAuth,
  body('firstName', 'First name is required').not().isEmpty(),
  body('lastName', 'Last name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('phone', 'Phone number is required').matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  body('address.street', 'Street address is required').not().isEmpty(),
  body('address.city', 'City is required').not().isEmpty(),
  body('address.state', 'State is required').isLength({ min: 2, max: 2 }),
  body('address.zipCode', 'Valid ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('vehicle.make', 'Vehicle make is required').not().isEmpty(),
  body('vehicle.model', 'Vehicle model is required').not().isEmpty(),
  body('vehicle.year', 'Vehicle year is required').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  body('vehicle.color', 'Vehicle color is required').not().isEmpty(),
  body('vehicle.licensePlate', 'License plate is required').not().isEmpty(),
  body('vehicle.insurance.company', 'Insurance company is required').not().isEmpty(),
  body('vehicle.insurance.policyNumber', 'Insurance policy number is required').not().isEmpty(),
  body('vehicle.insurance.expirationDate', 'Insurance expiration date is required').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if email is already taken by another driver
    const existingDriver = await Driver.findOne({ 
      email: req.body.email, 
      _id: { $ne: req.params.id } 
    });
    if (existingDriver) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Update driver data
    Object.assign(driver, req.body);
    driver.lastUpdatedBy = req.user.id;
    await driver.save();

    const updatedDriver = await Driver.findById(driver._id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.json({ driver: updatedDriver });
  } catch (error) {
    console.error('Update driver error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Driver with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/drivers/:id/status
// @desc    Update driver status
// @access  Private (Dispatcher/Admin)
router.put('/:id/status', [
  dispatcherAuth,
  body('status', 'Status is required').isIn(['pending', 'active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.status = req.body.status;
    driver.lastUpdatedBy = req.user.id;
    await driver.save();

    res.json({ message: 'Driver status updated successfully', driver });
  } catch (error) {
    console.error('Update driver status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/drivers/:id/background
// @desc    Update driver background check status
// @access  Private (Dispatcher/Admin)
router.put('/:id/background', [
  dispatcherAuth,
  body('type', 'Background check type is required').isIn(['criminalCheck', 'drivingRecord', 'training']),
  body('status', 'Status is required').isIn(['pending', 'approved', 'rejected']),
  body('completed', 'Completed status is required').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const { type, status, completed } = req.body;
    
    driver.background[type] = {
      completed,
      status,
      completedDate: completed ? new Date() : null
    };

    if (type === 'training' && completed) {
      driver.background[type].certificateNumber = req.body.certificateNumber || null;
    }

    driver.lastUpdatedBy = req.user.id;
    await driver.save();

    res.json({ message: 'Background check updated successfully', driver });
  } catch (error) {
    console.error('Update background check error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/drivers/:id/availability
// @desc    Update driver availability
// @access  Private (Dispatcher/Admin)
router.put('/:id/availability', [
  dispatcherAuth,
  body('isAvailable', 'Availability status is required').isBoolean(),
  body('schedule').optional().isArray(),
  body('maxRidesPerDay').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const { isAvailable, schedule, maxRidesPerDay } = req.body;
    
    driver.availability.isAvailable = isAvailable;
    if (schedule) driver.availability.schedule = schedule;
    if (maxRidesPerDay) driver.availability.maxRidesPerDay = maxRidesPerDay;

    driver.lastUpdatedBy = req.user.id;
    await driver.save();

    res.json({ message: 'Driver availability updated successfully', driver });
  } catch (error) {
    console.error('Update availability error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/drivers/:id
// @desc    Delete driver (soft delete by setting status to inactive)
// @access  Private (Dispatcher/Admin)
router.delete('/:id', dispatcherAuth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Soft delete by setting status to inactive
    driver.status = 'inactive';
    driver.lastUpdatedBy = req.user.id;
    await driver.save();

    res.json({ message: 'Driver deactivated successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/drivers/available
// @desc    Get available drivers for a specific time
// @access  Private (Dispatcher/Admin)
router.get('/available', dispatcherAuth, [
  query('dateTime', 'Date and time is required').isISO8601(),
  query('wheelchairAccessible').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateTime, wheelchairAccessible } = req.query;
    const scheduledTime = new Date(dateTime);

    const filter = {
      status: 'active',
      'availability.isAvailable': true
    };

    if (wheelchairAccessible) {
      filter['vehicle.features.wheelchairAccessible'] = true;
    }

    const drivers = await Driver.find(filter)
      .select('firstName lastName phone vehicle rating')
      .limit(20);

    // Filter drivers who are available at the specific time
    const availableDrivers = drivers.filter(driver => 
      driver.isAvailableAt(scheduledTime)
    );

    res.json({ drivers: availableDrivers });
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 