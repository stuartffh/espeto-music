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
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 max-w-[calc(100vw-120px)]"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={abrirCarrinho}
        className="relative bg-gradient-to-r from-futura-accent to-futura-danger text-white rounded-full shadow-2xl hover:shadow-glow-accent transition-all p-3 sm:p-4 md:p-5 flex items-center gap-2 sm:gap-3 group border-2 border-futura-accent/30"
      >
        {/* Ícone do Carrinho */}
        <div className="relative">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />

          {/* Badge com quantidade */}
          <AnimatePresence>
            {quantidadeItens > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 bg-futura-warning text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-futura-warning"
              >
                {quantidadeItens}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Valor Total (sempre visível) */}
        <div className="flex flex-col items-start">
          <span className="text-[10px] sm:text-xs text-white/80 hidden sm:block">Total</span>
          <span className="text-sm sm:text-base md:text-lg font-bold">
            R$ {valorTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Efeito de pulso */}
        <motion.div
          className="absolute inset-0 rounded-full bg-futura-accent/30"
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