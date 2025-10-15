import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function AdminDashboard() {
  const { admin, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('configuracoes');
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

  useEffect(() => {
    carregarConfiguracoes();
    carregarEstadoPlayer();
    carregarFilaPlayer();
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={config.valor}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-32"
          />
        );

      case 'password':
        return (
          <input
            type="password"
            value={config.valor}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            placeholder="••••••••"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none flex-1"
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={config.valor}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none flex-1"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Espeto Music - Admin</h1>
              <p className="text-purple-100 text-sm">Bem-vindo, {admin?.nome}</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition"
              >
                Ver Site
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mensagens */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setAbaAtiva('configuracoes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'configuracoes'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configurações do Sistema
            </button>
            <button
              onClick={() => setAbaAtiva('senha')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'senha'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alterar Senha
            </button>
            <button
              onClick={() => setAbaAtiva('sugestoes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'sugestoes'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sugestões Trending
            </button>
            <button
              onClick={() => { setAbaAtiva('player'); carregarFilaPlayer(); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'player'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Controle do Player
            </button>
            <button
              onClick={() => { setAbaAtiva('moderacao'); carregarPalavras(); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'moderacao'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Moderação de Conteúdo
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {abaAtiva === 'configuracoes' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Configurações do Sistema
            </h2>

            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.chave}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {config.chave.replace(/_/g, ' ')}
                    </h3>
                    {config.descricao && (
                      <p className="text-sm text-gray-500 mt-1">{config.descricao}</p>
                    )}
                  </div>
                  <div className="ml-4">{renderCampoConfig(config)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'senha' && (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Alterar Senha</h2>

            <form onSubmit={handleAlterarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={senhaNova}
                  onChange={(e) => setSenhaNova(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                  minLength={6}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={senhaConfirm}
                  onChange={(e) => setSenhaConfirm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                  minLength={6}
                  disabled={saving}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {saving ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </form>
          </div>
        )}

        {abaAtiva === 'sugestoes' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Atualizar Sugestões de Músicas
            </h2>

            <p className="text-gray-600 mb-6">
              Busca as músicas mais populares do YouTube para cada categoria e atualiza as sugestões.
            </p>

            <button
              onClick={handleAtualizarSugestoes}
              disabled={atualizandoSugestoes}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-purple-300 disabled:to-indigo-300 text-white font-semibold py-4 px-6 rounded-lg transition text-lg shadow-md"
            >
              {atualizandoSugestoes ? 'Atualizando...' : '🔄 Atualizar Sugestões Agora'}
            </button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Última atualização:</span> Em breve
              </p>
            </div>
          </div>
        )}

        {abaAtiva === 'player' && (
          <div className="space-y-6">
            {/* Controles do Player */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Controle do Player da TV</h2>

              <div className="flex gap-4 justify-center mb-6">
                <button
                  onClick={handlePlayerPlay}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  ▶️ Play
                </button>
                <button
                  onClick={handlePlayerPause}
                  className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition"
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={handlePlayerSkip}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                >
                  ⏭️ Pular Música
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Estado do Player:</span> {estadoPlayer.status === 'playing' ? '▶️ Tocando' : estadoPlayer.status === 'paused' ? '⏸️ Pausado' : '⏹️ Parado'}
                </p>
              </div>
            </div>

            {/* Música Atual */}
            {musicaAtualPlayer && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🎵 Música Atual</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={musicaAtualPlayer.musicaThumbnail}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover shadow-md"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{musicaAtualPlayer.musicaTitulo}</p>
                    <p className="text-sm text-gray-600">Pedido por: {musicaAtualPlayer.nomeCliente || 'Anônimo'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fila */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Fila de Músicas ({filaPlayer.length})</h3>
              {filaPlayer.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma música na fila</p>
              ) : (
                <div className="space-y-3">
                  {filaPlayer.map((musica, index) => (
                    <div key={musica.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <span className="font-bold text-purple-600 text-lg">#{index + 1}</span>
                      <img
                        src={musica.musicaThumbnail}
                        alt=""
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{musica.musicaTitulo}</p>
                        <p className="text-xs text-gray-600">Por: {musica.nomeCliente || 'Anônimo'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'moderacao' && (
          <div className="space-y-6">
            {/* Card de Filtros e Adicionar */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Palavras Proibidas</h2>
                <button
                  onClick={() => {
                    setNovaPalavra({ palavra: '', categoria: 'AMBOS', severidade: 'MEDIA' });
                    setPalavraEditando(null);
                    setMostrarFormulario(!mostrarFormulario);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                >
                  {mostrarFormulario ? '✕ Cancelar' : '+ Nova Palavra'}
                </button>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => { setFiltroCategoria(e.target.value); carregarPalavras(); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Todas</option>
                    <option value="NOME_CLIENTE">Nome do Cliente</option>
                    <option value="TITULO_MUSICA">Título da Música</option>
                    <option value="AMBOS">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severidade</label>
                  <select
                    value={filtroSeveridade}
                    onChange={(e) => { setFiltroSeveridade(e.target.value); carregarPalavras(); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Todas</option>
                    <option value="LEVE">Leve</option>
                    <option value="MEDIA">Média</option>
                    <option value="SEVERA">Severa</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setFiltroCategoria(''); setFiltroSeveridade(''); carregarPalavras(); }}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>

              {/* Formulário de Adicionar/Editar */}
              {mostrarFormulario && (
                <form onSubmit={handleSalvarPalavra} className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 mb-6">
                  <h3 className="font-bold text-lg text-purple-900 mb-4">
                    {palavraEditando ? 'Editar Palavra' : 'Adicionar Nova Palavra'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Palavra *</label>
                      <input
                        type="text"
                        value={novaPalavra.palavra}
                        onChange={(e) => setNovaPalavra({ ...novaPalavra, palavra: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                      <select
                        value={novaPalavra.categoria}
                        onChange={(e) => setNovaPalavra({ ...novaPalavra, categoria: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        required
                        disabled={saving}
                      >
                        <option value="NOME_CLIENTE">Nome do Cliente</option>
                        <option value="TITULO_MUSICA">Título da Música</option>
                        <option value="AMBOS">Ambos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Severidade *</label>
                      <select
                        value={novaPalavra.severidade}
                        onChange={(e) => setNovaPalavra({ ...novaPalavra, severidade: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        required
                        disabled={saving}
                      >
                        <option value="LEVE">Leve</option>
                        <option value="MEDIA">Média</option>
                        <option value="SEVERA">Severa</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-lg transition"
                    >
                      {saving ? 'Salvando...' : (palavraEditando ? 'Atualizar' : 'Adicionar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMostrarFormulario(false); setPalavraEditando(null); }}
                      className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Palavras */}
              {loadingPalavras ? (
                <div className="text-center py-8 text-gray-600">Carregando...</div>
              ) : palavras.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma palavra encontrada</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Palavra</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Categoria</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Severidade</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {palavras.map((palavra) => (
                        <tr key={palavra.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{palavra.palavra}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {palavra.categoria === 'NOME_CLIENTE' ? 'Nome' : palavra.categoria === 'TITULO_MUSICA' ? 'Música' : 'Ambos'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              palavra.severidade === 'SEVERA' ? 'bg-red-100 text-red-800' :
                              palavra.severidade === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {palavra.severidade}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleTogglePalavra(palavra.id)}
                              className={`px-3 py-1 text-xs rounded-full font-semibold ${
                                palavra.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {palavra.ativo ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setPalavraEditando(palavra);
                                  setNovaPalavra({ palavra: palavra.palavra, categoria: palavra.categoria, severidade: palavra.severidade });
                                  setMostrarFormulario(true);
                                }}
                                className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeletarPalavra(palavra.id)}
                                className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                              >
                                Deletar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Card de Teste de Texto */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Testar Moderação</h3>
              <form onSubmit={handleTestarTexto} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Digite um texto para testar</label>
                  <textarea
                    value={textoTeste}
                    onChange={(e) => setTextoTeste(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    rows="3"
                    placeholder="Ex: João Silva quer ouvir música legal"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-lg transition"
                >
                  {saving ? 'Testando...' : 'Testar Texto'}
                </button>
              </form>

              {resultadoTeste && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  resultadoTeste.bloqueado ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{resultadoTeste.bloqueado ? '🚫' : '✅'}</span>
                    <h4 className={`font-bold ${resultadoTeste.bloqueado ? 'text-red-900' : 'text-green-900'}`}>
                      {resultadoTeste.bloqueado ? 'BLOQUEADO' : 'APROVADO'}
                    </h4>
                  </div>
                  {resultadoTeste.encontradas.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Palavras encontradas:</p>
                      <div className="flex flex-wrap gap-2">
                        {resultadoTeste.encontradas.map((p, i) => (
                          <span key={i} className="px-3 py-1 bg-red-200 text-red-900 text-sm rounded-full">
                            {p.palavra} ({p.severidade})
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Severidade máxima: <strong>{resultadoTeste.severidadeMaxima}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
