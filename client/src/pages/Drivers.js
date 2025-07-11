import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Car } from 'lucide-react';

const Drivers = () => {
  return (
    <>
      <Helmet>
        <title>Drivers - TechSavy</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage volunteer drivers and their availability
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <Car className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Driver Management</h3>
              <p className="mt-1 text-sm text-gray-500">
                This page will contain the driver management interface with volunteer registration and scheduling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Drivers;
