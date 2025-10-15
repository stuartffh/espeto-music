import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = 'http://localhost:3000/api';

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

  useEffect(() => {
    carregarConfiguracoes();
    carregarEstadoPlayer();
    carregarFilaPlayer();
  }, []);

  const carregarEstadoPlayer = async () => {
    try {
      const response = await axios.get(`${API_URL}/player/estado`);
      setEstadoPlayer(response.data);
    } catch (err) {
      console.error('Erro ao carregar estado do player:', err);
    }
  };

  const carregarFilaPlayer = async () => {
    try {
      const [musicaAtual, fila] = await Promise.all([
        axios.get(`${API_URL}/musicas/atual`),
        axios.get(`${API_URL}/musicas/fila`)
      ]);
      setMusicaAtualPlayer(musicaAtual.data);
      setFilaPlayer(fila.data.filter(m => m.status !== 'tocando'));
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
    }
  };

  const handlePlayerPlay = async () => {
    try {
      await axios.post(`${API_URL}/player/play`, {}, {
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
      await axios.post(`${API_URL}/player/pause`, {}, {
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
      await axios.post(`${API_URL}/player/skip`, {}, {
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
      const response = await axios.get(`${API_URL}/config`, {
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
        `${API_URL}/config/${chave}`,
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
        `${API_URL}/auth/alterar-senha`,
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
        `${API_URL}/sugestoes/atualizar`,
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
      </div>
    </div>
  );
}

export default AdminDashboard;
