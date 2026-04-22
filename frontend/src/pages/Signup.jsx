import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  background: '#ffffff',
  borderRadius: '16px',
  padding: '32px',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
};

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register/', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate('/login');
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || 'Signup failed. Please retry.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'linear-gradient(135deg, rgba(14, 116, 144, 0.1), rgba(79, 70, 229, 0.1))',
        padding: '20px',
      }}
    >
      <div style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>Create Account</h1>
        <p style={{ marginTop: '8px', color: '#64748b' }}>Start tracking your DSA journey today.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#334155' }}>Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
            style={inputStyle}
          />

          <label
            style={{ display: 'block', marginTop: '16px', marginBottom: '8px', color: '#334155' }}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            style={inputStyle}
          />

          <label
            style={{ display: 'block', marginTop: '16px', marginBottom: '8px', color: '#334155' }}
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            style={inputStyle}
          />

          <label
            style={{ display: 'block', marginTop: '16px', marginBottom: '8px', color: '#334155' }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            required
            style={inputStyle}
          />

          {error ? (
            <p style={{ color: '#dc2626', marginTop: '12px', marginBottom: 0, fontSize: '14px' }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '12px 14px',
              border: 'none',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop: '16px', marginBottom: 0, color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
