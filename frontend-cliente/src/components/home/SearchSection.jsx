import { Search, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function SearchSection({
  nome,
  onNomeChange,
  busca,
  onBuscaChange,
  onBuscarClick,
  loading
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3"
    >
      <Card variant="glass" className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            SEU NOME
          </label>
          <Input
            value={nome}
            onChange={(e) => onNomeChange(e.target.value)}
            placeholder="Digite seu nome..."
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" />
            BUSCAR MÚSICA
          </label>
          <div className="flex gap-2">
            <Input
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              placeholder="Nome da música ou artista..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && onBuscarClick()}
            />
            <Button
              variant="primary"
              onClick={onBuscarClick}
              disabled={loading || !busca.trim() || !nome.trim()}
              className="flex-shrink-0"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
