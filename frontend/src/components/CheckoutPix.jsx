import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Loader2, QrCode as QrCodeIcon, CreditCard } from 'lucide-react';
import { criarPagamentoPix } from '../services/api';
import Button from './ui/Button';
import Input from './ui/Input';

/**
 * Componente de Checkout Transparente PIX
 *
 * Exibe formulário simples (nome e CPF opcionalmal), gera QR Code e Pix Copia e Cola
 * sem redirecionar para o Mercado Pago
 */
function CheckoutPix({ pedido, onClose, onSuccess }) {
  const [cpf, setCpf] = useState('');
  const [gerando, setGerando] = useState(false);
  const [pagamento, setPagamento] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setGerando(true);

    try {
      console.log('🛒 [CHECKOUT] Criando pagamento PIX...');
      console.log('📋 Pedido:', pedido);
      console.log('🆔 CPF:', cpf || 'Não fornecido');

      const response = await criarPagamentoPix(pedido.id, {
        nome: pedido.nomeCliente,
        cpf: cpf || undefined,
        email: `cliente.${pedido.id.substring(0, 8)}@espetomusic.com.br`,
      });

      console.log('✅ [CHECKOUT] Pagamento criado:', response.data);
      setPagamento(response.data);
    } catch (error) {
      console.error('❌ [CHECKOUT] Erro:', error);
      setErro(error.response?.data?.error || 'Erro ao gerar pagamento PIX');
    } finally {
      setGerando(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pagamento.pix.qrCodeText);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const formatarCPF = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 11) {
      return apenasNumeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cpf;
  };

  const handleCPFChange = (e) => {
    const formatado = formatarCPF(e.target.value);
    setCpf(formatado);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <CreditCard className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pagamento PIX
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  R$ {pedido.valor?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!pagamento ? (
              // Formulário
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Música
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    🎵 {pedido.musicaTitulo}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seu Nome
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    👤 {pedido.nomeCliente}
                  </p>
                </div>

                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CPF <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <Input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    O CPF é opcional. Pode deixar em branco.
                  </p>
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={gerando}
                  className="w-full"
                  size="lg"
                >
                  {gerando ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <QrCodeIcon size={20} />
                      Gerar QR Code PIX
                    </>
                  )}
                </Button>
              </form>
            ) : (
              // QR Code e Pix Copia e Cola
              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    <img
                      src={pagamento.pix.qrCode}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="mt-3 text-sm text-center text-gray-600 dark:text-gray-400">
                    Escaneie com o app do seu banco
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
                  </div>
                </div>

                {/* Pix Copia e Cola */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pix Copia e Cola
                  </label>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={pagamento.pix.qrCodeText}
                      className="w-full p-3 pr-12 text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute right-2 top-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      {copiado ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Copie e cole no app do seu banco
                  </p>
                </div>

                {/* Status */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⏳ Aguardando pagamento...
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Após o pagamento, sua música será adicionada automaticamente à fila!
                  </p>
                </div>

                {/* Info Adicional */}
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <p>💰 Valor: <span className="font-semibold">R$ {pedido.valor?.toFixed(2)}</span></p>
                  <p>⏰ Validade: 15 dias</p>
                  <p>🎵 Música: {pedido.musicaTitulo}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CheckoutPix;
