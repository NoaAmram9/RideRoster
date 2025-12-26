import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationsAPI } from '../services/api';
import wsService from '../services/websocket';
import toast from 'react-hot-toast';
import ReservationList from '../components/ReservationList';
import CreateReservation from '../components/CreateReservation';
import Navigation from '../components/Navigation';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('upcoming'); 

  const loadReservations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'my') params.user_id = user.id;
      else if (filter === 'upcoming') params.status = 'approved';

      const response = await reservationsAPI.getAll(params);
      setReservations(response.data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReservations(); }, [filter]);

  useEffect(() => {
    const handleReservationCreated = (data) => {
      setReservations((prev) => [data, ...prev]);
      toast.success('New reservation created!');
    };
    const handleReservationUpdated = (data) => {
      setReservations((prev) => prev.map((res) => (res.id === data.id ? data : res)));
      toast.success('Reservation updated!');
    };
    const handleReservationDeleted = (data) => {
      setReservations((prev) => prev.filter((res) => res.id !== data.id));
      toast.success('Reservation cancelled!');
    };

    wsService.on('reservation_created', handleReservationCreated);
    wsService.on('reservation_updated', handleReservationUpdated);
    wsService.on('reservation_deleted', handleReservationDeleted);

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
    <div className="dashboard-page">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.full_name}!</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="filter-buttons">
            {['upcoming','my','all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'active' : 'inactive'}
              >
                {f === 'upcoming' ? 'Upcoming' : f === 'my' ? 'My Reservations' : 'All'}
              </button>
            ))}
          </div>

          <button onClick={() => setShowCreateModal(true)} className="new-reservation-btn">
            + New Reservation
          </button>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="dashboard-loader"></div>
          </div>
        ) : (
          <ReservationList reservations={reservations} onRefresh={loadReservations} />
        )}
      </div>

      {showCreateModal && (
        <CreateReservation onClose={() => setShowCreateModal(false)} onSuccess={handleReservationCreated} />
      )}
    </div>
  );
};

export default Dashboard;
