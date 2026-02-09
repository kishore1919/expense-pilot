'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Link from 'next/link';
import { FaBook } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  return (
    <div className="surface-strong w-full p-8 md:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <FaBook className="text-2xl" />
        </div>
        <h2 className="page-title !text-3xl">Welcome Back</h2>
        <p className="page-subtitle">Log in to manage your expenses.</p>
      </div>

      <form className="space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="text-field"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="text-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="status-error text-center">{error}</p>}

        <div>
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Log in
          </button>
        </div>
      </form>

      <div className="mt-8 text-center text-slate-600">
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
