'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token && user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}
