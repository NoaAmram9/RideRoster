import React, { useState } from 'react';
import { reservationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import '../styles/components/CreateReservation.css';

const CreateReservation = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      toast.error('End time must be after start time');
      return;
    }

    setLoading(true);

    try {
      await reservationsAPI.create({
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        notes: formData.notes || null,
      });
      
      toast.success('Reservation created successfully!');
      onSuccess();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create reservation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservation-modal">
      <div className="reservation-card">
        <div className="reservation-header">
          <h2>New Reservation</h2>
          {/* <button onClick={onClose} className="reservation-close">×</button> */}
        </div>

        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="reservation-field">
            <label htmlFor="start_time">Start Time *</label>
            <input
              id="start_time"
              name="start_time"
              type="datetime-local"
              required
              value={formData.start_time}
              onChange={handleChange}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="end_time">End Time *</label>
            <input
              id="end_time"
              name="end_time"
              type="datetime-local"
              required
              value={formData.end_time}
              onChange={handleChange}
              min={formData.start_time || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this reservation..."
            />
          </div>

          <div className="reservation-actions">
            <button type="button" onClick={onClose} className="reservation-btn cancel">Cancel</button>
            <button type="submit" disabled={loading} className="reservation-btn submit">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReservation;
