import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import useCarrinhoStore from '../store/carrinhoStore';
import Button from './ui/Button';
import CheckoutCarrinho from './CheckoutCarrinho';

/**
 * Modal do Carrinho de Compras
 *
 * Exibe as músicas no carrinho, permite remover itens e finalizar compra
 */
function CarrinhoModal() {
  const {
    carrinho,
    loading,
    error,
    isOpen,
    fecharCarrinho,
    carregarCarrinho,
    removerMusica,
    limparCarrinho,
    limparErro,
  } = useCarrinhoStore();

  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);

  // Carregar carrinho ao abrir modal
  useEffect(() => {
    if (isOpen) {
      carregarCarrinho();
    }
  }, [isOpen, carregarCarrinho]);

  // Limpar erro após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        limparErro();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, limparErro]);

  const handleRemoverMusica = async (youtubeId) => {
    setRemovendoId(youtubeId);
    await removerMusica(youtubeId);
    setRemovendoId(null);
  };

  const handleLimparCarrinho = async () => {
    if (confirm('Deseja realmente limpar o carrinho?')) {
      await limparCarrinho();
    }
  };

  const handleFinalizarCompra = () => {
    setMostrarCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    setMostrarCheckout(false);
    fecharCarrinho();
  };

  const isCarrinhoVazio = !carrinho || carrinho.quantidadeItens === 0;

  if (!isOpen) return null;

  // Exibir checkout se estiver finalizando
  if (mostrarCheckout) {
    return (
      <CheckoutCarrinho
        carrinho={carrinho}
        onClose={() => setMostrarCheckout(false)}
        onSuccess={handleCheckoutSuccess}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={fecharCarrinho}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-red-500/20 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Meu Carrinho</h2>
                <p className="text-sm text-slate-400">
                  {carrinho?.quantidadeItens || 0} {carrinho?.quantidadeItens === 1 ? 'música' : 'músicas'}
                </p>
              </div>
            </div>
            <button
              onClick={fecharCarrinho}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Erro */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Conteúdo */}
          <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-6">
            {loading && !carrinho ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
                <p className="text-slate-400">Carregando carrinho...</p>
              </div>
            ) : isCarrinhoVazio ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-6 bg-slate-800/50 rounded-full mb-4">
                  <ShoppingCart className="w-16 h-16 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Carrinho Vazio</h3>
                <p className="text-slate-400 text-center max-w-sm">
                  Adicione até 3 músicas ao seu carrinho e pague tudo de uma vez!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrinho?.musicas?.map((musica, index) => (
                  <motion.div
                    key={musica.youtubeId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-red-500/30 transition-all"
                  >
                    {/* Thumbnail */}
                    <img
                      src={musica.thumbnail || '/placeholder-music.png'}
                      alt={musica.titulo}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{musica.titulo}</h4>
                      <p className="text-sm text-slate-400">
                        {Math.floor(musica.duracao / 60)}:{String(musica.duracao % 60).padStart(2, '0')}
                      </p>
                    </div>

                    {/* Ações */}
                    <button
                      onClick={() => handleRemoverMusica(musica.youtubeId)}
                      disabled={removendoId === musica.youtubeId}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Remover do carrinho"
                    >
                      {removendoId === musica.youtubeId ? (
                        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5 text-red-500" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isCarrinhoVazio && (
            <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg text-slate-300">Valor Total</span>
                <span className="text-3xl font-bold text-white">
                  R$ {carrinho?.valorTotal?.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleLimparCarrinho}
                  className="flex-1"
                  disabled={loading}
                >
                  Limpar Carrinho
                </Button>
                <Button
                  onClick={handleFinalizarCompra}
                  className="flex-1"
                  disabled={loading}
                >
                  Finalizar Compra
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-3">
                Limite de 3 músicas por compra
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CarrinhoModal;
