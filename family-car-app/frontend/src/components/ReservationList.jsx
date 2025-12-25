/**
 * Reservation list component.
 * Displays a list of reservations with actions.
 */

import React from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { reservationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ReservationList = ({ reservations, onRefresh }) => {
  const { user, isAdmin } = useAuth();

  const handleCancel = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

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
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reservations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => {
        const isOwner = reservation.user_id === user?.id;
        const canCancel = isOwner || isAdmin;
        const canApprove = isAdmin && reservation.status === 'pending';

        return (
          <div
            key={reservation.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {format(new Date(reservation.start_time), 'MMM dd, yyyy')}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      reservation.status
                    )}`}
                  >
                    {reservation.status}
                  </span>
                  {isOwner && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                      Your reservation
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    ⏰ {format(new Date(reservation.start_time), 'h:mm a')} -{' '}
                    {format(new Date(reservation.end_time), 'h:mm a')}
                  </p>
                  {reservation.user && (
                    <p>👤 Reserved by: {reservation.user.full_name}</p>
                  )}
                  {reservation.notes && (
                    <p className="mt-2">📝 {reservation.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {canApprove && (
                  <button
                    onClick={() => handleApprove(reservation.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium"
                  >
                    Approve
                  </button>
                )}
                
                {canCancel && reservation.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancel(reservation.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReservationList;
