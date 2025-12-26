import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    group_name: '',
    car_model: '',
    is_admin: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await register(formData);
    setLoading(false);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="text-center mb-6">
          <h1> Family Car</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label htmlFor="full_name">Full Name *</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="group_name">Group Name *</label>
            <input
              id="group_name"
              name="group_name"
              type="text"
              required
              value={formData.group_name}
              onChange={handleChange}
              placeholder="e.g., Smith Family"
            />
          </div>

          <div>
            <label htmlFor="car_model">Car Model</label>
            <input
              id="car_model"
              name="car_model"
              type="text"
              value={formData.car_model}
              onChange={handleChange}
              placeholder="e.g., Toyota Camry 2020"
            />
          </div>

          <div className="flex items-center">
            <input
              id="is_admin"
              name="is_admin"
              type="checkbox"
              checked={formData.is_admin}
              onChange={handleChange}
            />
            <label htmlFor="is_admin" className="ml-2">I am the car owner (admin)</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p>
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
