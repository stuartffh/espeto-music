import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import StatusBar from '../components/home/StatusBar';
import NowPlaying from '../components/home/NowPlaying';
import CategoryGrid from '../components/home/CategoryGrid';
import SearchSection from '../components/home/SearchSection';
import Tutorial from '../components/Tutorial';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../config/api';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado da aplicação
  const [nome, setNome] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState({});
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Modais
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Carregar configurações e estado inicial
  useEffect(() => {
    carregarConfiguracoes();
    carregarEstadoPlayer();

    // Verificar se deve mostrar tutorial
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }

    // Polling para atualizar fila e música atual
    const interval = setInterval(() => {
      carregarEstadoPlayer();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Verificar se voltou da tela de pagamento com sucesso
  useEffect(() => {
    if (location.state?.paymentApproved) {
      // Limpar state do location
      window.history.replaceState({}, document.title);
      carregarEstadoPlayer();
    }
  }, [location]);

  const carregarConfiguracoes = async () => {
    try {
      const response = await api.get('/configuracoes/publicas');
      const configObj = {};
      response.data.forEach(config => {
        configObj[config.chave] = config.valor;
      });
      setConfigs(configObj);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const carregarEstadoPlayer = async () => {
    try {
      const [estadoResponse, filaResponse] = await Promise.all([
        api.get('/player/estado'),
        api.get('/fila')
      ]);

      setCurrentSong(estadoResponse.data.musicaAtual);
      setQueue(filaResponse.data.filter(m => m.status === 'pendente'));
    } catch (error) {
      console.error('Erro ao carregar estado do player:', error);
    }
  };

  const handleBuscar = async () => {
    if (!busca.trim() || !nome.trim()) return;

    setLoading(true);
    try {
      const response = await api.get('/musicas/buscar', {
        params: { q: busca }
      });
      setSearchResults(response.data);
      setResultModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
      alert('Erro ao buscar músicas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category) => {
    setBusca(category);
    handleBuscar();
  };

  const handleSolicitarMusica = async (musica) => {
    if (!nome.trim()) {
      alert('Por favor, digite seu nome antes de solicitar uma música.');
      return;
    }

    try {
      // Criar pedido de música
      const response = await api.post('/pedidos', {
        musicaYoutubeId: musica.youtubeId || musica.id,
        musicaTitulo: musica.titulo || musica.title,
        musicaArtista: musica.artista || musica.artist,
        musicaDuracao: musica.duracao || musica.duration,
        musicaThumbnail: musica.thumbnail,
        nomeCliente: nome.trim(),
        valor: parseFloat(configs.PRECO_MUSICA || '5.00'),
      });

      const pedidoId = response.data.id;

      // Redirecionar para tela de pagamento
      navigate('/payment', {
        state: {
          musica: {
            id: musica.youtubeId || musica.id,
            title: musica.titulo || musica.title,
            artist: musica.artista || musica.artist,
            duration: musica.duracao || musica.duration,
            thumbnail: musica.thumbnail,
          },
          pedidoId,
          nome: nome.trim(),
        },
      });

      setResultModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert(error.response?.data?.error || 'Erro ao criar pedido de música.');
    }
  };

  const queueCount = queue.length + (currentSong ? 1 : 0);
  const maxWaitTime = parseInt(configs.TEMPO_MAXIMO_ESPERA || '8');
  const price = parseFloat(configs.PRECO_MUSICA || '0');
  const mode = configs.MODO_FILA || 'gratuito';

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Tutorial */}
      {showTutorial && (
        <Tutorial
          onClose={() => setShowTutorial(false)}
          onComplete={() => setShowTutorial(false)}
        />
      )}

      {/* Status Bar */}
      <StatusBar
        queueCount={queueCount}
        maxWaitTime={maxWaitTime}
        price={price}
        mode={mode}
        onRulesClick={() => setRulesModalOpen(true)}
      />

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto">
        {/* Now Playing */}
        <NowPlaying currentSong={currentSong} queue={queue} />

        {/* Search Section */}
        <SearchSection
          nome={nome}
          onNomeChange={setNome}
          busca={busca}
          onBuscaChange={setBusca}
          onBuscarClick={handleBuscar}
          loading={loading}
        />

        {/* Category Grid */}
        <CategoryGrid onCategoryClick={handleCategoryClick} />

        {/* Informações Adicionais */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4 py-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white mb-1">Como funciona?</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>1. Digite seu nome</li>
                  <li>2. Busque pela música ou artista desejado</li>
                  <li>3. Selecione a música e aguarde sua vez</li>
                  <li>4. Acompanhe a fila em tempo real</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Regras */}
      <Modal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        title="Regras e Informações"
      >
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-bold text-white mb-2">Tempo de Espera</h4>
            <p>O tempo máximo de espera é de {maxWaitTime} minutos por música.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">Modo de Operação</h4>
            <p>
              {mode === 'gratuito'
                ? 'O sistema está operando em modo GRATUITO. Aproveite!'
                : `Cada música custa R$ ${price.toFixed(2)}.`}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">Moderação</h4>
            <p>
              Todas as solicitações passam por moderação. Músicas com conteúdo
              inadequado serão automaticamente rejeitadas.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">Fila</h4>
            <p>
              As músicas são tocadas por ordem de chegada. Você pode acompanhar
              sua posição na fila em tempo real.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={() => setRulesModalOpen(false)}>
            Entendi
          </Button>
        </div>
      </Modal>

      {/* Modal de Resultados da Busca */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Resultados da Busca"
        size="lg"
      >
        {searchResults.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Nenhuma música encontrada.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((musica) => (
              <motion.div
                key={musica.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 glass rounded-lg hover:bg-neon-cyan/5 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {musica.titulo}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {musica.artista}
                    </p>
                    {musica.duracao && (
                      <p className="text-gray-500 text-xs mt-1">
                        Duração: {Math.floor(musica.duracao / 60)}:{String(musica.duracao % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSolicitarMusica(musica)}
                    className="flex-shrink-0"
                  >
                    Pagar pra Tocar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResultModalOpen(false)}>
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Home;
