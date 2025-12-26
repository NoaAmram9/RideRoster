import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        
        {/* Logo + Links */}
        <div className="flex items-center">
          <Link to="/dashboard" className="flex items-center logo">
            <span className="text-3xl">🚗</span>
            <span className="ml-2 text-2xl logo-text">Family Car</span>
          </Link>

          <div className="hidden sm:flex sm:ml-8 sm:space-x-6 nav-links">
            <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            <Link to="/fuel-logs" className={isActive('/fuel-logs')}>Fuel Logs</Link>
            {isAdmin && <Link to="/rules" className={isActive('/rules')}>Rules</Link>}
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-4">
          <div className="user-info text-right">
            <p>{user?.full_name}</p>
            <p>{isAdmin ? ' Admin' : 'User'}</p>
          </div>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="sm:hidden border-t border-[#FFE3CC] mobile-menu">
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/fuel-logs" className={isActive('/fuel-logs')}>Fuel Logs</Link>
        {isAdmin && <Link to="/rules" className={isActive('/rules')}>Rules</Link>}
      </div>
    </nav>
  );
};

export default Navigation;
