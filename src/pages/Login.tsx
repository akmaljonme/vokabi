import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './Auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Login funksiyasini qo'shing
  };

  return (
    <AuthLayout title="Xush kelibsiz!" subtitle="Natijalaringizni saqlash uchun kiring">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <button type="submit">Kirish</button>
      </form>
      <div>
        Hisobingiz yo'qmi? <Link to="/register">Ro'yxatdan o'tish</Link>
      </div>
    </AuthLayout>
  );
};

export default Login;