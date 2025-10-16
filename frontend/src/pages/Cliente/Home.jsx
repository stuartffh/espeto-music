import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, User, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { buscarMusicas, criarPedidoMusica, criarPagamento, buscarFila } from '../../services/api';
import socket from '../../services/socket';
import useStore from '../../store/useStore';
import { categorias, getSugestoesDinamicas } from '../../data/musicSuggestions';
import axios from 'axios';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import BottomSheet from '../../components/ui/BottomSheet';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Toast from '../../components/ui/Toast';

import MusicCard from '../../components/MusicCard';
import MusicListItem from '../../components/MusicListItem';
import QueueItem from '../../components/QueueItem';
import CategoryCard from '../../components/CategoryCard';
import ConfettiEffect from '../../components/ConfettiEffect';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';

function Home() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const { fila, setFila } = useStore();
  const [nomeCliente, setNomeCliente] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [modoGratuito, setModoGratuito] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [carregandoConfig, setCarregandoConfig] = useState(true);
  const [sugestoesDinamicas, setSugestoesDinamicas] = useState([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
  const [tempoMaximo, setTempoMaximo] = useState(8);
  const [mostrarRegras, setMostrarRegras] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFilaModal, setShowFilaModal] = useState(false);
  const [showNomeModal, setShowNomeModal] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    Promise.all([
      axios.get(`${API_URL}/api/config/MODO_GRATUITO`),
      axios.get(`${API_URL}/api/config/TEMPO_MAXIMO_MUSICA`)
    ])
      .then(([resModo, resTempo]) => {
        setModoGratuito(resModo.data.valor === 'true');
        const segundos = parseInt(resTempo.data.valor) || 480;
        setTempoMaximo(Math.floor(segundos / 60));
      })
      .catch(error => {
        console.error('Erro ao buscar config:', error);
        setModoGratuito(true);
        setTempoMaximo(8);
      })
      .finally(() => {
        setCarregandoConfig(false);
      });

    buscarFila().then(res => setFila(res.data)).catch(console.error);

    socket.on('fila:atualizada', (novaFila) => {
      setFila(novaFila);
    });

    socket.on('pedido:pago', () => {
      buscarFila().then(res => setFila(res.data)).catch(console.error);
    });

    return () => {
      socket.off('fila:atualizada');
      socket.off('pedido:pago');
    };
  }, [setFila]);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setCarregandoBusca(true);
    try {
      const response = await buscarMusicas(busca);
      setResultados(response.data);
      setCategoriaAtiva(null);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      showToast('Erro ao buscar músicas. Tente novamente.', 'error');
    } finally {
      setCarregandoBusca(false);
    }
  };

  const handleBuscarSugestao = (sugestao) => {
    setBusca(sugestao);
    setCarregandoBusca(true);
    buscarMusicas(sugestao)
      .then(response => {
        setResultados(response.data);
      })
      .catch(error => {
        console.error('Erro:', error);
        showToast('Erro ao buscar música. Tente novamente.', 'error');
      })
      .finally(() => {
        setCarregandoBusca(false);
      });
  };

  const handleEscolherMusica = async (musica) => {
    if (!nomeCliente.trim()) {
      setShowNomeModal(true);
      return;
    }

    setAdicionando(true);

    try {
      const pedido = await criarPedidoMusica({
        nomeCliente: nomeCliente.trim(),
        musicaTitulo: musica.titulo,
        musicaYoutubeId: musica.id,
        musicaThumbnail: musica.thumbnail,
        musicaDuracao: musica.duracao || null,
      });

      if (modoGratuito) {
        setShowConfetti(true);
        showToast('Música adicionada à fila com sucesso! 🎵', 'success');
        await buscarFila().then(res => setFila(res.data));
        setBusca('');
        setResultados([]);
        setCategoriaAtiva(null);
      } else {
        const pagamento = await criarPagamento(pedido.data.id);
        window.location.href = pagamento.data.initPoint;
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast(error.response?.data?.error || 'Erro ao processar pedido', 'error');
    } finally {
      setAdicionando(false);
    }
  };

  const toggleCategoria = async (categoriaId) => {
    if (categoriaAtiva === categoriaId) {
      setCategoriaAtiva(null);
      setSugestoesDinamicas([]);
    } else {
      setCategoriaAtiva(categoriaId);
      setResultados([]);

      setCarregandoSugestoes(true);
      const sugestoes = await getSugestoesDinamicas(categoriaId);
      setSugestoesDinamicas(sugestoes);
      setCarregandoSugestoes(false);
    }
  };

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 md:p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-6 md:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="w-8 md:w-12"></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold gradient-text">
              🎵 Espeto Music
            </h1>
            <ThemeToggle />
          </div>

          {/* Stats Cards Mini */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto mt-4 md:mt-8">
            <Card variant="glass" className="text-center p-2 sm:p-3 md:p-4">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto text-neon-cyan mb-1 md:mb-2" />
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-white">{fila.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Na fila</p>
            </Card>

            <Card variant="glass" className="text-center p-2 sm:p-3 md:p-4">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto text-neon-purple mb-1 md:mb-2" />
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-white">{tempoMaximo}min</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Máximo</p>
            </Card>

            <Card variant="glass" className="text-center p-2 sm:p-3 md:p-4">
              <Badge
                variant={modoGratuito ? 'success' : 'warning'}
                className="mx-auto mb-1 md:mb-2 text-[10px] sm:text-xs"
              >
                {modoGratuito ? 'Grátis' : 'Pago'}
              </Badge>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Modo</p>
            </Card>
          </div>

          {/* Regras Toggle */}
          <button
            onClick={() => setMostrarRegras(!mostrarRegras)}
            className="mt-4 md:mt-6 text-xs sm:text-sm text-neon-cyan hover:text-neon-purple transition-colors flex items-center gap-1.5 md:gap-2 mx-auto"
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {mostrarRegras ? 'Ocultar Regras' : 'Ver Regras'}
          </button>
        </motion.div>

        {/* Regras */}
        <AnimatePresence>
          {mostrarRegras && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card variant="glass" className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold gradient-text mb-6">📋 Regras</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-6 h-6 text-neon-cyan flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Tempo Máximo</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Até {tempoMaximo} minutos por música
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-6 h-6 text-neon-purple flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Nome Obrigatório</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Digite seu nome antes de escolher
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Music className="w-6 h-6 text-neon-pink flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Ordem FIFO</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Primeiro a pedir, primeiro a tocar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">📺</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Acompanhe na TV</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Veja tocando em tempo real
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Campo Nome */}
            <Card variant="glass">
              <Input
                icon={User}
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Digite seu nome..."
              />
            </Card>

            {/* Busca */}
            <form onSubmit={handleBuscar} className="space-y-2 sm:space-y-0">
              <Input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar músicas..."
                icon={Search}
                className="w-full"
                iconRight={() => (
                  <Button
                    type="submit"
                    size="sm"
                    loading={carregandoBusca}
                    disabled={carregandoBusca}
                    className="hidden sm:inline-flex"
                  >
                    Buscar
                  </Button>
                )}
              />
              {/* Botão de busca mobile - abaixo do input */}
              <Button
                type="submit"
                loading={carregandoBusca}
                disabled={carregandoBusca}
                className="w-full sm:hidden"
              >
                {carregandoBusca ? 'Buscando...' : 'Buscar Músicas'}
              </Button>
            </form>

            {/* Resultados */}
            <AnimatePresence mode="wait">
              {carregandoBusca ? (
                <div className="space-y-3">
                  <SkeletonLoader variant="card" count={6} />
                </div>
              ) : resultados.length > 0 ? (
                <>
                  {/* Lista Mobile */}
                  <motion.div
                    className="md:hidden space-y-2"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {resultados.map((musica) => (
                      <motion.div key={musica.id} variants={staggerItem}>
                        <MusicListItem
                          musica={musica}
                          onAdd={() => handleEscolherMusica(musica)}
                          loading={adicionando}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Cards Desktop */}
                  <motion.div
                    className="hidden md:grid md:grid-cols-2 gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {resultados.map((musica) => (
                      <motion.div key={musica.id} variants={staggerItem}>
                        <MusicCard
                          musica={musica}
                          onAdd={() => handleEscolherMusica(musica)}
                          loading={adicionando}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card variant="glass" className="text-center py-8 sm:py-12">
                    <Music className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Nenhuma música exibida
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto px-4">
                      Insira seu nome, digite o nome da música e clique em "Buscar Músicas" para ouvir sua música predileta!
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fila - Desktop */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <Card variant="glass" className="sticky top-4">
                <h3 className="text-xl font-bold gradient-text mb-4">
                  Fila de Músicas
                </h3>
                <AnimatePresence>
                  {fila.length > 0 ? (
                    fila.map((musica, index) => (
                      <QueueItem
                        key={musica.id}
                        musica={musica}
                        posicao={index + 1}
                        isPlaying={musica.status === 'tocando'}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Music className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Fila vazia</p>
                    </div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          )}
        </div>

        {/* FAB Mobile */}
        {isMobile && (
          <motion.button
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 glass p-3 sm:p-4 rounded-full z-30 shadow-neon-cyan"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilaModal(true)}
          >
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan" />
            {fila.length > 0 && (
              <Badge
                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-[10px] sm:text-xs"
                variant="neon"
                pulse
              >
                {fila.length}
              </Badge>
            )}
          </motion.button>
        )}

        {/* BottomSheet Mobile */}
        <BottomSheet
          isOpen={showFilaModal}
          onClose={() => setShowFilaModal(false)}
          title="Fila de Músicas"
        >
          {fila.map((musica, index) => (
            <QueueItem
              key={musica.id}
              musica={musica}
              posicao={index + 1}
              isPlaying={musica.status === 'tocando'}
            />
          ))}
        </BottomSheet>

        {/* Modal Nome */}
        <Modal
          isOpen={showNomeModal}
          onClose={() => setShowNomeModal(false)}
          title="Qual seu nome?"
          size="sm"
        >
          <Input
            icon={User}
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Digite seu nome..."
          />
          <Button
            className="w-full mt-4"
            onClick={() => setShowNomeModal(false)}
            disabled={!nomeCliente.trim()}
          >
            Confirmar
          </Button>
        </Modal>

        {/* Confetti */}
        <ConfettiEffect
          show={showConfetti}
          onComplete={() => setShowConfetti(false)}
        />

        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          isOpen={toast.isOpen}
          onClose={hideToast}
        />
      </div>
    </div>
  );
}

export default Home;
