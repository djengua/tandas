'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { PiggyBank, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, nombre, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-6">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 shadow-lg shadow-primary-200 mb-4">
            <PiggyBank className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Únete a Tandas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-5 text-sm flex items-start gap-2 border border-red-100">
              <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre"
              type="text"
              required
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Contraseña"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full mt-1" icon={<UserPlus className="w-4 h-4" />}>
              Registrarse
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
