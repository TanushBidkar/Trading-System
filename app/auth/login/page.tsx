'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';


export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error fetching session:", error.message);
        }

        if (session) {
          router.push('/');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setLoading(false);
      }
    }

    checkSession();
  }, [router, supabase]);


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#fff',
        backgroundColor: '#0a192f'
      }}>
        <p>Checking authentication...</p>
      </div>
    );
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setFormLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#0a192f',
      color: '#fff'
    }}>
      <h1>Login to Multi-Agent Trading System</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', minWidth: 300 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={formLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: formLoading ? 'not-allowed' : 'pointer',
            marginBottom: 8
          }}
        >
          {formLoading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      </form>
    </div>
  );
}
