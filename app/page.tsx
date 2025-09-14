
'use client';
import React from 'react';

export default function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isSupabaseConfigured = supabaseUrl && supabaseUrl.length > 0 && supabaseKey && supabaseKey.length > 0;

  if (!isSupabaseConfigured) {
    return (
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0a192f',color:'#fff'}}>
        <h1>Multi-Agent Trading System (Demo Mode)</h1>
        <p>Supabase is not configured. Running in demo mode.</p>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0a192f',color:'#fff'}}>
      <h1>Multi-Agent Trading System</h1>
      <p>Supabase connected! Full features enabled.</p>
    </div>
  );
}
