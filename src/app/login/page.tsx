'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Link from 'next/link';
import { FaBook } from 'react-icons/fa';
import { Button, TextField, Typography, Box, Alert, Card, CardContent } from '@mui/material';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: unknown) {
      // Prefer using Firebase error codes when available for robust checks
      const fbErr = err as any;
      if (fbErr && typeof fbErr === 'object' && 'code' in fbErr) {
        const code = String(fbErr.code || '');
        if (code === 'auth/invalid-credential') {
          setError('Invalid email or password. Please try again.');
        } else if (code === 'auth/user-not-found') {
          setError('No account found with this email.');
        } else if (code === 'auth/wrong-password') {
          setError('Incorrect password. Please try again.');
        } else {
          setError(fbErr.message || 'Login failed. Please try again.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 420,
        mx: 'auto',
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Logo and Title */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 2,
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaBook size={28} />
          </Box>
          <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Log in to manage your expenses.
          </Typography>
        </Box>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </Button>
          </Box>
        </form>

        {/* Sign up link */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </Box>
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
