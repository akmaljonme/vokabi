import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './Auth';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ro'yxatdan o'tish funksiyasini qo'shing
    navigate('/login');
  };

  return (
    <AuthLayout title="Ro'yxatdan o'tish" subtitle="Hisob yarating">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Ism</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ismingizni kiriting"
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Emailingizni kiriting"
            required
          />
        </div>
        <div>
          <label>Parol</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolingizni kiriting"
            required
          />
        </div>
        <button type="submit">Ro'yxatdan o'tish</button>
      </form>
      <div>
        Allaqachon hisobingiz bormi? <Link to="/login">Kirish</Link>
      </div>
    </AuthLayout>
  );
};

export default Register;