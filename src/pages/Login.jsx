import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Login.css';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { username: 'mor_2314', password: '83r5^_' },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    const success = await login(values.username, values.password);
    setSubmitting(false);
    if (success) {
      navigate(location.state?.from?.pathname || '/', { replace: true });
    }
  };

  return (
    <div className="login-screen">
      <div className="login-aurora" aria-hidden="true" />
      <div className="login-card">
        <div className="login-brand">
          <span className="navbar-brand-mark">A</span>
          <span className="navbar-brand-text">Atlas Admin</span>
        </div>
        <h1>Sign in</h1>
        <p className="login-subtitle">Use your Fake Store API credentials to access the dashboard.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <FiUser size={15} />
              <input id="username" type="text" autoComplete="username" {...register('username')} />
            </div>
            {errors.username && <span className="form-field-error">{errors.username.message}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FiLock size={15} />
              <input id="password" type="password" autoComplete="current-password" {...register('password')} />
            </div>
            {errors.password && <span className="form-field-error">{errors.password.message}</span>}
          </div>

          <Button type="submit" size="lg" isLoading={submitting} className="login-submit">
            Sign in <FiArrowRight size={16} />
          </Button>
        </form>

        <p className="login-hint">
          Demo credentials are pre-filled from the Fake Store API docs.
        </p>
      </div>
    </div>
  );
}
