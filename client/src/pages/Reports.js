import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3 } from 'lucide-react';

const Reports = () => {
  return (
    <>
      <Helmet>
        <title>Reports - TechSavy</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            View analytics and generate reports
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics & Reports</h3>
              <p className="mt-1 text-sm text-gray-500">
                This page will contain comprehensive reporting and analytics features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
