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
    <div className="min-h-screen bg-futura-bg text-white">
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
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold gradient-text"
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
              <Card variant="glass" hover glow className="text-center p-5 sm:p-6 md:p-8 border border-futura-primary/30">
                <div className="bg-gradient-to-br from-futura-primary/20 to-futura-secondary/20 p-3 md:p-4 rounded-xl mx-auto w-fit mb-3 md:mb-4 border border-futura-primary/30">
                  <Music className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-futura-primary" />
                </div>
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold gradient-text-primary mb-2">{fila.length}</p>
                <p className="text-xs sm:text-sm md:text-base text-futura-gray-700 font-semibold">Músicas na Fila</p>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card variant="glass" hover glow className="text-center p-5 sm:p-6 md:p-8 border border-futura-secondary/30">
                <div className="bg-gradient-to-br from-futura-secondary/20 to-futura-accent/20 p-3 md:p-4 rounded-xl mx-auto w-fit mb-3 md:mb-4 border border-futura-secondary/30">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-futura-secondary" />
                </div>
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold gradient-text-primary mb-2">{tempoMaximo}min</p>
                <p className="text-xs sm:text-sm md:text-base text-futura-gray-700 font-semibold">Tempo Máximo</p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Regras Toggle */}
          <Button
            onClick={() => setMostrarRegras(!mostrarRegras)}
            variant="outline"
            className="mt-8 md:mt-10"
          >
            <Info className="w-5 h-5" />
            {mostrarRegras ? 'Ocultar Regras' : 'Ver Regras'}
          </Button>
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
              <Card variant="glass" hover glow className="max-w-4xl mx-auto border border-futura-primary/30">
                <h2 className="text-2xl md:text-3xl font-extrabold gradient-text-primary mb-8">
                  📋 Regras do Espeto Music
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className="flex items-start gap-4 p-4 glass rounded-xl border border-futura-border hover:border-futura-primary transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-futura-primary/20 to-futura-secondary/20 p-2 rounded-lg border border-futura-primary/30 flex-shrink-0">
                      <Clock className="w-6 h-6 text-futura-primary flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-semibold text-futura-primary mb-1">Tempo Máximo</p>
                      <p className="text-sm text-futura-gray-700 leading-relaxed">
                        Até {tempoMaximo} minutos por música
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-4 retro-card border-tv-beige hover:border-tv-blue transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-futura-secondary/20 to-futura-accent/20 p-2 rounded-lg border border-futura-secondary/30 flex-shrink-0">
                      <User className="w-6 h-6 text-futura-secondary flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-semibold text-futura-secondary mb-1">Nome Obrigatório</p>
                      <p className="text-sm text-futura-gray-700 leading-relaxed">
                        Digite seu nome antes de escolher
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-4 retro-card border-tv-beige hover:border-tv-red transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-futura-accent/20 to-futura-danger/20 p-2 rounded-lg border border-futura-accent/30 flex-shrink-0">
                      <Music className="w-6 h-6 text-futura-accent flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-semibold text-futura-accent mb-1">Ordem FIFO</p>
                      <p className="text-sm text-futura-gray-700 leading-relaxed">
                        Primeiro a pedir, primeiro a tocar
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-4 glass rounded-xl border border-futura-border hover:border-futura-primary transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-br from-futura-success/20 to-futura-primary/20 p-2 rounded-lg border border-futura-success/30 flex-shrink-0 text-2xl flex items-center justify-center w-10 h-10">
                      📺
                    </div>
                    <div>
                      <p className="font-semibold text-futura-success mb-1">Acompanhe na TV</p>
                      <p className="text-sm text-futura-gray-700 leading-relaxed">
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
              <Card variant="glass" hover glow className="border border-futura-primary/30">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 bg-gradient-to-br from-futura-primary/20 to-futura-secondary/20 p-4 rounded-xl border border-futura-primary/30">
                    <Info className="w-7 h-7 text-futura-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-extrabold gradient-text-primary mb-5">
                      ✨ Como funciona?
                    </h3>
                    <ol className="space-y-4 text-sm sm:text-base">
                      <li className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-futura-primary to-futura-secondary text-white flex items-center justify-center text-sm font-bold rounded-lg">1</span>
                        <span className="text-white font-semibold pt-1 leading-relaxed">Busque pela música que deseja ouvir</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-futura-secondary to-futura-accent text-white flex items-center justify-center text-sm font-bold rounded-lg">2</span>
                        <span className="text-white font-semibold pt-1 leading-relaxed">{modoGratuito ? 'Clique em "Adicionar" para colocar na fila' : 'Adicione músicas ao carrinho'}</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-futura-accent to-futura-danger text-white flex items-center justify-center text-sm font-bold rounded-lg">3</span>
                        <span className="text-white font-semibold pt-1 leading-relaxed">{modoGratuito ? 'Aguarde sua música tocar na TV!' : 'Finalize o pagamento com PIX ou Gift Card'}</span>
                      </li>
                      {!modoGratuito && (
                        <li className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-futura-success to-futura-primary text-black flex items-center justify-center text-sm font-bold rounded-lg">4</span>
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
                  <Card variant="retro" className="text-center py-16 sm:py-20 border-2 border-dashed border-tv-beige hover:border-tv-phosphor transition-all duration-300 shadow-tv-glow">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Music className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-tv-phosphor mb-6 sm:mb-8 tv-text-glow" />
                    </motion.div>
                    <h3 className="text-xl sm:text-2xl font-mono font-extrabold text-tv-phosphor mb-4 tv-text-glow">
                      🎧 PRONTO PARA ESCOLHER SUA MÚSICA?
                    </h3>
                    <p className="text-sm sm:text-base text-tv-gray font-mono max-w-lg mx-auto px-4 leading-relaxed">
                      Digite o nome da música ou artista no campo de busca acima e clique em <span className="font-bold text-tv-phosphor bg-tv-screen border border-tv-phosphor px-2 py-1 font-mono tv-text-glow">"BUSCAR MÚSICAS"</span> para começar!
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fila - Desktop */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <Card variant="retro" className="sticky top-4 border-tv-beige shadow-tv-glow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="retro-bg border-2 border-tv-beige p-2">
                    <Music className="w-5 h-5 text-tv-black" />
                  </div>
                  <h3 className="text-xl font-mono font-extrabold text-tv-phosphor tv-text-glow">
                    FILA DE MÚSICAS
                  </h3>
                  {fila.length > 0 && (
                    <Badge variant="retro" className="ml-auto">
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
                      className="text-center py-12 retro-card border-tv-beige border-dashed"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Music className="w-16 h-16 mx-auto text-tv-gray mb-4" />
                      </motion.div>
                      <p className="text-tv-phosphor font-mono font-bold mb-1 tv-text-glow">FILA VAZIA</p>
                      <p className="text-sm text-tv-gray font-mono mt-2 px-4">Seja o primeiro a adicionar uma música!</p>
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
            className="fixed bottom-6 right-6 retro-button p-4 rounded-none z-30 shadow-tv-glow border-tv-beige"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => setShowFilaModal(true)}
          >
            <Music className="w-6 h-6 text-tv-black" />
            {fila.length > 0 && (
              <Badge
                className="absolute -top-2 -right-2 text-xs font-bold font-mono"
                variant="danger"
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
            <p className="text-sm text-tv-gray font-mono text-center">
              Escolha o método de pagamento para adicionar sua música à fila
            </p>

            {/* Opção PIX */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={handlePayWithPix}
                className="w-full p-4 retro-card border-tv-beige hover:border-tv-phosphor transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 retro-bg border-2 border-tv-beige">
                    <CreditCard className="w-6 h-6 text-tv-black" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-mono font-bold text-tv-phosphor tv-text-glow">PAGAR COM PIX</h3>
                    <p className="text-sm text-tv-gray font-mono">Pagamento via QR Code do Mercado Pago</p>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-tv-beige" />
              <span className="text-sm text-tv-gray font-mono">OU</span>
              <div className="flex-1 h-px bg-tv-beige" />
            </div>

            {/* Opção Gift Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 retro-card border-tv-beige hover:border-tv-blue transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 retro-bg border-2 border-tv-beige">
                  <Gift className="w-6 h-6 text-tv-black" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-mono font-bold text-tv-phosphor tv-text-glow">USAR GIFT CARD</h3>
                  <p className="text-sm text-tv-gray font-mono">Digite seu código de presente</p>
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
          <p className="text-sm text-tv-gray font-mono mb-4">
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
              <div className="flex items-center gap-4 p-4 retro-card border-tv-beige">
                <img
                  src={musicaSelecionada.thumbnail}
                  alt={musicaSelecionada.titulo}
                  className="w-20 h-20 border-2 border-tv-beige object-cover pixelated"
                />
                <div className="flex-1">
                  <h3 className="font-mono font-bold text-tv-phosphor line-clamp-2 tv-text-glow">
                    {musicaSelecionada.titulo}
                  </h3>
                  <p className="text-sm text-tv-gray font-mono mt-1">
                    {Math.floor(musicaSelecionada.duracao / 60)}:{String(musicaSelecionada.duracao % 60).padStart(2, '0')}
                  </p>
                </div>
              </div>

              {/* Seleção de Prioridade */}
              <div className="space-y-3">
                <h4 className="font-mono font-semibold text-tv-phosphor flex items-center gap-2 tv-text-glow">
                  <span>💎</span> ESCOLHA A PRIORIDADE
                </h4>

                {/* Opção Normal */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => setPrioridadeSelecionada(false)}
                    className={`w-full p-4 retro-card border-2 transition-all font-mono ${
                      !prioridadeSelecionada
                        ? 'border-tv-phosphor shadow-tv-glow'
                        : 'border-tv-beige'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                          !prioridadeSelecionada ? 'border-tv-phosphor retro-bg' : 'border-tv-beige retro-bg'
                        }`}>
                          {!prioridadeSelecionada && (
                            <div className="w-2 h-2 bg-tv-black rounded-full" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-tv-phosphor tv-text-glow">NORMAL</p>
                          <p className="text-sm text-tv-gray">Entra na fila na ordem de chegada</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-tv-phosphor tv-text-glow">
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
                    className={`w-full p-4 retro-card border-2 transition-all font-mono ${
                      prioridadeSelecionada
                        ? 'border-tv-blue shadow-tv-glow-blue'
                        : 'border-tv-beige'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                          prioridadeSelecionada ? 'border-tv-blue retro-bg' : 'border-tv-beige retro-bg'
                        }`}>
                          {prioridadeSelecionada && (
                            <div className="w-2 h-2 bg-tv-black rounded-full" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-tv-phosphor tv-text-glow flex items-center gap-2">
                            PRIORITÁRIA <Badge variant="retro" className="text-xs font-mono">VIP</Badge>
                          </p>
                          <p className="text-sm text-tv-gray">Toca antes na fila!</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-tv-blue tv-text-glow">
                        R$ {precoPrioridade.toFixed(2)}
                      </p>
                    </div>
                  </button>
                </motion.div>
              </div>

              {/* Dedicatória (Opcional) */}
              {permitirDedicatoria && (
                <div className="space-y-3">
                  <h4 className="font-mono font-semibold text-tv-phosphor flex items-center gap-2 tv-text-glow">
                    <span>💝</span> DEDICATÓRIA (OPCIONAL)
                  </h4>
                  <p className="text-sm text-tv-gray font-mono">
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
                    className="w-full px-4 py-3 retro-input resize-none font-mono"
                  />

                  <p className="text-xs text-tv-gray font-mono text-right">
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
