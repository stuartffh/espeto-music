import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfettiEffect from '../../components/ConfettiEffect';

function Pagamento() {
  const { status } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status === 'sucesso') {
      setShowConfetti(true);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  const statusConfig = {
    sucesso: {
      icon: CheckCircle,
      title: 'Pagamento Aprovado!',
      description: 'Sua música foi adicionada à fila. Obrigado!',
      color: 'text-neon-green',
      animation: { scale: [0, 1.2, 1], rotate: [0, 360] },
    },
    pendente: {
      icon: Loader2,
      title: 'Pagamento Pendente',
      description: 'Aguardando confirmação do pagamento...',
      color: 'text-neon-cyan',
      animation: { rotate: 360 },
    },
    falha: {
      icon: XCircle,
      title: 'Pagamento Recusado',
      description: 'Não foi possível processar o pagamento.',
      color: 'text-neon-pink',
      animation: { x: [-10, 10, -10, 10, 0] },
    },
  };

  const config = statusConfig[status] || statusConfig.falha;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-elevated dark:from-dark-bg dark:to-dark-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="max-w-md w-full"
      >
        <Card variant="glass" className="text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={config.animation}
            transition={{
              duration: status === 'pendente' ? 1 : 0.6,
              repeat: status === 'pendente' ? Infinity : 0,
              ease: 'easeOut',
            }}
            className="mb-6"
          >
            <Icon className={`w-24 h-24 mx-auto ${config.color}`} />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white dark:text-white mb-2">
            {config.title}
          </h1>

          {/* Description */}
          <p className="text-gray-400 dark:text-gray-400 mb-6">
            {config.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-gray-700 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Redirecionando em {countdown}s...
            </p>
          </div>

          {/* Button */}
          <Button
            icon={ArrowLeft}
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Voltar Agora
          </Button>
        </Card>
      </motion.div>

      {/* Confetti */}
      <ConfettiEffect
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  );
}

export default Pagamento;
