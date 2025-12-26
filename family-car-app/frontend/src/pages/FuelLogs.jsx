import React, { useState, useEffect } from 'react';
import { fuelLogsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navigation from '../components/Navigation';
import CreateFuelLog from '../components/CreateFuelLog';
import '../styles/FuelLogs.css';

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
      <div className="fuel-logs-page">
        <Navigation />
        <div className="flex justify-center items-center py-12">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fuel-logs-page">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1>Fuel Logs</h1>
          <p>Track your fuel usage and balance</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="summary-cards">
            <div className="summary-card">
              <p>Fuel Balance</p>
              <p className={summary.fuel_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${summary.fuel_balance.toFixed(2)}
              </p>
            </div>
            <div className="summary-card">
              <p>Total Trips</p>
              <p>{summary.total_trips}</p>
            </div>
            <div className="summary-card">
              <p>Fuel Added</p>
              <p>{summary.total_fuel_added.toFixed(1)}L</p>
            </div>
            <div className="summary-card">
              <p>Total Paid</p>
              <p>${summary.total_paid.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mb-6">
          <button onClick={() => setShowCreateModal(true)} className="log-fuel-btn">
            + Log Fuel Usage
          </button>
        </div>

        {/* Fuel Logs List */}
        <div className="fuel-logs-list">
          {fuelLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No fuel logs yet</p>
            </div>
          ) : (
            fuelLogs.map((log) => (
              <div key={log.id} className="fuel-log-item">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="fuel-log-detail">
                    <p className="fuel-log-date">{format(new Date(log.logged_at), 'MMM dd, yyyy h:mm a')}</p>
                    <p>⛽ Fuel: {Number(log.fuel_before).toFixed(1)}% → {Number(log.fuel_after).toFixed(1)}%</p>
                    {parseFloat(log.fuel_added_liters) > 0 && <p className="added">➕ Added: {log.fuel_added_liters}L</p>}
                    {parseFloat(log.cost_paid) > 0 && <p className="paid">💵 Paid: ${log.cost_paid}</p>}
                  </div>
                  <div className="reservation-badge">
                    Reservation #{log.reservation_id}
                  </div>
                </div>
              </div>
            ))
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
