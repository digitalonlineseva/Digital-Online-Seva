
import React, { useState } from 'react';
// Corrected import path for root location
import { User } from './types';

interface LoginProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onCancel }) => {
  const [tab, setTab] = useState<'retailer' | 'admin'>('retailer');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock logic: 
    // Admin login: admin/admin123
    // Retailer login: retailer/retailer123
    if (tab === 'admin' && credentials.username === 'admin' && credentials.password === 'admin123') {
      // Fix: Added missing properties to satisfy the User interface requirements
      onLogin({ 
        id: '1', 
        username: 'admin', 
        role: 'admin', 
        fullName: 'Amit Kumar',
        email: 'kamit961586@gmail.com',
        mobileNumber: '9064752831',
        status: 'Active',
        walletBalance: 0,
        transactions: []
      });
    } else if (tab === 'retailer' && credentials.username === 'retailer' && credentials.password === 'retailer123') {
      // Fix: Added missing properties to satisfy the User interface requirements
      onLogin({ 
        id: '2', 
        username: 'retailer', 
        role: 'retailer', 
        fullName: 'Standard Retailer',
        status: 'Active',
        walletBalance: 0,
        transactions: []
      });
    } else {
      setError('Invalid credentials for ' + tab.toUpperCase());
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white text-center relative">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className={`fa-solid ${tab === 'admin' ? 'fa-shield-halved' : 'fa-store'} text-2xl`}></i>
          </div>
          <h2 className="text-2xl font-bold">Portal Login</h2>
          <p className="text-slate-400 text-sm mt-1">Access secure professional tools</p>
        </div>

        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setTab('retailer')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${tab === 'retailer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Retailer Login
          </button>
          <button 
            onClick={() => setTab('admin')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${tab === 'admin' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Admin Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2 border border-red-100 animate-shake">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username</label>
            <div className="relative">
              <i className="fa-solid fa-user-tag absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                required
                type="text"
                placeholder="Enter username"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-slate-50 outline-none transition-all"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({...prev, username: e.target.value}))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-slate-50 outline-none transition-all"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600" />
              Remember me
            </label>
          </div>

          <div className="pt-2 space-y-3">
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Sign In
              <i className="fa-solid fa-right-to-bracket text-sm"></i>
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="w-full text-slate-500 py-2 text-sm font-medium hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        
        <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            {tab === 'retailer' ? "Authorized Retailers Only. Please contact Admin for access." : "Restricted Administrative Access Only"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
