'use client';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Link from 'next/link';
import { FaBook } from 'react-icons/fa';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  return (
    <Box sx={{ p: { xs: 4, md: 5 }, bgcolor: 'surface.container', borderRadius: '28px', boxShadow: 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ mx: 'auto', mb: 2, display: 'flex', h: 64, w: 64, alignItems: 'center', justifyCenter: 'center', borderRadius: '16px', bgcolor: 'primary.container', color: 'on-primary-container' }}>
          <FaBook size={32} />
        </Box>
        <Typography variant="h4" fontWeight="500" sx={{ mb: 1 }}>Create Account</Typography>
        <Typography variant="body1" color="text.secondary">Sign up to start tracking expenses.</Typography>
      </Box>

      <form onSubmit={handleSignUp}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large"
            sx={{ mt: 2, py: 1.5, borderRadius: '100px' }}
          >
            Sign up
          </Button>
        </Box>
      </form>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link href="/login" style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)', textDecoration: 'none' }}>
            Log in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
