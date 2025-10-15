import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const THEME_DEFAULTS = {
  THEME_PRIMARY: '#7c3aed',
  THEME_SECONDARY: '#f472b6',
  THEME_ACCENT: '#facc15',
  THEME_BACKGROUND: '#0f172a',
  THEME_SURFACE: '#ffffff',
  THEME_TEXT: '#f8fafc',
};

const THEME_LABELS = {
  THEME_PRIMARY: 'Cor Primária',
  THEME_SECONDARY: 'Cor Secundária',
  THEME_ACCENT: 'Cor de Destaque',
  THEME_BACKGROUND: 'Cor de Fundo',
  THEME_SURFACE: 'Cor de Superfície',
  THEME_TEXT: 'Cor de Texto',
};

const APPEARANCE_CONFIG_KEYS = [...Object.keys(THEME_DEFAULTS), 'TV_IDLE_VIDEO_URL'];

const DEFAULT_CONFIGS = [
  {
    chave: 'THEME_PRIMARY',
    valor: THEME_DEFAULTS.THEME_PRIMARY,
    tipo: 'color',
    descricao: 'Cor primária utilizada nos botões e destaques do cliente.',
  },
  {
    chave: 'THEME_SECONDARY',
    valor: THEME_DEFAULTS.THEME_SECONDARY,
    tipo: 'color',
    descricao: 'Cor secundária utilizada em gradientes e detalhes.',
  },
  {
    chave: 'THEME_ACCENT',
    valor: THEME_DEFAULTS.THEME_ACCENT,
    tipo: 'color',
    descricao: 'Cor de destaque aplicada em alertas e badges.',
  },
  {
    chave: 'THEME_BACKGROUND',
    valor: THEME_DEFAULTS.THEME_BACKGROUND,
    tipo: 'color',
    descricao: 'Cor de fundo padrão para áreas principais.',
  },
  {
    chave: 'THEME_SURFACE',
    valor: THEME_DEFAULTS.THEME_SURFACE,
    tipo: 'color',
    descricao: 'Cor de superfície dos cartões e blocos.',
  },
  {
    chave: 'THEME_TEXT',
    valor: THEME_DEFAULTS.THEME_TEXT,
    tipo: 'color',
    descricao: 'Cor principal dos textos sobre o gradiente.',
  },
  {
    chave: 'TV_IDLE_VIDEO_URL',
    valor: '',
    tipo: 'text',
    descricao: 'URL do vídeo exibido na TV quando não há músicas tocando.',
  },
];

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
  const [idleVideoInfo, setIdleVideoInfo] = useState({ url: '', relativePath: '', atualizadoEm: null });
  const [uploadingIdleVideo, setUploadingIdleVideo] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
    carregarEstadoPlayer();
    carregarFilaPlayer();
    carregarIdleVideoInfo();
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

  const garantirConfiguracoesPadrao = async (lista) => {
    const existentes = new Map(lista.map((item) => [item.chave, item]));
    const criados = [];

    for (const configPadrao of DEFAULT_CONFIGS) {
      if (!existentes.has(configPadrao.chave)) {
        try {
          const resposta = await axios.post(
            `${API_URL}/api/config`,
            configPadrao,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          criados.push(resposta.data);
        } catch (erroCriacao) {
          console.error(`Erro ao criar configuração padrão ${configPadrao.chave}:`, erroCriacao);
        }
      }
    }

    return [...lista, ...criados];
  };

  const carregarIdleVideoInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/media/tv-idle-video`);
      setIdleVideoInfo(response.data);
    } catch (err) {
      console.error('Erro ao carregar vídeo ocioso da TV:', err);
    }
  };

  const handleUploadIdleVideo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      setError('Selecione um arquivo de vídeo válido (MP4, WEBM ou MOV).');
      event.target.value = '';
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setError('O vídeo deve ter no máximo 200MB.');
      event.target.value = '';
      return;
    }

    setUploadingIdleVideo(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await axios.post(`${API_URL}/api/media/tv-idle-video`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setIdleVideoInfo(response.data);
      setConfigs((prev) =>
        prev.map((config) =>
          config.chave === 'TV_IDLE_VIDEO_URL'
            ? { ...config, valor: response.data.relativePath }
            : config
        ),
      );
      setSuccess('Vídeo atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao enviar vídeo');
    } finally {
      setUploadingIdleVideo(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoverIdleVideo = async () => {
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${API_URL}/api/media/tv-idle-video`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIdleVideoInfo({ url: '', relativePath: '', atualizadoEm: null });
      setConfigs((prev) =>
        prev.map((config) =>
          config.chave === 'TV_IDLE_VIDEO_URL' ? { ...config, valor: '' } : config
        ),
      );
      setSuccess('Vídeo removido com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao remover vídeo');
    }
  };

  const handleRestaurarCores = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await Promise.all(
        Object.entries(THEME_DEFAULTS).map(([chave, valorPadrao]) =>
          axios.put(
            `${API_URL}/api/config/${chave}`,
            {
              valor: valorPadrao,
              tipo: 'color',
              descricao: THEME_LABELS[chave],
            },
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        ),
      );

      setConfigs((prev) =>
        prev.map((config) =>
          THEME_DEFAULTS[config.chave]
            ? { ...config, valor: THEME_DEFAULTS[config.chave] }
            : config
        ),
      );

      setSuccess('Paleta restaurada para os padrões!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao restaurar paleta padrão');
    } finally {
      setSaving(false);
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
      const listaComPadroes = await garantirConfiguracoesPadrao(response.data);
      listaComPadroes.sort((a, b) => a.chave.localeCompare(b.chave));
      setConfigs(listaComPadroes);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar configurações');
      setLoading(false);
    }
  };

  const atualizarConfig = async (chave, valor, extras = {}) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(
        `${API_URL}/api/config/${chave}`,
        { valor, ...extras },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfigs((prev) =>
        prev.map((c) => (c.chave === chave ? { ...c, valor: String(valor) } : c))
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

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const renderCampoConfig = (config) => {
    const handleChange = (newValue) => {
      atualizarConfig(config.chave, newValue, {
        descricao: config.descricao,
        tipo: config.tipo,
      });
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

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.valor || '#ffffff'}
              onChange={(e) => handleChange(e.target.value)}
              disabled={saving}
              className="w-16 h-10 border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600 font-mono">{config.valor}</span>
          </div>
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

  const configsPorChave = configs.reduce((acc, item) => {
    acc[item.chave] = item;
    return acc;
  }, {});

  const configuracoesGerais = configs.filter(
    (config) => !APPEARANCE_CONFIG_KEYS.includes(config.chave),
  );

  const themeConfigs = Object.keys(THEME_DEFAULTS).map((chave) =>
    configsPorChave[chave] || {
      chave,
      valor: THEME_DEFAULTS[chave],
      tipo: 'color',
      descricao: THEME_LABELS[chave],
    },
  );

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
              onClick={() => setAbaAtiva('aparencia')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'aparencia'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Aparência & TV
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
              {configuracoesGerais.map((config) => (
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

        {abaAtiva === 'aparencia' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Paleta de Cores</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Personalize as cores exibidas no site do cliente, painel da TV e telas públicas.
                  </p>
                </div>
                <button
                  onClick={handleRestaurarCores}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg transition"
                >
                  Restaurar padrão
                </button>
              </div>

              <div className="grid gap-4 mt-6 sm:grid-cols-2 xl:grid-cols-3">
                {themeConfigs.map((config) => (
                  <div
                    key={config.chave}
                    className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{THEME_LABELS[config.chave]}</p>
                        {config.descricao && (
                          <p className="text-xs text-gray-500 mt-1">{config.descricao}</p>
                        )}
                      </div>
                      <div
                        className="w-10 h-10 rounded border border-gray-200 shadow-inner"
                        style={{ background: config.valor || '#ffffff' }}
                      />
                    </div>
                    {renderCampoConfig(configsPorChave[config.chave] || config)}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 overflow-hidden">
                <div
                  className="p-6"
                  style={{
                    background: `linear-gradient(135deg, ${configsPorChave.THEME_PRIMARY?.valor || THEME_DEFAULTS.THEME_PRIMARY}, ${configsPorChave.THEME_SECONDARY?.valor || THEME_DEFAULTS.THEME_SECONDARY})`,
                    color: configsPorChave.THEME_TEXT?.valor || THEME_DEFAULTS.THEME_TEXT,
                  }}
                >
                  <p className="text-sm uppercase tracking-wider opacity-80">Pré-visualização</p>
                  <h3 className="text-2xl font-bold mt-2">Espeto Music</h3>
                  <p className="text-sm opacity-90">
                    Botões e destaques utilizarão esta combinação de cores.
                  </p>
                </div>
                <div className="p-4 bg-white flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="px-3 py-1 rounded-full border border-gray-200" style={{ background: configsPorChave.THEME_SURFACE?.valor || THEME_DEFAULTS.THEME_SURFACE }}>
                    Superfície
                  </span>
                  <span className="px-3 py-1 rounded-full border border-gray-200" style={{ background: configsPorChave.THEME_ACCENT?.valor || THEME_DEFAULTS.THEME_ACCENT }}>
                    Destaque
                  </span>
                  <span className="px-3 py-1 rounded-full border border-gray-200" style={{ background: configsPorChave.THEME_BACKGROUND?.valor || THEME_DEFAULTS.THEME_BACKGROUND, color: configsPorChave.THEME_TEXT?.valor || THEME_DEFAULTS.THEME_TEXT }}>
                    Fundo
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vídeo de Espera na TV</h2>
              <p className="text-sm text-gray-600 mb-4">
                Quando não houver músicas tocando, a TV exibirá este vídeo em loop. Suporta arquivos MP4, WEBM ou MOV de até 200MB.
              </p>

              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="flex items-center justify-center px-4 py-3 bg-purple-50 border border-dashed border-purple-300 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 transition w-full md:w-auto">
                  <span>{uploadingIdleVideo ? 'Enviando vídeo...' : 'Selecionar vídeo'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleUploadIdleVideo}
                    disabled={uploadingIdleVideo}
                  />
                </label>
                {idleVideoInfo.url && (
                  <button
                    onClick={handleRemoverIdleVideo}
                    className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                    disabled={uploadingIdleVideo}
                  >
                    Remover vídeo
                  </button>
                )}
              </div>

              {idleVideoInfo.url ? (
                <div className="mt-6">
                  <video
                    src={idleVideoInfo.url}
                    controls
                    loop
                    muted
                    className="w-full max-h-72 rounded-lg border border-gray-200 shadow"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Última atualização:{' '}
                    {idleVideoInfo.atualizadoEm
                      ? new Date(idleVideoInfo.atualizadoEm).toLocaleString()
                      : '—'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-6">
                  Nenhum vídeo configurado. A TV exibirá a animação padrão enquanto aguarda pedidos.
                </p>
              )}
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
