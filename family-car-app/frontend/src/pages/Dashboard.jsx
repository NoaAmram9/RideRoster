/**
 * Dashboard page component.
 * Shows reservations in calendar/timeline view.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationsAPI } from '../services/api';
import wsService from '../services/websocket';
import toast from 'react-hot-toast';
import ReservationList from '../components/ReservationList';
import CreateReservation from '../components/CreateReservation';
import Navigation from '../components/Navigation';

const Dashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'my', 'all'

  // Load reservations
  const loadReservations = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter === 'my') {
        params.user_id = user.id;
      } else if (filter === 'upcoming') {
        params.status = 'approved';
      }
      
      const response = await reservationsAPI.getAll(params);
      setReservations(response.data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [filter]);

  // WebSocket event handlers
  useEffect(() => {
    const handleReservationCreated = (data) => {
      console.log('Reservation created:', data);
      setReservations((prev) => [data, ...prev]);
      toast.success('New reservation created!');
    };

    const handleReservationUpdated = (data) => {
      console.log('Reservation updated:', data);
      setReservations((prev) =>
        prev.map((res) => (res.id === data.id ? data : res))
      );
      toast.success('Reservation updated!');
    };

    const handleReservationDeleted = (data) => {
      console.log('Reservation deleted:', data);
      setReservations((prev) => prev.filter((res) => res.id !== data.id));
      toast.success('Reservation cancelled!');
    };

    // Register WebSocket listeners
    wsService.on('reservation_created', handleReservationCreated);
    wsService.on('reservation_updated', handleReservationUpdated);
    wsService.on('reservation_deleted', handleReservationDeleted);

    // Cleanup
    return () => {
      wsService.off('reservation_created', handleReservationCreated);
      wsService.off('reservation_updated', handleReservationUpdated);
      wsService.off('reservation_deleted', handleReservationDeleted);
    };
  }, []);

  const handleReservationCreated = () => {
    setShowCreateModal(false);
    loadReservations();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.full_name}!
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'upcoming'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'my'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              My Reservations
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            + New Reservation
          </button>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <ReservationList 
            reservations={reservations}
            onRefresh={loadReservations}
          />
        )}
      </div>

      {/* Create Reservation Modal */}
      {showCreateModal && (
        <CreateReservation
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleReservationCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;
