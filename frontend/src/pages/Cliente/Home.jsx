import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, User, Clock, ChevronLeft, ChevronRight, Info, CreditCard, Gift, X, Loader2 } from 'lucide-react';
import { buscarMusicas, criarPedidoMusica, buscarFila, validarGiftCard, usarGiftCard } from '../../services/api';
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
import CheckoutPix from '../../components/CheckoutPix';
import CarrinhoModal from '../../components/CarrinhoModal';
import CarrinhoButton from '../../components/CarrinhoButton';
import useCarrinhoStore from '../../store/carrinhoStore';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';

function Home({ locacao }) {
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCheckoutPix, setShowCheckoutPix] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [validandoGift, setValidandoGift] = useState(false);
  const [usandoGift, setUsandoGift] = useState(false);
  const [pedidoPendente, setPedidoPendente] = useState(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [musicaSelecionada, setMusicaSelecionada] = useState(null);
  const [prioridadeSelecionada, setPrioridadeSelecionada] = useState(false);
  const [dedicatoria, setDedicatoria] = useState('');
  const [dedicatoriaDe, setDedicatoriaDe] = useState('');
  const [precoNormal, setPrecoNormal] = useState(5.0);
  const [precoPrioridade, setPrecoPrioridade] = useState(10.0);
  const [permitirDedicatoria, setPermitirDedicatoria] = useState(true);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast, showToast, hideToast } = useToast();
  const { adicionarMusica, carregarCarrinho } = useCarrinhoStore();

  // 🎯 CRITICAL: Garantir que locacaoId está no sessionStorage ANTES de qualquer requisição
  useEffect(() => {
    if (locacao && locacao.id) {
      console.log(`🎯 [HOME] Configurando locacaoId no sessionStorage: ${locacao.id}`);
      sessionStorage.setItem('locacaoId', locacao.id);
      sessionStorage.setItem('locacaoSlug', locacao.slug);
    } else {
      console.log(`🌐 [HOME] Modo global - sem locacaoId`);
      sessionStorage.removeItem('locacaoId');
      sessionStorage.removeItem('locacaoSlug');
    }
  }, [locacao]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    Promise.all([
      axios.get(`${API_URL}/api/public/config/modo_gratuito`),
      axios.get(`${API_URL}/api/public/config/TEMPO_MAXIMO_MUSICA`),
      axios.get(`${API_URL}/api/public/config/PRECO_MUSICA_NORMAL`),
      axios.get(`${API_URL}/api/public/config/PRECO_MUSICA_PRIORITARIA`),
      axios.get(`${API_URL}/api/public/config/PERMITIR_DEDICATORIA`)
    ])
      .then(([resModo, resTempo, resPrecoNormal, resPrecoPrioritario, resDedicatoria]) => {
        // modo_gratuito: "true" = gratuito, "false" = pago
        setModoGratuito(resModo.data.valor === 'true');
        const minutos = parseInt(resTempo.data.valor) || 10;
        setTempoMaximo(minutos);
        setPrecoNormal(parseFloat(resPrecoNormal.data.valor) || 5.0);
        setPrecoPrioridade(parseFloat(resPrecoPrioritario.data.valor) || 10.0);
        setPermitirDedicatoria(resDedicatoria.data.valor === 'true');
      })
      .catch(error => {
        console.error('Erro ao buscar config:', error);
        setModoGratuito(true);
        setTempoMaximo(10);
        setPrecoNormal(5.0);
        setPrecoPrioridade(10.0);
        setPermitirDedicatoria(true);
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

    // Carregar carrinho ao iniciar
    carregarCarrinho();

    return () => {
      socket.off('fila:atualizada');
      socket.off('pedido:pago');
    };
  }, [setFila, carregarCarrinho]);

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
    // Verificar se modo gratuito exige nome ANTES de criar o pedido
    if (modoGratuito && !nomeCliente.trim()) {
      // Guardar música selecionada temporariamente e pedir nome
      setPedidoPendente({
        musica: musica,
        temporario: true
      });
      setShowNomeModal(true);
      setAdicionando(false);
      return;
    }

    // Modo pago: mostrar opções de prioridade e dedicatória
    if (!modoGratuito) {
      setMusicaSelecionada(musica);
      setPrioridadeSelecionada(false);
      setDedicatoria('');
      setDedicatoriaDe('');
      setShowPriorityModal(true);
      return;
    }

    // Modo gratuito: criar pedido direto
    setAdicionando(true);

    try {
      const pedido = await criarPedidoMusica({
        nomeCliente: nomeCliente.trim() || 'Anônimo',
        musicaTitulo: musica.titulo,
        musicaYoutubeId: musica.id,
        musicaThumbnail: musica.thumbnail,
        musicaDuracao: musica.duracao || null,
      });

      setShowConfetti(true);
      showToast('Música adicionada à fila com sucesso! 🎵', 'success');
      await buscarFila().then(res => setFila(res.data));
    } catch (error) {
      console.error('Erro:', error);
      showToast(error.response?.data?.error || 'Erro ao processar pedido', 'error');
    } finally {
      setAdicionando(false);
    }
  };

  const handleConfirmarPrioridade = async () => {
    if (!musicaSelecionada) return;

    setAdicionando(true);
    setShowPriorityModal(false);

    try {
      const pedido = await criarPedidoMusica({
        nomeCliente: nomeCliente.trim() || 'Anônimo',
        musicaTitulo: musicaSelecionada.titulo,
        musicaYoutubeId: musicaSelecionada.id,
        musicaThumbnail: musicaSelecionada.thumbnail,
        musicaDuracao: musicaSelecionada.duracao || null,
        prioridade: prioridadeSelecionada,
        dedicatoria: dedicatoria.trim() || null,
        dedicatoriaDe: dedicatoriaDe.trim() || null,
      });

      // Modo pago: guardar pedido e ir para pagamento
      setPedidoPendente(pedido.data);
      setShowPaymentModal(true);
      setMusicaSelecionada(null);
    } catch (error) {
      console.error('Erro:', error);
      showToast(error.response?.data?.error || 'Erro ao processar pedido', 'error');
    } finally {
      setAdicionando(false);
    }
  };

  const handlePayWithPix = () => {
    setShowCheckoutPix(true);
    setShowPaymentModal(false);
  };

  const handleValidateGiftCard = async () => {
    if (!giftCode.trim()) {
      showToast('Digite um código de gift card', 'error');
      return;
    }

    setValidandoGift(true);
    try {
      const response = await validarGiftCard(giftCode.trim().toUpperCase());
      showToast(`Gift card válido! ${response.data.quantidadeMusicas} música(s)`, 'success');
    } catch (error) {
      console.error('Erro:', error);
      showToast(error.response?.data?.erro || 'Gift card inválido', 'error');
    } finally {
      setValidandoGift(false);
    }
  };

  const handlePayWithGift = async () => {
    if (!giftCode.trim()) {
      showToast('Digite um código de gift card', 'error');
      return;
    }

    if (!pedidoPendente) return;

    setUsandoGift(true);
    try {
      await usarGiftCard(giftCode.trim().toUpperCase(), pedidoPendente.id, nomeCliente.trim());
      setShowPaymentModal(false);
      setShowConfetti(true);
      showToast('Gift card usado com sucesso! Música adicionada à fila! 🎵', 'success');
      await buscarFila().then(res => setFila(res.data));
      setGiftCode('');
      setPedidoPendente(null);
    } catch (error) {
      console.error('Erro:', error);
      showToast(error.response?.data?.erro || 'Erro ao usar gift card', 'error');
    } finally {
      setUsandoGift(false);
    }
  };

  const handleConfirmarNomeGratuito = async () => {
    if (!nomeCliente.trim() || !pedidoPendente) return;

    setAdicionando(true);
    try {
      // Verificar se é um pedido temporário (nova lógica)
      if (pedidoPendente.temporario) {
        // Criar o pedido agora que temos o nome
        const pedido = await criarPedidoMusica({
          nomeCliente: nomeCliente.trim(),
          musicaTitulo: pedidoPendente.musica.titulo,
          musicaYoutubeId: pedidoPendente.musica.id,
          musicaThumbnail: pedidoPendente.musica.thumbnail,
          musicaDuracao: pedidoPendente.musica.duracao || null,
        });

        setShowNomeModal(false);
        setShowConfetti(true);
        showToast('Música adicionada à fila com sucesso! 🎵', 'success');
        await buscarFila().then(res => setFila(res.data));
        setPedidoPendente(null);
      } else {
        // Lógica antiga (caso ainda existam pedidos criados sem nome)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        await axios.patch(`${API_URL}/api/musicas/pedido/${pedidoPendente.id}`, {
          nomeCliente: nomeCliente.trim()
        });

        setShowNomeModal(false);
        setShowConfetti(true);
        showToast('Música adicionada à fila com sucesso! 🎵', 'success');
        await buscarFila().then(res => setFila(res.data));
        setPedidoPendente(null);
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast(error.response?.data?.error || 'Erro ao processar pedido', 'error');
    } finally {
      setAdicionando(false);
    }
  };

  const handleAdicionarAoCarrinho = async (musica) => {
    // Buscar preço da música
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    let preco = 5.0; // Padrão

    try {
      const configResponse = await axios.get(`${API_URL}/api/public/config/PRECO_MUSICA`);
      preco = parseFloat(configResponse.data.valor) || 5.0;
    } catch (error) {
      console.error('Erro ao buscar preço:', error);
    }

    const resultado = await adicionarMusica({
      titulo: musica.titulo,
      youtubeId: musica.id,
      thumbnail: musica.thumbnail,
      duracao: musica.duracao || null,
      valor: preco,
    });

    if (resultado.success) {
      showToast('Música adicionada ao carrinho! 🛒', 'success');
    } else {
      showToast(resultado.error || 'Erro ao adicionar música ao carrinho', 'error');
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
    <div className="min-h-screen bg-gradient-to-br from-light-bg via-gray-100 to-gray-200 dark:from-dark-bg dark:via-gray-900 dark:to-gray-950 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 md:p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-6 md:mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="w-10 md:w-14"></div>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent drop-shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              🎵 Espeto Music
            </motion.h1>
            <ThemeToggle />
          </div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-8 max-w-2xl mx-auto mt-8 md:mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card variant="glass" className="text-center p-5 sm:p-6 md:p-8 border-2 border-neon-cyan/40 hover:border-neon-cyan hover:shadow-2xl hover:shadow-neon-cyan/20 transition-all duration-300 bg-gradient-to-br from-neon-cyan/5 to-transparent">
                <div className="bg-gradient-to-br from-neon-cyan to-neon-purple p-3 md:p-4 rounded-2xl mx-auto w-fit mb-3 md:mb-4 shadow-lg">
                  <Music className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white drop-shadow-lg" />
                </div>
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">{fila.length}</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-200 dark:text-gray-200 font-semibold tracking-wide">Músicas na Fila</p>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card variant="glass" className="text-center p-5 sm:p-6 md:p-8 border-2 border-neon-purple/40 hover:border-neon-purple hover:shadow-2xl hover:shadow-neon-purple/20 transition-all duration-300 bg-gradient-to-br from-neon-purple/5 to-transparent">
                <div className="bg-gradient-to-br from-neon-purple to-neon-pink p-3 md:p-4 rounded-2xl mx-auto w-fit mb-3 md:mb-4 shadow-lg">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white drop-shadow-lg" />
                </div>
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">{tempoMaximo}min</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-200 dark:text-gray-200 font-semibold tracking-wide">Tempo Máximo</p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Regras Toggle */}
          <motion.button
            onClick={() => setMostrarRegras(!mostrarRegras)}
            className="mt-8 md:mt-10 px-6 py-3 rounded-xl glass border-2 border-neon-cyan/40 hover:border-neon-cyan text-sm sm:text-base text-neon-cyan hover:text-white hover:bg-neon-cyan/10 transition-all duration-300 flex items-center gap-3 mx-auto font-semibold shadow-lg hover:shadow-neon-cyan/30 hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Info className="w-5 h-5 sm:w-5 sm:h-5" />
            {mostrarRegras ? 'Ocultar Regras' : 'Ver Regras'}
          </motion.button>
        </motion.div>

        {/* Regras */}
        <AnimatePresence>
          {mostrarRegras && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mb-8 md:mb-12"
            >
              <Card variant="glass" className="max-w-4xl mx-auto border-2 border-neon-purple/30 shadow-xl">
                <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-8">
                  📋 Regras do Espeto Music
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-neon-cyan/5 to-transparent border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-neon-cyan to-blue-500 p-2 rounded-lg">
                      <Clock className="w-6 h-6 text-white flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1">Tempo Máximo</p>
                      <p className="text-sm text-gray-300 dark:text-gray-300 leading-relaxed">
                        Até {tempoMaximo} minutos por música
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-neon-purple/5 to-transparent border border-neon-purple/20 hover:border-neon-purple/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-neon-purple to-purple-600 p-2 rounded-lg">
                      <User className="w-6 h-6 text-white flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1">Nome Obrigatório</p>
                      <p className="text-sm text-gray-300 dark:text-gray-300 leading-relaxed">
                        Digite seu nome antes de escolher
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-neon-pink/5 to-transparent border border-neon-pink/20 hover:border-neon-pink/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-neon-pink to-pink-600 p-2 rounded-lg">
                      <Music className="w-6 h-6 text-white flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1">Ordem FIFO</p>
                      <p className="text-sm text-gray-300 dark:text-gray-300 leading-relaxed">
                        Primeiro a pedir, primeiro a tocar
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 hover:border-green-500/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg text-2xl flex items-center justify-center w-10 h-10">
                      📺
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1">Acompanhe na TV</p>
                      <p className="text-sm text-gray-300 dark:text-gray-300 leading-relaxed">
                        Veja tocando em tempo real
                      </p>
                    </div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Banner Explicativo - Como Funciona */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card variant="glass" className="border-2 border-neon-cyan/40 hover:border-neon-cyan/60 transition-all duration-300 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/5 to-neon-pink/10 shadow-xl hover:shadow-2xl">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink p-4 rounded-2xl shadow-lg">
                    <Info className="w-7 h-7 text-white drop-shadow-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-5 drop-shadow-md">
                      ✨ Como funciona?
                    </h3>
                    <ol className="space-y-4 text-sm sm:text-base">
                      <li className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-lg">1</span>
                        <span className="text-white font-semibold pt-1 leading-relaxed">Busque pela música que deseja ouvir</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">2</span>
                        <span className="text-white font-semibold pt-1 leading-relaxed">{modoGratuito ? 'Clique em "Adicionar" para colocar na fila' : 'Adicione músicas ao carrinho'}</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-pink to-pink-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">3</span>
                        <span className="text-white font-semibold pt-1 leading-relaxed">{modoGratuito ? 'Aguarde sua música tocar na TV!' : 'Finalize o pagamento com PIX ou Gift Card'}</span>
                      </li>
                      {!modoGratuito && (
                        <li className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">4</span>
                          <span className="text-white font-semibold pt-1 leading-relaxed">Após o pagamento, digite seu nome e aproveite!</span>
                        </li>
                      )}
                    </ol>
                  </div>
                </div>
              </Card>
            </motion.div>

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
                          onAdd={() => modoGratuito ? handleEscolherMusica(musica) : handleAdicionarAoCarrinho(musica)}
                          showCartIcon={!modoGratuito}
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
                          onAdd={() => modoGratuito ? handleEscolherMusica(musica) : handleAdicionarAoCarrinho(musica)}
                          showCartButton={!modoGratuito}
                          loading={adicionando}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card variant="glass" className="text-center py-16 sm:py-20 border-2 border-dashed border-neon-cyan/30 hover:border-neon-cyan/60 transition-all duration-300 bg-gradient-to-br from-neon-cyan/5 to-transparent shadow-lg">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Music className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-neon-cyan mb-6 sm:mb-8 drop-shadow-neon" />
                    </motion.div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-4">
                      🎧 Pronto para escolher sua música?
                    </h3>
                    <p className="text-sm sm:text-base text-gray-200 dark:text-gray-200 max-w-lg mx-auto px-4 leading-relaxed">
                      Digite o nome da música ou artista no campo de busca acima e clique em <span className="font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded">"Buscar Músicas"</span> para começar!
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fila - Desktop */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <Card variant="glass" className="sticky top-4 border-2 border-neon-purple/30 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-neon-purple to-neon-pink p-2 rounded-lg">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-extrabold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
                    Fila de Músicas
                  </h3>
                  {fila.length > 0 && (
                    <Badge variant="neon" className="ml-auto">
                      {fila.length}
                    </Badge>
                  )}
                </div>
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 bg-gradient-to-br from-neon-purple/5 to-transparent rounded-xl border border-dashed border-neon-purple/20"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Music className="w-16 h-16 mx-auto text-neon-purple/50 mb-4 drop-shadow-neon" />
                      </motion.div>
                      <p className="text-white font-bold mb-1">Fila vazia</p>
                      <p className="text-sm text-gray-300 dark:text-gray-300 mt-2 px-4">Seja o primeiro a adicionar uma música!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          )}
        </div>

        {/* FAB Mobile */}
        {isMobile && (
          <motion.button
            className="fixed bottom-6 right-6 bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink p-4 rounded-full z-30 shadow-2xl shadow-neon-cyan/50 border-2 border-white/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => setShowFilaModal(true)}
          >
            <Music className="w-6 h-6 text-white drop-shadow-lg" />
            {fila.length > 0 && (
              <Badge
                className="absolute -top-2 -right-2 text-xs font-bold"
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

        {/* Modal Método de Pagamento */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setGiftCode('');
          }}
          title="Como você quer pagar?"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Escolha o método de pagamento para adicionar sua música à fila
            </p>

            {/* Opção PIX */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={handlePayWithPix}
                className="w-full p-4 glass rounded-xl border-2 border-neon-cyan/20 hover:border-neon-cyan transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neon-cyan/10 rounded-lg">
                    <CreditCard className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white">Pagar com PIX</h3>
                    <p className="text-sm text-gray-400">Pagamento via QR Code do Mercado Pago</p>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
              <span className="text-sm text-gray-500">OU</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            </div>

            {/* Opção Gift Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 glass rounded-xl border-2 border-neon-purple/20 hover:border-neon-purple transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-neon-purple/10 rounded-lg">
                  <Gift className="w-6 h-6 text-neon-purple" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-white">Usar Gift Card</h3>
                  <p className="text-sm text-gray-400">Digite seu código de presente</p>
                </div>
              </div>

              <Input
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                placeholder="GIFT-XXXX-XXXX"
                className="mb-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && giftCode.trim()) {
                    handlePayWithGift();
                  }
                }}
              />

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleValidateGiftCard}
                  disabled={validandoGift || !giftCode.trim()}
                  className="flex-1"
                >
                  {validandoGift ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    'Validar'
                  )}
                </Button>
                <Button
                  onClick={handlePayWithGift}
                  disabled={usandoGift || !giftCode.trim()}
                  className="flex-1"
                >
                  {usandoGift ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Usando...
                    </>
                  ) : (
                    'Usar Gift Card'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </Modal>

        {/* Modal Nome */}
        <Modal
          isOpen={showNomeModal}
          onClose={() => {
            // Só permitir fechar se cancelar o pedido
            setPedidoPendente(null);
            setShowNomeModal(false);
          }}
          title="Nome obrigatório"
          size="sm"
        >
          <p className="text-sm text-gray-400 mb-4">
            Para adicionar músicas no modo gratuito, é necessário informar seu nome.
          </p>
          <Input
            icon={User}
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Digite seu nome..."
            required
            autoFocus
          />
          <Button
            className="w-full mt-4"
            onClick={handleConfirmarNomeGratuito}
            disabled={!nomeCliente.trim() || adicionando}
            loading={adicionando}
          >
            Confirmar
          </Button>
        </Modal>

        {/* Modal Prioridade e Dedicatória */}
        <Modal
          isOpen={showPriorityModal}
          onClose={() => {
            setShowPriorityModal(false);
            setMusicaSelecionada(null);
            setPrioridadeSelecionada(false);
            setDedicatoria('');
            setDedicatoriaDe('');
          }}
          title="Opções da Música"
          size="lg"
        >
          {musicaSelecionada && (
            <div className="space-y-6">
              {/* Informações da Música */}
              <div className="flex items-center gap-4 p-4 glass rounded-xl">
                <img
                  src={musicaSelecionada.thumbnail}
                  alt={musicaSelecionada.titulo}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-white line-clamp-2">
                    {musicaSelecionada.titulo}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {Math.floor(musicaSelecionada.duracao / 60)}:{String(musicaSelecionada.duracao % 60).padStart(2, '0')}
                  </p>
                </div>
              </div>

              {/* Seleção de Prioridade */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-neon-cyan">💎</span> Escolha a prioridade
                </h4>

                {/* Opção Normal */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => setPrioridadeSelecionada(false)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      !prioridadeSelecionada
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-gray-700 glass'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          !prioridadeSelecionada ? 'border-neon-cyan bg-neon-cyan' : 'border-gray-600'
                        }`}>
                          {!prioridadeSelecionada && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white">Normal</p>
                          <p className="text-sm text-gray-400">Entra na fila na ordem de chegada</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-neon-cyan">
                        R$ {precoNormal.toFixed(2)}
                      </p>
                    </div>
                  </button>
                </motion.div>

                {/* Opção Prioritária */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => setPrioridadeSelecionada(true)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      prioridadeSelecionada
                        ? 'border-neon-purple bg-neon-purple/10'
                        : 'border-gray-700 glass'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          prioridadeSelecionada ? 'border-neon-purple bg-neon-purple' : 'border-gray-600'
                        }`}>
                          {prioridadeSelecionada && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white flex items-center gap-2">
                            Prioritária <Badge variant="neon" className="text-xs">VIP</Badge>
                          </p>
                          <p className="text-sm text-gray-400">Toca antes na fila!</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-neon-purple">
                        R$ {precoPrioridade.toFixed(2)}
                      </p>
                    </div>
                  </button>
                </motion.div>
              </div>

              {/* Dedicatória (Opcional) */}
              {permitirDedicatoria && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-neon-pink">💝</span> Dedicatória (Opcional)
                  </h4>
                  <p className="text-sm text-gray-400">
                    Envie uma mensagem especial que será exibida na TV quando sua música tocar!
                  </p>

                  <Input
                    value={dedicatoriaDe}
                    onChange={(e) => setDedicatoriaDe(e.target.value)}
                    placeholder="De: Seu nome..."
                    maxLength={50}
                  />

                  <textarea
                    value={dedicatoria}
                    onChange={(e) => setDedicatoria(e.target.value)}
                    placeholder="Para: Escreva sua dedicatória aqui..."
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 glass rounded-xl border border-gray-700 focus:border-neon-cyan transition-all resize-none text-white placeholder-gray-500"
                  />

                  <p className="text-xs text-gray-500 text-right">
                    {dedicatoria.length}/200 caracteres
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPriorityModal(false);
                    setMusicaSelecionada(null);
                    setPrioridadeSelecionada(false);
                    setDedicatoria('');
                    setDedicatoriaDe('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarPrioridade}
                  disabled={adicionando}
                  loading={adicionando}
                  className="flex-1"
                >
                  Continuar - R$ {prioridadeSelecionada ? precoPrioridade.toFixed(2) : precoNormal.toFixed(2)}
                </Button>
              </div>
            </div>
          )}
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

        {/* Checkout PIX Transparente */}
        {showCheckoutPix && pedidoPendente && (
          <CheckoutPix
            pedido={pedidoPendente}
            onClose={() => {
              setShowCheckoutPix(false);
              setPedidoPendente(null);
            }}
            onSuccess={async () => {
              setShowCheckoutPix(false);
              setShowConfetti(true);
              showToast('Pagamento processado! Música será adicionada à fila! 🎵', 'success');
              await buscarFila().then(res => setFila(res.data));
              setPedidoPendente(null);
            }}
          />
        )}

        {/* Carrinho Modal */}
        <CarrinhoModal />

        {/* Botão Flutuante do Carrinho */}
        <CarrinhoButton />
      </div>
    </div>
  );
}

export default Home;
