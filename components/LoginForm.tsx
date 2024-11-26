import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { FirebaseError } from 'firebase/app';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setError(firebaseError.message || 'Failed to sign in');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>
      )}
      
      <div className="space-y-2">
        <label 
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
          aria-label="Email address"
        />
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
          aria-label="Password"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Sign in"
      >
        Sign In
      </button>
    </form>
  );
};

export default LoginForm; 