/**
 * Navigation component.
 * Shows navigation menu and user info.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl">🚗</span>
              <span className="ml-2 text-xl font-bold text-gray-900">Family Car</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Dashboard
              </Link>
              
              <Link
                to="/fuel-logs"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/fuel-logs')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Fuel Logs
              </Link>

              {isAdmin && (
                <Link
                  to="/rules"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/rules')
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Rules
                </Link>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? '👑 Admin' : 'User'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/dashboard"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/dashboard')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Dashboard
          </Link>
          
          <Link
            to="/fuel-logs"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/fuel-logs')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Fuel Logs
          </Link>

          {isAdmin && (
            <Link
              to="/rules"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/rules')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              Rules
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
