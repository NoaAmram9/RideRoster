/**
 * Fuel logs page component.
 */

import React, { useState, useEffect } from 'react';
import { fuelLogsAPI, reservationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navigation from '../components/Navigation';
import CreateFuelLog from '../components/CreateFuelLog';

const FuelLogs = () => {
  const { user } = useAuth();
  const [fuelLogs, setFuelLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsResponse, summaryResponse] = await Promise.all([
        fuelLogsAPI.getAll({ user_id: user.id }),
        fuelLogsAPI.getMySummary(),
      ]);
      
      setFuelLogs(logsResponse.data);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Failed to load fuel logs:', error);
      toast.error('Failed to load fuel logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFuelLogCreated = () => {
    setShowCreateModal(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fuel Logs</h1>
          <p className="mt-2 text-gray-600">
            Track your fuel usage and balance
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600">Fuel Balance</p>
              <p className={`text-2xl font-bold mt-2 ${summary.fuel_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.fuel_balance.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total_trips}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600">Fuel Added</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total_fuel_added.toFixed(1)}L</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${summary.total_paid.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            + Log Fuel Usage
          </button>
        </div>

        {/* Fuel Logs List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Fuel Logs</h2>
          </div>
          
          {fuelLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No fuel logs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fuelLogs.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(log.logged_at), 'MMM dd, yyyy h:mm a')}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          ⛽ Fuel: {Number(log.fuel_before).toFixed(1)}% → {Number(log.fuel_after).toFixed(1)}%
                        </p>
                        {parseFloat(log.fuel_added_liters) > 0 && (
                          <p className="text-sm text-green-600">
                            ➕ Added: {log.fuel_added_liters}L
                          </p>
                        )}
                        {parseFloat(log.cost_paid) > 0 && (
                          <p className="text-sm text-green-600">
                            💵 Paid: ${log.cost_paid}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Reservation #{log.reservation_id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Fuel Log Modal */}
      {showCreateModal && (
        <CreateFuelLog
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFuelLogCreated}
        />
      )}
    </div>
  );
};

export default FuelLogs;
