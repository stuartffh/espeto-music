import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${slug}/admin/dashboard`);
    }
  }, [isAuthenticated, navigate, slug]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate(`/${slug}/admin/dashboard`);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side - Branding */}
      <motion.div
        className="hidden md:flex flex-col items-center justify-center gradient-primary p-12"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <h1 className="text-6xl font-bold text-white mb-4 text-center">
            🎵
          </h1>
          <h2 className="text-5xl font-bold text-white mb-2">
            Espeto Music
          </h2>
          <p className="text-2xl text-white/80">Painel Administrativo</p>
        </motion.div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        className="flex items-center justify-center p-8 bg-light-bg dark:bg-dark-surface"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card variant="glass" className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-6">
            <h1 className="text-4xl font-bold gradient-text mb-2">
              🎵 Espeto Music
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Admin</p>
          </div>

          <h2 className="text-3xl font-bold gradient-text mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Usuário"
              type="text"
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              disabled={loading}
              required
            />

            <Input
              label="Senha"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              error={error}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6">
            <Button
              variant="ghost"
              icon={ArrowLeft}
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar para o site
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default AdminLogin;
