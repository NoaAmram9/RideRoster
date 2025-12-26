import React, { useState, useEffect } from 'react';
import { fuelLogsAPI, reservationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../styles/components/CreateFuelLog.css';

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
    <div className="fuel-modal">
      <div className="fuel-card">
        <div className="fuel-header">
          <h2>Log Fuel Usage</h2>
          <button onClick={onClose} className="fuel-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="fuel-form">
          <div className="fuel-field">
            <label htmlFor="reservation_id">Reservation *</label>
            <select
              id="reservation_id"
              name="reservation_id"
              required
              value={formData.reservation_id}
              onChange={handleChange}
            >
              <option value="">Select a reservation</option>
              {reservations.map((res) => (
                <option key={res.id} value={res.id}>
                  Reservation #{res.id} - {new Date(res.start_time).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="fuel-field">
            <label htmlFor="fuel_before">Fuel Before (%) *</label>
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
              placeholder="e.g., 75.5"
            />
          </div>

          <div className="fuel-field">
            <label htmlFor="fuel_after">Fuel After (%) *</label>
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
              placeholder="e.g., 50.0"
            />
          </div>

          <div className="fuel-field">
            <label htmlFor="fuel_added_liters">Fuel Added (Liters)</label>
            <input
              id="fuel_added_liters"
              name="fuel_added_liters"
              type="number"
              step="0.01"
              min="0"
              value={formData.fuel_added_liters}
              onChange={handleChange}
              placeholder="e.g., 30.5"
            />
          </div>

          <div className="fuel-field">
            <label htmlFor="cost_paid">Cost Paid ($)</label>
            <input
              id="cost_paid"
              name="cost_paid"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_paid}
              onChange={handleChange}
              placeholder="e.g., 45.75"
            />
          </div>

          <div className="fuel-actions">
            <button type="button" onClick={onClose} className="fuel-btn cancel">Cancel</button>
            <button type="submit" disabled={loading} className="fuel-btn submit">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFuelLog;
