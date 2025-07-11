const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Rider = require('../models/Rider');
const { dispatcherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/riders
// @desc    Get all riders with filtering and pagination
// @access  Private (Dispatcher/Admin)
router.get('/', dispatcherAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('city').optional().isString(),
  query('state').optional().isString()
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
      city,
      state
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (state) filter['address.state'] = new RegExp(state, 'i');
    
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;

    const riders = await Rider.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rider.countDocuments(filter);

    res.json({
      riders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get riders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/riders/:id
// @desc    Get rider by ID
// @access  Private (Dispatcher/Admin)
router.get('/:id', dispatcherAuth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .populate('preferences.preferredDrivers', 'firstName lastName phone');

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({ rider });
  } catch (error) {
    console.error('Get rider error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/riders
// @desc    Create a new rider
// @access  Private (Dispatcher/Admin)
router.post('/', [
  dispatcherAuth,
  body('firstName', 'First name is required').not().isEmpty(),
  body('lastName', 'Last name is required').not().isEmpty(),
  body('dateOfBirth', 'Date of birth is required').isISO8601(),
  body('phone', 'Phone number is required').matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  body('email').optional().isEmail(),
  body('address.street', 'Street address is required').not().isEmpty(),
  body('address.city', 'City is required').not().isEmpty(),
  body('address.state', 'State is required').isLength({ min: 2, max: 2 }),
  body('address.zipCode', 'Valid ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('emergencyContact.name', 'Emergency contact name is required').not().isEmpty(),
  body('emergencyContact.relationship', 'Emergency contact relationship is required').not().isEmpty(),
  body('emergencyContact.phone', 'Emergency contact phone is required').matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const riderData = {
      ...req.body,
      createdBy: req.user.id
    };

    const rider = new Rider(riderData);
    await rider.save();

    const populatedRider = await Rider.findById(rider._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({ rider: populatedRider });
  } catch (error) {
    console.error('Create rider error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Rider with this phone number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/riders/:id
// @desc    Update rider
// @access  Private (Dispatcher/Admin)
router.put('/:id', [
  dispatcherAuth,
  body('firstName', 'First name is required').not().isEmpty(),
  body('lastName', 'Last name is required').not().isEmpty(),
  body('phone', 'Phone number is required').matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  body('email').optional().isEmail(),
  body('address.street', 'Street address is required').not().isEmpty(),
  body('address.city', 'City is required').not().isEmpty(),
  body('address.state', 'State is required').isLength({ min: 2, max: 2 }),
  body('address.zipCode', 'Valid ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  body('emergencyContact.name', 'Emergency contact name is required').not().isEmpty(),
  body('emergencyContact.relationship', 'Emergency contact relationship is required').not().isEmpty(),
  body('emergencyContact.phone', 'Emergency contact phone is required').matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Update rider data
    Object.assign(rider, req.body);
    rider.lastUpdatedBy = req.user.id;
    await rider.save();

    const updatedRider = await Rider.findById(rider._id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .populate('preferences.preferredDrivers', 'firstName lastName phone');

    res.json({ rider: updatedRider });
  } catch (error) {
    console.error('Update rider error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Rider not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Rider with this phone number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/riders/:id
// @desc    Delete rider (soft delete by setting status to inactive)
// @access  Private (Dispatcher/Admin)
router.delete('/:id', dispatcherAuth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Soft delete by setting status to inactive
    rider.status = 'inactive';
    rider.lastUpdatedBy = req.user.id;
    await rider.save();

    res.json({ message: 'Rider deactivated successfully' });
  } catch (error) {
    console.error('Delete rider error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/riders/:id/status
// @desc    Update rider status
// @access  Private (Dispatcher/Admin)
router.put('/:id/status', [
  dispatcherAuth,
  body('status', 'Status is required').isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    rider.status = req.body.status;
    rider.lastUpdatedBy = req.user.id;
    await rider.save();

    res.json({ message: 'Rider status updated successfully', rider });
  } catch (error) {
    console.error('Update rider status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/riders/search/autocomplete
// @desc    Search riders for autocomplete
// @access  Private (Dispatcher/Admin)
router.get('/search/autocomplete', dispatcherAuth, [
  query('q', 'Search query is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q } = req.query;
    const searchRegex = new RegExp(q, 'i');

    const riders = await Rider.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex }
      ],
      status: 'active'
    })
    .select('firstName lastName phone email')
    .limit(10);

    res.json({ riders });
  } catch (error) {
    console.error('Rider autocomplete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 