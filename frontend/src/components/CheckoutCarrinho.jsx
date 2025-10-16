import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Loader2, QrCode as QrCodeIcon, CreditCard, CheckCircle, ShoppingCart, AlertCircle } from 'lucide-react';
import useCarrinhoStore from '../store/carrinhoStore';
import socket from '../services/socket';
import Button from './ui/Button';
import Input from './ui/Input';

/**
 * Componente de Checkout do Carrinho (Múltiplas Músicas)
 *
 * Exibe formulário simples (nome e CPF opcional), gera QR Code único
 * para pagamento de todas as músicas no carrinho
 */
function CheckoutCarrinho({ carrinho, onClose, onSuccess }) {
  const [nomeCliente, setNomeCliente] = useState(carrinho?.nomeCliente || '');
  const [cpf, setCpf] = useState('');
  const [gerando, setGerando] = useState(false);
  const [pagamento, setPagamento] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);

  const { finalizarCarrinho, definirNomeCliente } = useCarrinhoStore();

  // Escutar evento de pagamento aprovado via WebSocket
  useEffect(() => {
    const handlePagamentoPago = (data) => {
      console.log('💰 [CHECKOUT CARRINHO] Pagamento aprovado via WebSocket:', data);

      // Verificar se é o pagamento deste carrinho (comparar com ID do pagamento)
      if (pagamento && data.pagamentoId === pagamento.pagamento.id) {
        console.log('✅ [CHECKOUT CARRINHO] Pagamento confirmado para este carrinho!');
        setPagamentoAprovado(true);

        // Aguardar 2 segundos para mostrar feedback visual
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      }
    };

    socket.on('pedido:pago', handlePagamentoPago);

    // Cleanup ao desmontar
    return () => {
      socket.off('pedido:pago', handlePagamentoPago);
    };
  }, [pagamento, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nomeCliente.trim()) {
      setErro('Por favor, informe seu nome');
      return;
    }

    setErro('');
    setGerando(true);

    try {
      console.log('🛒 [CHECKOUT CARRINHO] Finalizando carrinho...');
      console.log('📋 Carrinho:', carrinho);
      console.log('👤 Nome:', nomeCliente);
      console.log('🆔 CPF:', cpf || 'Não fornecido');

      // Atualizar nome no carrinho primeiro
      await definirNomeCliente(nomeCliente.trim());

      const dadosPagador = {
        nome: nomeCliente.trim(),
      };

      // Adicionar CPF apenas se fornecido
      if (cpf && cpf.trim()) {
        dadosPagador.cpf = cpf.replace(/\D/g, ''); // Remove formatação
      }

      const resultado = await finalizarCarrinho(dadosPagador);

      if (resultado.success) {
        console.log('✅ [CHECKOUT CARRINHO] Pagamento criado:', resultado.data);
        setPagamento(resultado.data);
      } else {
        setErro(resultado.error || 'Erro ao gerar pagamento PIX');
      }
    } catch (error) {
      console.error('❌ [CHECKOUT CARRINHO] Erro:', error);
      setErro(error.response?.data?.error || 'Erro ao gerar pagamento PIX');
    } finally {
      setGerando(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pagamento.qrCodeText);
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

  const handleCpfChange = (e) => {
    setCpf(formatarCPF(e.target.value));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-red-500/20 w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Finalizar Compra</h2>
                <p className="text-sm text-slate-400">
                  {carrinho?.quantidadeItens} {carrinho?.quantidadeItens === 1 ? 'música' : 'músicas'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
            {/* Banner de Pagamento Aprovado */}
            {pagamentoAprovado && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-400">Pagamento Aprovado!</h3>
                  <p className="text-sm text-green-300">
                    Suas músicas serão adicionadas à fila em instantes
                  </p>
                </div>
              </motion.div>
            )}

            {!pagamento ? (
              // Formulário de Dados
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Resumo do Pedido</h3>
                  <div className="space-y-2 mb-4">
                    {carrinho?.musicas?.map((musica, index) => (
                      <div key={musica.youtubeId} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                        <img
                          src={musica.thumbnail}
                          alt={musica.titulo}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{musica.titulo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-600/10 border border-red-500/20 rounded-lg">
                    <span className="text-lg text-slate-300">Total</span>
                    <span className="text-2xl font-bold text-white">
                      R$ {carrinho?.valorTotal?.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Seu Nome *
                  </label>
                  <Input
                    type="text"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    placeholder="Digite seu nome..."
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CPF (opcional)
                  </label>
                  <Input
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Se não informado, será gerado automaticamente
                  </p>
                </div>

                {erro && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-300">{erro}</p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={gerando}
                  disabled={gerando || !nomeCliente.trim()}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Gerar PIX
                </Button>
              </form>
            ) : (
              // QR Code e Pix Copia e Cola
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Pague com PIX</h3>
                  <p className="text-sm text-slate-400">
                    Escaneie o QR Code ou copie o código PIX
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="relative p-4 bg-white rounded-xl">
                    {pagamento.qrCode ? (
                      <img
                        src={`data:image/png;base64,${pagamento.qrCode}`}
                        alt="QR Code PIX"
                        className="w-64 h-64"
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-slate-200">
                        <QrCodeIcon className="w-20 h-20 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pix Copia e Cola */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    PIX Copia e Cola
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pagamento.qrCodeText}
                      readOnly
                      className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Copiar código PIX"
                    >
                      {copiado ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Instruções */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <QrCodeIcon className="w-5 h-5" />
                    Como Pagar
                  </h4>
                  <ol className="text-sm text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha pagar com PIX</li>
                    <li>Escaneie o QR Code ou cole o código</li>
                    <li>Confirme o pagamento</li>
                  </ol>
                </div>

                {/* Informações do Pagamento */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-400">Valor Total</span>
                    <span className="text-xl font-bold text-white">
                      R$ {pagamento.valor?.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Aguardando confirmação do pagamento...
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    <span className="text-sm text-slate-400">Escutando pagamento</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CheckoutCarrinho;
