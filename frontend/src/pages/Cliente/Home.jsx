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

import MusicCard from '../../components/MusicCard';
import QueueItem from '../../components/QueueItem';
import CategoryCard from '../../components/CategoryCard';
import ConfettiEffect from '../../components/ConfettiEffect';

import { useMediaQuery } from '../../hooks/useMediaQuery';

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
      alert('Erro ao buscar músicas');
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
        alert('Erro ao buscar música');
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
      alert(error.response?.data?.error || 'Erro ao processar pedido');
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
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-12"></div>
            <h1 className="text-5xl md:text-7xl font-bold gradient-text">
              🎵 Espeto Music
            </h1>
            <ThemeToggle />
          </div>

          {/* Stats Cards Mini */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
            <Card variant="glass" className="text-center p-4">
              <Music className="w-6 h-6 mx-auto text-neon-cyan mb-2" />
              <p className="text-2xl font-bold text-white dark:text-white">{fila.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Na fila</p>
            </Card>

            <Card variant="glass" className="text-center p-4">
              <Clock className="w-6 h-6 mx-auto text-neon-purple mb-2" />
              <p className="text-2xl font-bold text-white dark:text-white">{tempoMaximo}min</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Máximo</p>
            </Card>

            <Card variant="glass" className="text-center p-4">
              <Badge
                variant={modoGratuito ? 'success' : 'warning'}
                className="mx-auto mb-2"
              >
                {modoGratuito ? 'Grátis' : 'Pago'}
              </Badge>
              <p className="text-xs text-gray-600 dark:text-gray-400">Modo</p>
            </Card>
          </div>

          {/* Regras Toggle */}
          <button
            onClick={() => setMostrarRegras(!mostrarRegras)}
            className="mt-6 text-sm text-neon-cyan hover:text-neon-purple transition-colors flex items-center gap-2 mx-auto"
          >
            <Info className="w-4 h-4" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campo Nome */}
            <Card variant="glass">
              <Input
                label="Seu Nome"
                icon={User}
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Digite seu nome..."
              />
            </Card>

            {/* Busca */}
            <form onSubmit={handleBuscar}>
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
                  >
                    Buscar
                  </Button>
                )}
              />
            </form>

            {/* Categorias */}
            <Card variant="glass">
              <h2 className="text-xl font-bold gradient-text mb-4">Categorias</h2>
              <div className="flex gap-4 overflow-x-auto snap-x no-scrollbar pb-4">
                {categorias.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    categoria={cat}
                    active={categoriaAtiva === cat.id}
                    onClick={() => toggleCategoria(cat.id)}
                  />
                ))}
              </div>

              {/* Sugestões */}
              {categoriaAtiva && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Sugestões {carregandoSugestoes && '...'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sugestoesDinamicas.map((sugestao, index) => (
                      <Button
                        key={index}
                        variant="neon"
                        size="sm"
                        onClick={() => handleBuscarSugestao(sugestao)}
                      >
                        {sugestao}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Resultados */}
            <AnimatePresence mode="wait">
              {carregandoBusca ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SkeletonLoader variant="card" count={6} />
                </div>
              ) : resultados.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {resultados.map((musica, index) => (
                    <motion.div key={musica.id} variants={staggerItem}>
                      <MusicCard
                        musica={musica}
                        onAdd={() => handleEscolherMusica(musica)}
                        loading={adicionando}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : null}
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
            className="fixed bottom-6 right-6 glass p-4 rounded-full z-30 shadow-neon-cyan"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilaModal(true)}
          >
            <Music className="w-6 h-6 text-neon-cyan" />
            {fila.length > 0 && (
              <Badge
                className="absolute -top-2 -right-2"
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
            label="Nome"
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
      </div>
    </div>
  );
}

export default Home;
