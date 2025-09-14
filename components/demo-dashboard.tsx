"use client"

export default function DemoDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center">
      <div className="max-w-2xl p-6 bg-slate-800/60 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Demo Trading Dashboard</h2>
        <p className="mb-2">Supabase is not configured. This is a demo view so you can run the app locally without Supabase.</p>
        <ul className="list-disc ml-6 mb-4 text-slate-200">
          <li>Static demo data shown.</li>
          <li>To enable full functionality, create a <code>.env.local</code> file with your Supabase credentials.</li>
        </ul>
        <div className="bg-white/5 p-4 rounded">
          <p className="font-mono text-sm text-slate-300">NEXT_PUBLIC_SUPABASE_URL=your-supabase-url</p>
          <p className="font-mono text-sm text-slate-300">NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
        </div>
      </div>
    </div>
  )
}
