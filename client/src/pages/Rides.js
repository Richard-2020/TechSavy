import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Calendar } from 'lucide-react';

const Rides = () => {
  return (
    <>
      <Helmet>
        <title>Rides - TechSavy</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rides</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage ride requests and assignments
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Ride Management</h3>
              <p className="mt-1 text-sm text-gray-500">
                This page will contain the ride management interface with scheduling and assignment features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Rides;
