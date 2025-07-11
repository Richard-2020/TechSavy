import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Users } from 'lucide-react';

const Riders = () => {
  return (
    <>
      <Helmet>
        <title>Riders - TechSavy</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage senior citizen riders and their information
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Riders Management</h3>
              <p className="mt-1 text-sm text-gray-500">
                This page will contain the riders management interface with CRUD operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Riders;
