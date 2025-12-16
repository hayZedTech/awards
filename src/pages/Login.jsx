import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // HARDCODED CREDENTIALS (As per your request)
    // In production, verify this against your backend or env variables!
    if(username === "edennn" && password === "edennn432"){ 
        localStorage.setItem('isAdminLoggedIn', 'true');
        onLogin();
    } else {
        Swal.fire({
            icon: 'error', 
            title: 'Access Denied',
            text: 'Incorrect Username or Password.',
            confirmButtonColor: '#d33',
        });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Admin Portal</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Please sign in to manage nominations.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type={passwordVisible ? "text" : "password"} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password"
              required 
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-md">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;