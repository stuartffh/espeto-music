import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import useCarrinhoStore from '../store/carrinhoStore';

/**
 * Botão Flutuante do Carrinho
 *
 * Exibe quantidade de itens e abre o modal do carrinho ao clicar
 */
function CarrinhoButton() {
  const { carrinho, abrirCarrinho } = useCarrinhoStore();

  const quantidadeItens = carrinho?.quantidadeItens || 0;
  const valorTotal = carrinho?.valorTotal || 0;

  // Não mostrar se carrinho estiver vazio
  if (quantidadeItens === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={abrirCarrinho}
        className="relative bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-full shadow-2xl transition-all p-5 flex items-center gap-3 group"
      >
        {/* Ícone do Carrinho */}
        <div className="relative">
          <ShoppingCart className="w-7 h-7" />

          {/* Badge com quantidade */}
          <AnimatePresence>
            {quantidadeItens > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
              >
                {quantidadeItens}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Valor Total (mostrado ao passar o mouse) */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          whileHover={{ width: 'auto', opacity: 1 }}
          className="overflow-hidden whitespace-nowrap"
        >
          <span className="text-lg font-semibold">
            R$ {valorTotal.toFixed(2).replace('.', ',')}
          </span>
        </motion.div>

        {/* Efeito de pulso */}
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    </motion.div>
  );
}

export default CarrinhoButton;
