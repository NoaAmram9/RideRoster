/**
 * Create fuel log modal component.
 */

import React, { useState, useEffect } from 'react';
import { fuelLogsAPI, reservationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CreateFuelLog = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    reservation_id: '',
    fuel_before: '',
    fuel_after: '',
    fuel_added_liters: '0',
    cost_paid: '0',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await reservationsAPI.getAll({
        user_id: user.id,
        status: 'approved',
      });
      setReservations(response.data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fuel levels
    if (parseFloat(formData.fuel_before) < 0 || parseFloat(formData.fuel_before) > 100) {
      toast.error('Fuel before must be between 0 and 100');
      return;
    }
    if (parseFloat(formData.fuel_after) < 0 || parseFloat(formData.fuel_after) > 100) {
      toast.error('Fuel after must be between 0 and 100');
      return;
    }

    setLoading(true);

    try {
      await fuelLogsAPI.create({
        reservation_id: parseInt(formData.reservation_id),
        fuel_before: parseFloat(formData.fuel_before),
        fuel_after: parseFloat(formData.fuel_after),
        fuel_added_liters: parseFloat(formData.fuel_added_liters),
        cost_paid: parseFloat(formData.cost_paid),
      });
      
      toast.success('Fuel log created successfully!');
      onSuccess();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create fuel log';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Log Fuel Usage</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reservation_id" className="block text-sm font-medium text-gray-700 mb-1">
              Reservation *
            </label>
            <select
              id="reservation_id"
              name="reservation_id"
              required
              value={formData.reservation_id}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a reservation</option>
              {reservations.map((res) => (
                <option key={res.id} value={res.id}>
                  Reservation #{res.id} - {new Date(res.start_time).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fuel_before" className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Before (%) *
            </label>
            <input
              id="fuel_before"
              name="fuel_before"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={formData.fuel_before}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 75.5"
            />
          </div>

          <div>
            <label htmlFor="fuel_after" className="block text-sm font-medium text-gray-700 mb-1">
              Fuel After (%) *
            </label>
            <input
              id="fuel_after"
              name="fuel_after"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={formData.fuel_after}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 50.0"
            />
          </div>

          <div>
            <label htmlFor="fuel_added_liters" className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Added (Liters)
            </label>
            <input
              id="fuel_added_liters"
              name="fuel_added_liters"
              type="number"
              step="0.01"
              min="0"
              value={formData.fuel_added_liters}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 30.5"
            />
          </div>

          <div>
            <label htmlFor="cost_paid" className="block text-sm font-medium text-gray-700 mb-1">
              Cost Paid ($)
            </label>
            <input
              id="cost_paid"
              name="cost_paid"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_paid}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 45.75"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFuelLog;
