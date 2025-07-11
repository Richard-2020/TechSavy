const express = require('express');
const { query, validationResult } = require('express-validator');
const Ride = require('../models/Ride');
const Rider = require('../models/Rider');
const Driver = require('../models/Driver');
const { dispatcherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/rides
// @desc    Get ride statistics and reports
// @access  Private (Dispatcher/Admin)
router.get('/rides', dispatcherAuth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month', 'driver', 'rider', 'type']),
  query('status').optional().isIn(['pending', 'assigned', 'in-progress', 'completed', 'cancelled', 'no-show'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, groupBy = 'day', status } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = {};
    if (Object.keys(dateFilter).length > 0) {
      filter.scheduledTime = dateFilter;
    }
    if (status) filter.status = status;

    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'riders',
          localField: 'rider',
          foreignField: '_id',
          as: 'riderInfo'
        }
      },
      {
        $lookup: {
          from: 'drivers',
          localField: 'driver',
          foreignField: '_id',
          as: 'driverInfo'
        }
      },
      { $unwind: { path: '$riderInfo', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$driverInfo', preserveNullAndEmptyArrays: true } }
    ];

    // Group by specified field
    const groupStage = {
      $group: {
        _id: null,
        totalRides: { $sum: 1 },
        completedRides: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledRides: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalWaitTime: { $sum: '$waitTime' },
        avgWaitTime: { $avg: '$waitTime' },
        totalDuration: { $sum: '$actualDuration' },
        avgDuration: { $avg: '$actualDuration' }
      }
    };

    if (groupBy === 'day') {
      groupStage.$group._id = { $dateToString: { format: '%Y-%m-%d', date: '$scheduledTime' } };
    } else if (groupBy === 'week') {
      groupStage.$group._id = { $dateToString: { format: '%Y-W%V', date: '$scheduledTime' } };
    } else if (groupBy === 'month') {
      groupStage.$group._id = { $dateToString: { format: '%Y-%m', date: '$scheduledTime' } };
    } else if (groupBy === 'driver') {
      groupStage.$group._id = '$driverInfo.firstName';
    } else if (groupBy === 'rider') {
      groupStage.$group._id = '$riderInfo.firstName';
    } else if (groupBy === 'type') {
      groupStage.$group._id = '$rideType';
    }

    pipeline.push(groupStage);
    pipeline.push({ $sort: { _id: 1 } });

    const results = await Ride.aggregate(pipeline);

    res.json({ results });
  } catch (error) {
    console.error('Get ride reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/drivers
// @desc    Get driver performance reports
// @access  Private (Dispatcher/Admin)
router.get('/drivers', dispatcherAuth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const drivers = await Driver.find(filter)
      .populate('createdBy', 'firstName lastName');

    // Get ride statistics for each driver
    const driverStats = await Promise.all(
      drivers.map(async (driver) => {
        const rideFilter = { driver: driver._id };
        
        if (startDate || endDate) {
          rideFilter.scheduledTime = {};
          if (startDate) rideFilter.scheduledTime.$gte = new Date(startDate);
          if (endDate) rideFilter.scheduledTime.$lte = new Date(endDate);
        }

        const rides = await Ride.find(rideFilter);
        
        const stats = {
          totalRides: rides.length,
          completedRides: rides.filter(r => r.status === 'completed').length,
          cancelledRides: rides.filter(r => r.status === 'cancelled').length,
          avgRating: rides.length > 0 ? 
            rides.reduce((sum, ride) => sum + (ride.feedback.riderRating || 0), 0) / rides.length : 0,
          totalWaitTime: rides.reduce((sum, ride) => sum + (ride.waitTime || 0), 0),
          avgWaitTime: rides.length > 0 ? 
            rides.reduce((sum, ride) => sum + (ride.waitTime || 0), 0) / rides.length : 0
        };

        return {
          driver: {
            id: driver._id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            email: driver.email,
            phone: driver.phone,
            status: driver.status,
            rating: driver.rating,
            vehicle: driver.vehicle
          },
          stats
        };
      })
    );

    res.json({ driverStats });
  } catch (error) {
    console.error('Get driver reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/riders
// @desc    Get rider usage reports
// @access  Private (Dispatcher/Admin)
router.get('/riders', dispatcherAuth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const riders = await Rider.find(filter)
      .populate('createdBy', 'firstName lastName');

    // Get ride statistics for each rider
    const riderStats = await Promise.all(
      riders.map(async (rider) => {
        const rideFilter = { rider: rider._id };
        
        if (startDate || endDate) {
          rideFilter.scheduledTime = {};
          if (startDate) rideFilter.scheduledTime.$gte = new Date(startDate);
          if (endDate) rideFilter.scheduledTime.$lte = new Date(endDate);
        }

        const rides = await Ride.find(rideFilter);
        
        const stats = {
          totalRides: rides.length,
          completedRides: rides.filter(r => r.status === 'completed').length,
          cancelledRides: rides.filter(r => r.status === 'cancelled').length,
          avgRating: rides.length > 0 ? 
            rides.reduce((sum, ride) => sum + (ride.feedback.driverRating || 0), 0) / rides.length : 0,
          totalWaitTime: rides.reduce((sum, ride) => sum + (ride.waitTime || 0), 0),
          avgWaitTime: rides.length > 0 ? 
            rides.reduce((sum, ride) => sum + (ride.waitTime || 0), 0) / rides.length : 0,
          rideTypes: rides.reduce((acc, ride) => {
            acc[ride.rideType] = (acc[ride.rideType] || 0) + 1;
            return acc;
          }, {})
        };

        return {
          rider: {
            id: rider._id,
            firstName: rider.firstName,
            lastName: rider.lastName,
            phone: rider.phone,
            email: rider.email,
            status: rider.status,
            age: rider.age,
            address: rider.address
          },
          stats
        };
      })
    );

    res.json({ riderStats });
  } catch (error) {
    console.error('Get rider reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/dashboard
// @desc    Get dashboard summary statistics
// @access  Private (Dispatcher/Admin)
router.get('/dashboard', dispatcherAuth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = Object.keys(dateFilter).length > 0 ? { scheduledTime: dateFilter } : {};

    const [
      totalRides,
      completedRides,
      cancelledRides,
      totalRiders,
      activeRiders,
      totalDrivers,
      activeDrivers,
      avgWaitTime,
      avgDuration
    ] = await Promise.all([
      Ride.countDocuments(filter),
      Ride.countDocuments({ ...filter, status: 'completed' }),
      Ride.countDocuments({ ...filter, status: 'cancelled' }),
      Rider.countDocuments(),
      Rider.countDocuments({ status: 'active' }),
      Driver.countDocuments(),
      Driver.countDocuments({ status: 'active' }),
      Ride.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: null, avgWait: { $avg: '$waitTime' } } }
      ]),
      Ride.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: null, avgDuration: { $avg: '$actualDuration' } } }
      ])
    ]);

    // Get ride type distribution
    const rideTypeStats = await Ride.aggregate([
      { $match: filter },
      { $group: { _id: '$rideType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity
    const recentRides = await Ride.find(filter)
      .populate('rider', 'firstName lastName')
      .populate('driver', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      summary: {
        totalRides,
        completedRides,
        cancelledRides,
        completionRate: totalRides > 0 ? (completedRides / totalRides * 100).toFixed(2) : 0,
        totalRiders,
        activeRiders,
        totalDrivers,
        activeDrivers,
        avgWaitTime: avgWaitTime.length > 0 ? avgWaitTime[0].avgWait : 0,
        avgDuration: avgDuration.length > 0 ? avgDuration[0].avgDuration : 0
      },
      rideTypeStats,
      recentRides
    });
  } catch (error) {
    console.error('Get dashboard reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/export
// @desc    Export ride data for specified date range
// @access  Private (Dispatcher/Admin)
router.get('/export', dispatcherAuth, [
  query('startDate', 'Start date is required').isISO8601(),
  query('endDate', 'End date is required').isISO8601(),
  query('format').optional().isIn(['json', 'csv'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, format = 'json' } = req.query;
    
    const rides = await Ride.find({
      scheduledTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('rider', 'firstName lastName phone')
    .populate('driver', 'firstName lastName phone')
    .populate('createdBy', 'firstName lastName')
    .sort({ scheduledTime: 1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = rides.map(ride => ({
        'Ride ID': ride._id,
        'Rider': `${ride.rider?.firstName} ${ride.rider?.lastName}`,
        'Driver': ride.driver ? `${ride.driver.firstName} ${ride.driver.lastName}` : 'Unassigned',
        'Pickup Address': ride.pickupLocation.address,
        'Destination': ride.destination.address,
        'Scheduled Time': ride.scheduledTime,
        'Status': ride.status,
        'Ride Type': ride.rideType,
        'Priority': ride.priority,
        'Created By': `${ride.createdBy?.firstName} ${ride.createdBy?.lastName}`,
        'Created At': ride.createdAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=rides-${startDate}-to-${endDate}.csv`);
      
      // Convert to CSV string
      const csvString = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');
      
      res.send(csvString);
    } else {
      res.json({ rides });
    }
  } catch (error) {
    console.error('Export reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 