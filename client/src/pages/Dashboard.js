import React from 'react';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  Users, 
  Car, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery(
    'dashboard-stats',
    async () => {
      const response = await axios.get('/api/rides/dashboard/stats');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: recentRides, isLoading: ridesLoading } = useQuery(
    'recent-rides',
    async () => {
      const response = await axios.get('/api/rides?limit=5&page=1');
      return response.data.rides;
    }
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Pending Rides',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Assigned Rides',
      value: stats?.assigned || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'In Progress',
      value: stats?.inProgress || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Completed Today',
      value: stats?.completedToday || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      assigned: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      'in-progress': { color: 'bg-orange-100 text-orange-800', icon: TrendingUp },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - TechSavy</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your ridesharing operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${card.bgColor}`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {card.title}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {card.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Rides
            </h3>
            
            {ridesLoading ? (
              <LoadingSpinner />
            ) : recentRides?.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentRides.map((ride) => (
                    <li key={ride._id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ride.rider?.firstName} {ride.rider?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {ride.pickupLocation?.address} → {ride.destination?.address}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(ride.status)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent rides</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new ride request.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;