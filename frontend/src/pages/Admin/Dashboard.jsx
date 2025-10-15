import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Play,
  Pause,
  SkipForward,
  Music,
  TrendingUp,
  RefreshCw,
  Trash2,
  Edit2,
  Shield,
  CheckCircle,
  XCircle,
  Filter,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import AdminSidebar from '../../components/AdminSidebar';
import StatsCard from '../../components/StatsCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import QueueItem from '../../components/QueueItem';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function AdminDashboard() {
  const { admin, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Estado da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  // Estados gerais
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('overview');
  const [atualizandoSugestoes, setAtualizandoSugestoes] = useState(false);

  // Alterar senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirm, setSenhaConfirm] = useState('');

  // Controle do Player
  const [estadoPlayer, setEstadoPlayer] = useState({ status: 'stopped', volume: 80 });
  const [musicaAtualPlayer, setMusicaAtualPlayer] = useState(null);
  const [filaPlayer, setFilaPlayer] = useState([]);

  // Moderação
  const [palavras, setPalavras] = useState([]);
  const [loadingPalavras, setLoadingPalavras] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSeveridade, setFiltroSeveridade] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [palavraEditando, setPalavraEditando] = useState(null);
  const [novaPalavra, setNovaPalavra] = useState({ palavra: '', categoria: 'AMBOS', severidade: 'MEDIA' });
  const [textoTeste, setTextoTeste] = useState('');
  const [resultadoTeste, setResultadoTeste] = useState(null);

  // Estados do Overview
  const [statsOverview, setStatsOverview] = useState({
    totalMusicas: 0,
    musicasTocadas: 0,
    tempoTotal: '0h',
    configuracoes: 0,
  });

  useEffect(() => {
    carregarConfiguracoes();
    carregarEstadoPlayer();
    carregarFilaPlayer();
    carregarOverview();
  }, []);

  // Atualizar collapsed da sidebar quando a tela mudar
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  const carregarOverview = async () => {
    try {
      const [musicaAtual, fila, configsData] = await Promise.all([
        axios.get(`${API_URL}/api/musicas/atual`),
        axios.get(`${API_URL}/api/musicas/fila`),
        axios.get(`${API_URL}/api/config`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const totalMusicas = fila.data.length + (musicaAtual.data ? 1 : 0);
      const musicasTocadas = fila.data.filter(m => m.status === 'tocada').length;

      setStatsOverview({
        totalMusicas,
        musicasTocadas,
        tempoTotal: '2h 30m', // Pode ser calculado depois
        configuracoes: configsData.data.length,
      });
    } catch (err) {
      console.error('Erro ao carregar overview:', err);
    }
  };

  const carregarEstadoPlayer = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/player/estado`);
      setEstadoPlayer(response.data);
    } catch (err) {
      console.error('Erro ao carregar estado do player:', err);
    }
  };

  const carregarFilaPlayer = async () => {
    try {
      const [musicaAtual, fila] = await Promise.all([
        axios.get(`${API_URL}/api/musicas/atual`),
        axios.get(`${API_URL}/api/musicas/fila`)
      ]);
      setMusicaAtualPlayer(musicaAtual.data);
      setFilaPlayer(fila.data.filter(m => m.status !== 'tocando'));
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
    }
  };

  const handlePlayerPlay = async () => {
    try {
      await axios.post(`${API_URL}/api/player/play`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Player tocando!');
      setTimeout(() => setSuccess(''), 2000);
      carregarEstadoPlayer();
    } catch (err) {
      setError('Erro ao tocar');
    }
  };

  const handlePlayerPause = async () => {
    try {
      await axios.post(`${API_URL}/api/player/pause`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Player pausado!');
      setTimeout(() => setSuccess(''), 2000);
      carregarEstadoPlayer();
    } catch (err) {
      setError('Erro ao pausar');
    }
  };

  const handlePlayerSkip = async () => {
    try {
      await axios.post(`${API_URL}/api/player/skip`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Música pulada!');
      setTimeout(() => setSuccess(''), 2000);
      carregarFilaPlayer();
    } catch (err) {
      setError('Erro ao pular música');
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfigs(response.data);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar configurações');
      setLoading(false);
    }
  };

  const atualizarConfig = async (chave, valor) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(
        `${API_URL}/api/config/${chave}`,
        { valor },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfigs(
        configs.map((c) => (c.chave === chave ? { ...c, valor: String(valor) } : c))
      );

      setSuccess('Configuração atualizada!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (senhaNova !== senhaConfirm) {
      setError('As senhas não coincidem');
      return;
    }

    if (senhaNova.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setSaving(true);

    try {
      await axios.post(
        `${API_URL}/api/auth/alterar-senha`,
        { senhaAtual, senhaNova },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Senha alterada com sucesso!');
      setSenhaAtual('');
      setSenhaNova('');
      setSenhaConfirm('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const handleAtualizarSugestoes = async () => {
    setAtualizandoSugestoes(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/api/sugestoes/atualizar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Sugestões atualizadas com sucesso! ${response.data.adicionadas} músicas adicionadas.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao atualizar sugestões');
    } finally {
      setAtualizandoSugestoes(false);
    }
  };

  // Funções de Moderação
  const carregarPalavras = async () => {
    setLoadingPalavras(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria) params.append('categoria', filtroCategoria);
      if (filtroSeveridade) params.append('severidade', filtroSeveridade);

      const response = await axios.get(`${API_URL}/api/admin/moderacao/palavras?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPalavras(response.data);
    } catch (err) {
      setError('Erro ao carregar palavras proibidas');
    } finally {
      setLoadingPalavras(false);
    }
  };

  const handleSalvarPalavra = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (palavraEditando) {
        await axios.put(`${API_URL}/api/admin/moderacao/palavras/${palavraEditando.id}`, novaPalavra, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Palavra atualizada com sucesso!');
      } else {
        await axios.post(`${API_URL}/api/admin/moderacao/palavras`, novaPalavra, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Palavra adicionada com sucesso!');
      }

      setNovaPalavra({ palavra: '', categoria: 'AMBOS', severidade: 'MEDIA' });
      setPalavraEditando(null);
      setMostrarFormulario(false);
      carregarPalavras();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar palavra');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletarPalavra = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta palavra?')) return;

    try {
      await axios.delete(`${API_URL}/api/admin/moderacao/palavras/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Palavra deletada com sucesso!');
      carregarPalavras();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao deletar palavra');
    }
  };

  const handleTogglePalavra = async (id) => {
    try {
      await axios.post(`${API_URL}/api/admin/moderacao/palavras/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      carregarPalavras();
    } catch (err) {
      setError('Erro ao alterar status da palavra');
    }
  };

  const handleTestarTexto = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/admin/moderacao/testar`,
        { texto: textoTeste, categoria: 'AMBOS' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResultadoTeste(response.data);
    } catch (err) {
      setError('Erro ao testar texto');
    } finally {
      setSaving(false);
    }
  };

  const renderCampoConfig = (config) => {
    const handleChange = (newValue) => {
      atualizarConfig(config.chave, newValue);
    };

    switch (config.tipo) {
      case 'boolean':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.valor === 'true'}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:ring-4 peer-focus:ring-neon-cyan/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-neon-cyan peer-checked:to-neon-purple"></div>
          </label>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={config.valor}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            className="w-32"
          />
        );

      case 'password':
        return (
          <Input
            type="password"
            value={config.valor}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            placeholder="••••••••"
            className="flex-1"
          />
        );

      default: // text
        return (
          <Input
            type="text"
            value={config.valor}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            className="flex-1"
          />
        );
    }
  };

  // Render functions para cada aba
  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Dashboard Overview</h2>
        <p className="text-gray-500 dark:text-gray-400">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Músicas na Fila"
          value={statsOverview.totalMusicas}
          icon={Music}
          trend={5}
          color="cyan"
        />
        <StatsCard
          title="Músicas Tocadas"
          value={statsOverview.musicasTocadas}
          icon={Play}
          trend={12}
          color="purple"
        />
        <StatsCard
          title="Tempo Total"
          value={statsOverview.tempoTotal}
          icon={TrendingUp}
          color="pink"
        />
        <StatsCard
          title="Configurações"
          value={statsOverview.configuracoes}
          icon={Shield}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <Card variant="glass">
        <h3 className="text-xl font-bold text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="primary"
            icon={Play}
            onClick={() => setAbaAtiva('player')}
            className="w-full"
          >
            Controlar Player
          </Button>
          <Button
            variant="secondary"
            icon={Shield}
            onClick={() => setAbaAtiva('moderacao')}
            className="w-full"
          >
            Moderação
          </Button>
          <Button
            variant="neon"
            icon={RefreshCw}
            onClick={handleAtualizarSugestoes}
            loading={atualizandoSugestoes}
            className="w-full"
          >
            Atualizar Sugestões
          </Button>
        </div>
      </Card>

      {/* Player Status */}
      {musicaAtualPlayer && (
        <Card variant="glass">
          <h3 className="text-xl font-bold text-white mb-4">Tocando Agora</h3>
          <div className="flex items-center gap-4">
            <img
              src={musicaAtualPlayer.musicaThumbnail}
              alt=""
              className="w-24 h-24 rounded-lg object-cover neon-border"
            />
            <div className="flex-1">
              <p className="text-lg font-semibold text-white">{musicaAtualPlayer.musicaTitulo}</p>
              <p className="text-sm text-gray-400">Pedido por: {musicaAtualPlayer.nomeCliente || 'Anônimo'}</p>
              <Badge
                variant={estadoPlayer.status === 'playing' ? 'success' : 'warning'}
                className="mt-2"
              >
                {estadoPlayer.status === 'playing' ? 'Tocando' : estadoPlayer.status === 'paused' ? 'Pausado' : 'Parado'}
              </Badge>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );

  const renderConfiguracoes = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Configurações do Sistema</h2>
        <p className="text-gray-500 dark:text-gray-400">Gerencie as configurações do aplicativo</p>
      </div>

      <Card variant="glass">
        <div className="space-y-4">
          {configs.map((config) => (
            <motion.div
              key={config.chave}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 glass rounded-lg hover:bg-neon-cyan/5 transition gap-4"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {config.chave.replace(/_/g, ' ')}
                </h3>
                {config.descricao && (
                  <p className="text-sm text-gray-400 mt-1">{config.descricao}</p>
                )}
              </div>
              <div className="sm:ml-4">{renderCampoConfig(config)}</div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );

  const renderPlayer = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Controle do Player</h2>
        <p className="text-gray-500 dark:text-gray-400">Gerencie o player da TV</p>
      </div>

      {/* Controles */}
      <Card variant="glass">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              icon={Play}
              onClick={handlePlayerPlay}
              size="lg"
            >
              Play
            </Button>
            <Button
              variant="secondary"
              icon={Pause}
              onClick={handlePlayerPause}
              size="lg"
            >
              Pause
            </Button>
            <Button
              variant="danger"
              icon={SkipForward}
              onClick={handlePlayerSkip}
              size="lg"
            >
              Skip
            </Button>
          </div>

          <div className="w-full p-4 glass rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Estado do Player</p>
            <Badge
              variant={estadoPlayer.status === 'playing' ? 'success' : estadoPlayer.status === 'paused' ? 'warning' : 'default'}
              size="lg"
            >
              {estadoPlayer.status === 'playing' ? 'Tocando' : estadoPlayer.status === 'paused' ? 'Pausado' : 'Parado'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Música Atual */}
      {musicaAtualPlayer && (
        <Card variant="glass">
          <h3 className="text-xl font-bold gradient-text mb-4">Música Atual</h3>
          <div className="flex items-center gap-4">
            <img
              src={musicaAtualPlayer.musicaThumbnail}
              alt=""
              className="w-24 h-24 rounded-lg object-cover neon-border"
            />
            <div className="flex-1">
              <p className="text-lg font-semibold text-white">{musicaAtualPlayer.musicaTitulo}</p>
              <p className="text-sm text-gray-400">Pedido por: {musicaAtualPlayer.nomeCliente || 'Anônimo'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Fila */}
      <Card variant="glass">
        <h3 className="text-xl font-bold gradient-text mb-4">
          Fila de Músicas ({filaPlayer.length})
        </h3>
        {filaPlayer.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-16 h-16 mx-auto text-gray-600 mb-2" />
            <p className="text-gray-500">Nenhuma música na fila</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filaPlayer.map((musica, index) => (
                <QueueItem
                  key={musica.id}
                  musica={{
                    ...musica,
                    titulo: musica.musicaTitulo,
                    thumbnail: musica.musicaThumbnail,
                    nomeCliente: musica.nomeCliente,
                  }}
                  posicao={index + 1}
                  isPlaying={false}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  );

  const renderModeracao = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Moderação de Conteúdo</h2>
        <p className="text-gray-500 dark:text-gray-400">Gerencie palavras proibidas e teste conteúdo</p>
      </div>

      {/* Filtros e Adicionar */}
      <Card variant="glass">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-white">Palavras Proibidas</h3>
          <Button
            variant={mostrarFormulario ? 'danger' : 'primary'}
            icon={mostrarFormulario ? X : Plus}
            onClick={() => {
              setNovaPalavra({ palavra: '', categoria: 'AMBOS', severidade: 'MEDIA' });
              setPalavraEditando(null);
              setMostrarFormulario(!mostrarFormulario);
            }}
          >
            {mostrarFormulario ? 'Cancelar' : 'Nova Palavra'}
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => { setFiltroCategoria(e.target.value); carregarPalavras(); }}
              className="w-full px-4 py-3 glass rounded-lg border border-dark-border focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 outline-none text-white"
            >
              <option value="">Todas</option>
              <option value="NOME_CLIENTE">Nome do Cliente</option>
              <option value="TITULO_MUSICA">Título da Música</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Severidade</label>
            <select
              value={filtroSeveridade}
              onChange={(e) => { setFiltroSeveridade(e.target.value); carregarPalavras(); }}
              className="w-full px-4 py-3 glass rounded-lg border border-dark-border focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 outline-none text-white"
            >
              <option value="">Todas</option>
              <option value="LEVE">Leve</option>
              <option value="MEDIA">Média</option>
              <option value="SEVERA">Severa</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              icon={Filter}
              onClick={() => { setFiltroCategoria(''); setFiltroSeveridade(''); carregarPalavras(); }}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Formulário de Adicionar/Editar */}
        <AnimatePresence>
          {mostrarFormulario && (
            <motion.form
              onSubmit={handleSalvarPalavra}
              className="p-6 neon-border bg-neon-cyan/5 rounded-lg mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="text-lg font-bold gradient-text mb-4">
                {palavraEditando ? 'Editar Palavra' : 'Adicionar Nova Palavra'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <Input
                  label="Palavra"
                  type="text"
                  value={novaPalavra.palavra}
                  onChange={(e) => setNovaPalavra({ ...novaPalavra, palavra: e.target.value })}
                  required
                  disabled={saving}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
                  <select
                    value={novaPalavra.categoria}
                    onChange={(e) => setNovaPalavra({ ...novaPalavra, categoria: e.target.value })}
                    className="w-full px-4 py-3 glass rounded-lg border border-dark-border focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 outline-none text-white"
                    required
                    disabled={saving}
                  >
                    <option value="NOME_CLIENTE">Nome do Cliente</option>
                    <option value="TITULO_MUSICA">Título da Música</option>
                    <option value="AMBOS">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Severidade</label>
                  <select
                    value={novaPalavra.severidade}
                    onChange={(e) => setNovaPalavra({ ...novaPalavra, severidade: e.target.value })}
                    className="w-full px-4 py-3 glass rounded-lg border border-dark-border focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 outline-none text-white"
                    required
                    disabled={saving}
                  >
                    <option value="LEVE">Leve</option>
                    <option value="MEDIA">Média</option>
                    <option value="SEVERA">Severa</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  className="flex-1"
                >
                  {palavraEditando ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setMostrarFormulario(false); setPalavraEditando(null); }}
                >
                  Cancelar
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Lista de Palavras */}
        {loadingPalavras ? (
          <div className="text-center py-8 text-gray-400">Carregando...</div>
        ) : palavras.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 mx-auto text-gray-600 mb-2" />
            <p className="text-gray-500">Nenhuma palavra encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Palavra</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Severidade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {palavras.map((palavra) => (
                  <motion.tr
                    key={palavra.id}
                    className="hover:bg-neon-cyan/5 transition"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="px-4 py-3 font-medium text-white">{palavra.palavra}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="info" size="sm">
                        {palavra.categoria === 'NOME_CLIENTE' ? 'Nome' : palavra.categoria === 'TITULO_MUSICA' ? 'Música' : 'Ambos'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          palavra.severidade === 'SEVERA' ? 'danger' :
                          palavra.severidade === 'MEDIA' ? 'warning' :
                          'success'
                        }
                        size="sm"
                      >
                        {palavra.severidade}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePalavra(palavra.id)}
                        className="group"
                      >
                        <Badge
                          variant={palavra.ativo ? 'success' : 'default'}
                          size="sm"
                          className="group-hover:scale-110 transition"
                        >
                          {palavra.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => {
                            setPalavraEditando(palavra);
                            setNovaPalavra({ palavra: palavra.palavra, categoria: palavra.categoria, severidade: palavra.severidade });
                            setMostrarFormulario(true);
                          }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeletarPalavra(palavra.id)}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Card de Teste de Texto */}
      <Card variant="glass">
        <h3 className="text-xl font-bold gradient-text mb-4">Testar Moderação</h3>
        <form onSubmit={handleTestarTexto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Digite um texto para testar</label>
            <textarea
              value={textoTeste}
              onChange={(e) => setTextoTeste(e.target.value)}
              className="w-full px-4 py-3 glass rounded-lg border border-dark-border focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 outline-none text-white resize-none"
              rows="3"
              placeholder="Ex: João Silva quer ouvir música legal"
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
          >
            Testar Texto
          </Button>
        </form>

        <AnimatePresence>
          {resultadoTeste && (
            <motion.div
              className={`mt-4 p-4 rounded-lg border-2 ${
                resultadoTeste.bloqueado ? 'bg-red-500/10 border-red-500/50' : 'bg-green-500/10 border-green-500/50'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center gap-3 mb-2">
                {resultadoTeste.bloqueado ? (
                  <XCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                )}
                <h4 className={`text-xl font-bold ${resultadoTeste.bloqueado ? 'text-red-500' : 'text-green-500'}`}>
                  {resultadoTeste.bloqueado ? 'BLOQUEADO' : 'APROVADO'}
                </h4>
              </div>
              {resultadoTeste.encontradas.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-400 mb-2">Palavras encontradas:</p>
                  <div className="flex flex-wrap gap-2">
                    {resultadoTeste.encontradas.map((p, i) => (
                      <Badge key={i} variant="danger">
                        {p.palavra} ({p.severidade})
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Severidade máxima: <strong className="text-white">{resultadoTeste.severidadeMaxima}</strong>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );

  const renderSugestoes = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Sugestões Trending</h2>
        <p className="text-gray-500 dark:text-gray-400">Atualize as sugestões de músicas populares</p>
      </div>

      <Card variant="glass">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-neon-cyan mb-4" />
          <h3 className="text-xl font-bold text-white mb-4">Atualizar Sugestões de Músicas</h3>
          <p className="text-gray-400 mb-6">
            Busca as músicas mais populares do YouTube para cada categoria e atualiza as sugestões.
          </p>

          <Button
            onClick={handleAtualizarSugestoes}
            variant="neon"
            size="lg"
            icon={RefreshCw}
            loading={atualizandoSugestoes}
            className="w-full sm:w-auto"
          >
            {atualizandoSugestoes ? 'Atualizando...' : 'Atualizar Sugestões Agora'}
          </Button>

          <div className="mt-6 p-4 glass rounded-lg">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">Última atualização:</span> Em breve
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const renderSenha = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Alterar Senha</h2>
        <p className="text-gray-500 dark:text-gray-400">Atualize sua senha de acesso</p>
      </div>

      <Card variant="glass" className="max-w-md mx-auto">
        <form onSubmit={handleAlterarSenha} className="space-y-4">
          <Input
            label="Senha Atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            required
            disabled={saving}
          />

          <Input
            label="Nova Senha"
            type="password"
            value={senhaNova}
            onChange={(e) => setSenhaNova(e.target.value)}
            required
            disabled={saving}
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            value={senhaConfirm}
            onChange={(e) => setSenhaConfirm(e.target.value)}
            required
            disabled={saving}
            error={senhaNova !== senhaConfirm && senhaConfirm.length > 0 ? 'As senhas não coincidem' : ''}
          />

          <Button
            type="submit"
            variant="primary"
            loading={saving}
            className="w-full"
          >
            Alterar Senha
          </Button>
        </form>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-xl text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      <AdminSidebar
        activeTab={abaAtiva}
        onTabChange={setAbaAtiva}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="p-6 lg:p-8">
          {/* Mensagens */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-6 p-4 glass rounded-lg border-2 border-red-500/50 bg-red-500/10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-500">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="mb-6 p-4 glass rounded-lg border-2 border-green-500/50 bg-green-500/10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-green-500">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conteúdo das Abas */}
          <AnimatePresence mode="wait">
            {abaAtiva === 'overview' && renderOverview()}
            {abaAtiva === 'configuracoes' && renderConfiguracoes()}
            {abaAtiva === 'player' && renderPlayer()}
            {abaAtiva === 'moderacao' && renderModeracao()}
            {abaAtiva === 'sugestoes' && renderSugestoes()}
            {abaAtiva === 'senha' && renderSenha()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
