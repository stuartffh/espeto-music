import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Copy, CheckCircle, AlertCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../config/api';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { musica, pedidoId, nome, email, cpf } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, checking, approved, expired
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!musica || !pedidoId) {
      navigate('/', { replace: true });
      return;
    }

    criarPagamentoPIX();
  }, [musica, pedidoId, navigate]);

  useEffect(() => {
    if (!paymentData) return;

    // Verificar status do pagamento a cada 5 segundos
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/pagamentos/${paymentData.pagamento.id}/status`);
        if (response.data.status === 'approved') {
          setPaymentStatus('approved');
          clearInterval(interval);
          setTimeout(() => {
            navigate('/', {
              replace: true,
              state: { paymentApproved: true }
            });
          }, 3000);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentData, navigate]);

  useEffect(() => {
    if (!paymentData?.pixExpirationDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiration = new Date(paymentData.pixExpirationDate);
      const diff = expiration - now;

      if (diff <= 0) {
        setPaymentStatus('expired');
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ days, hours, minutes });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentData]);

  const criarPagamentoPIX = async () => {
    try {
      setLoading(true);
      const response = await api.post('/pagamentos/pix', {
        pedidoId,
        email: email || undefined,
        cpf: cpf || undefined,
        nome: nome || undefined,
      });

      setPaymentData(response.data);
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      alert(error.response?.data?.error || 'Erro ao gerar pagamento PIX');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!paymentData?.qrCodeText) return;

    try {
      await navigator.clipboard.writeText(paymentData.qrCodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      alert('Erro ao copiar código PIX');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Gerando pagamento PIX...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Pagamento Aprovado!</h2>
          <p className="text-gray-400 mb-4">Sua música entrará na fila automaticamente</p>
          <p className="text-sm text-gray-500">Redirecionando...</p>
        </motion.div>
      </div>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Pagamento Expirado</h2>
          <p className="text-gray-400 mb-6">
            O prazo para pagamento expirou. Por favor, faça uma nova solicitação.
          </p>
          <Button
            onClick={() => navigate('/', { replace: true })}
            variant="primary"
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-card to-dark-bg border-b border-neon-purple/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Pagamento PIX</h1>
          <p className="text-gray-400 mt-2">Escaneie o QR Code ou copie o código para pagar</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card variant="glass" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-6 h-6 text-neon-cyan" />
                <h2 className="text-xl font-bold text-white">QR Code PIX</h2>
              </div>

              {paymentData?.qrCode ? (
                <div className="bg-white p-4 rounded-lg mb-4">
                  <img
                    src={`data:image/png;base64,${paymentData.qrCode}`}
                    alt="QR Code PIX"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-8 mb-4 flex items-center justify-center">
                  <p className="text-gray-400">QR Code não disponível</p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleCopyPix}
                  variant="secondary"
                  className="w-full"
                  disabled={!paymentData?.qrCodeText}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Código Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copiar Código PIX
                    </>
                  )}
                </Button>

                {timeLeft && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      Expira em: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Informações do Pedido */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Música Selecionada */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Música Selecionada</h3>
              <div className="flex gap-4">
                {musica?.thumbnail && (
                  <img
                    src={musica.thumbnail}
                    alt={musica.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{musica?.title}</p>
                  <p className="text-sm text-gray-400 truncate">{musica?.artist}</p>
                  {musica?.duration && (
                    <p className="text-xs text-gray-500 mt-1">{musica.duration}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Instruções */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Como Pagar</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <p>Abra o app do seu banco e acesse a área PIX</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <p>Escaneie o QR Code ou cole o código PIX copiado</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <p>Confirme o pagamento e aguarde a aprovação</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <p>Sua música entrará na fila automaticamente após a confirmação</p>
                </div>
              </div>
            </Card>

            {/* Status */}
            <Card variant="glass" className="p-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping" />
                </div>
                <div>
                  <p className="font-bold text-white">Aguardando Pagamento</p>
                  <p className="text-sm text-gray-400">Verificando automaticamente...</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
