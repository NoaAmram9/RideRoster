import React from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { reservationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/components/ReservationList.css';

const ReservationList = ({ reservations, onRefresh }) => {
  const { user, isAdmin } = useAuth();

  const handleCancel = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await reservationsAPI.delete(reservationId);
      toast.success('Reservation cancelled');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel reservation');
    }
  };

  const handleApprove = async (reservationId) => {
    try {
      await reservationsAPI.update(reservationId, { status: 'approved' });
      toast.success('Reservation approved');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve reservation');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  if (reservations.length === 0) {
    return <div className="reservation-empty">No reservations found</div>;
  }

  return (
    <div className="reservation-list">
      {reservations.map((res) => {
        const isOwner = res.user_id === user?.id;
        const canCancel = isOwner || isAdmin;
        const canApprove = isAdmin && res.status === 'pending';

        return (
          <div key={res.id} className="reservation-card">
            <div className="reservation-info">
              <div className="reservation-header">
                <h3>{format(new Date(res.start_time), 'MMM dd, yyyy')}</h3>
                <span className={`reservation-status ${getStatusColor(res.status)}`}>
                  {res.status}
                </span>
                {isOwner && <span className="reservation-owner">Your reservation</span>}
              </div>

              <div className="reservation-details">
                <p>⏰ {format(new Date(res.start_time), 'h:mm a')} - {format(new Date(res.end_time), 'h:mm a')}</p>
                {res.user && <p>👤 Reserved by: {res.user.full_name}</p>}
                {res.notes && <p>📝 {res.notes}</p>}
              </div>
            </div>

            <div className="reservation-actions">
              {canApprove && (
                <button onClick={() => handleApprove(res.id)} className="btn-approve">Approve</button>
              )}
              {canCancel && res.status !== 'cancelled' && (
                <button onClick={() => handleCancel(res.id)} className="btn-cancel">Cancel</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReservationList;
