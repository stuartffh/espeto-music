import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import {
  FaCalendar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPlus,
  FaEdit,
  FaTrash,
  FaQrcode,
  FaDownload,
  FaEye,
  FaUndo,
  FaFilter,
  FaChartLine,
  FaDollarSign,
  FaMusic,
} from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Locacoes({ embedded = false }) {
  const navigate = useNavigate();
  const [locacoes, setLocacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarQRCode, setMostrarQRCode] = useState(null);
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(null);
  const [locacaoEditando, setLocacaoEditando] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    nomeCliente: '',
    nomeEvento: '',
    emailContato: '',
    telefoneContato: '',
    dataInicio: '',
    dataFim: '',
    nomeEstabelecimento: '',
    logoUrl: '',
    corTema: '#FF6B6B',
    mensagemBoasVindas: '',
    backgroundImageUrl: '',
    videoDescansoUrl: '',
    observacoes: '',
  });

  useEffect(() => {
    carregarLocacoes();
  }, [filtroStatus]);

  // Helper para tratar erros de autenticação
  const handleAuthError = (error) => {
    if (error.response && error.response.status === 401) {
      if (!embedded) {
        // Só redireciona se NÃO estiver embedded no Dashboard
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
      return true;
    }
    return false;
  };

  const carregarLocacoes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        if (!embedded) {
          // Só redireciona se NÃO estiver embedded no Dashboard
          navigate('/admin/login');
        }
        return;
      }

      let url = `${API_URL}/api/admin/locacoes`;
      if (filtroStatus !== 'todas') {
        url += `?status=${filtroStatus}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLocacoes(response.data.locacoes || []);
    } catch (error) {
      console.error('Erro ao carregar locações:', error);
      if (!handleAuthError(error)) {
        alert('Erro ao carregar locações');
      }
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (locacao = null) => {
    if (locacao) {
      setLocacaoEditando(locacao);
      setFormData({
        slug: locacao.slug || '',
        nomeCliente: locacao.nomeCliente || '',
        nomeEvento: locacao.nomeEvento || '',
        emailContato: locacao.emailContato || '',
        telefoneContato: locacao.telefoneContato || '',
        dataInicio: locacao.dataInicio ? new Date(locacao.dataInicio).toISOString().slice(0, 16) : '',
        dataFim: locacao.dataFim ? new Date(locacao.dataFim).toISOString().slice(0, 16) : '',
        nomeEstabelecimento: locacao.nomeEstabelecimento || '',
        logoUrl: locacao.logoUrl || '',
        corTema: locacao.corTema || '#FF6B6B',
        mensagemBoasVindas: locacao.mensagemBoasVindas || '',
        backgroundImageUrl: locacao.backgroundImageUrl || '',
        videoDescansoUrl: locacao.videoDescansoUrl || '',
        observacoes: locacao.observacoes || '',
      });
    } else {
      setLocacaoEditando(null);
      setFormData({
        slug: '',
        nomeCliente: '',
        nomeEvento: '',
        emailContato: '',
        telefoneContato: '',
        dataInicio: '',
        dataFim: '',
        nomeEstabelecimento: '',
        logoUrl: '',
        corTema: '#FF6B6B',
        mensagemBoasVindas: '',
        backgroundImageUrl: '',
    videoDescansoUrl: '',
        observacoes: '',
      });
    }
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      // Converter datas para ISO
      const dados = {
        ...formData,
        dataInicio: new Date(formData.dataInicio).toISOString(),
        dataFim: new Date(formData.dataFim).toISOString(),
      };

      if (locacaoEditando) {
        await axios.put(
          `${API_URL}/api/admin/locacoes/${locacaoEditando.id}`,
          dados,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Locação atualizada com sucesso!');
      } else {
        await axios.post(`${API_URL}/api/admin/locacoes`, dados, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Locação criada com sucesso!');
      }

      setMostrarModal(false);
      carregarLocacoes();
    } catch (error) {
      console.error('Erro ao salvar locação:', error);
      if (!handleAuthError(error)) {
        alert(error.response?.data?.erro || 'Erro ao salvar locação');
      }
    }
  };

  const desativarLocacao = async (id) => {
    if (!confirm('Deseja realmente desativar esta locação?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/locacoes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Locação desativada com sucesso!');
      carregarLocacoes();
    } catch (error) {
      console.error('Erro ao desativar locação:', error);
      if (!handleAuthError(error)) {
        alert('Erro ao desativar locação');
      }
    }
  };

  const reativarLocacao = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/admin/locacoes/${id}/reativar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Locação reativada com sucesso!');
      carregarLocacoes();
    } catch (error) {
      console.error('Erro ao reativar locação:', error);
      if (!handleAuthError(error)) {
        alert('Erro ao reativar locação');
      }
    }
  };

  const carregarEstatisticas = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/admin/locacoes/${id}/estatisticas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMostrarEstatisticas(response.data.estatisticas);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      if (!handleAuthError(error)) {
        alert('Erro ao carregar estatísticas');
      }
    }
  };

  const baixarQRCode = (slug) => {
    const canvas = document.getElementById(`qr-${slug}`);
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${slug}.png`;
      link.click();
    }
  };

  const getStatusBadge = (locacao) => {
    const status = locacao.statusCalculado || 'desconhecido';

    const badges = {
      ativa: { color: 'bg-green-500', icon: FaCheckCircle, text: 'Ativa' },
      expirada: { color: 'bg-red-500', icon: FaTimesCircle, text: 'Expirada' },
      pendente: { color: 'bg-yellow-500', icon: FaClock, text: 'Pendente' },
      inativa: { color: 'bg-gray-500', icon: FaTimesCircle, text: 'Inativa' },
    };

    const badge = badges[status] || badges.inativa;
    const Icon = badge.icon;

    return (
      <span className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  const locacoesFiltradas = locacoes.filter((loc) => {
    if (filtroStatus === 'todas') return true;
    return loc.statusCalculado === filtroStatus;
  });

  return (
    <div className={embedded ? "p-6" : "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Gestão de Locações
            </h1>
            <p className="text-purple-200">
              Gerencie locações temporárias do sistema
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => abrirModal()}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FaPlus />
            Nova Locação
          </motion.button>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <FaFilter className="text-white" />
            <span className="text-white font-semibold">Filtrar por status:</span>
            <div className="flex gap-2">
              {['todas', 'ativas', 'pendentes', 'expiradas'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    filtroStatus === status
                      ? 'bg-white text-purple-900'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Carregando locações...</p>
          </div>
        )}

        {/* Lista de Locações */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {locacoesFiltradas.map((locacao) => (
                <motion.div
                  key={locacao.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    {getStatusBadge(locacao)}
                    <div className="text-right">
                      <p className="text-white/60 text-xs">
                        {locacao.diasRestantes > 0
                          ? `${locacao.diasRestantes} dias restantes`
                          : 'Encerrada'}
                      </p>
                    </div>
                  </div>

                  {/* Informações */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {locacao.nomeEvento}
                  </h3>
                  <p className="text-purple-200 text-sm mb-1">
                    Cliente: {locacao.nomeCliente}
                  </p>
                  <p className="text-purple-200 text-sm mb-4">
                    Slug: <span className="font-mono">/l/{locacao.slug}</span>
                  </p>

                  {/* Datas */}
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                    <FaCalendar size={12} />
                    <span>
                      {new Date(locacao.dataInicio).toLocaleDateString()} -{' '}
                      {new Date(locacao.dataFim).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Estatísticas Rápidas */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/5 rounded p-2">
                      <div className="flex items-center gap-2 text-purple-200 text-xs mb-1">
                        <FaMusic size={10} />
                        <span>Pedidos</span>
                      </div>
                      <p className="text-white font-bold">{locacao.totalPedidos || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="flex items-center gap-2 text-green-200 text-xs mb-1">
                        <FaDollarSign size={10} />
                        <span>Arrecadado</span>
                      </div>
                      <p className="text-white font-bold">
                        R$ {(locacao.totalArrecadado || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMostrarQRCode(locacao)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
                      title="Ver QR Code"
                    >
                      <FaQrcode size={14} />
                      QR
                    </button>
                    <button
                      onClick={() => carregarEstatisticas(locacao.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
                      title="Estatísticas"
                    >
                      <FaChartLine size={14} />
                      Stats
                    </button>
                    <button
                      onClick={() => abrirModal(locacao)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
                      title="Editar"
                    >
                      <FaEdit size={14} />
                    </button>
                    {locacao.ativo ? (
                      <button
                        onClick={() => desativarLocacao(locacao.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
                        title="Desativar"
                      >
                        <FaTrash size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => reativarLocacao(locacao.id)}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
                        title="Reativar"
                      >
                        <FaUndo size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && locacoesFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white text-xl">Nenhuma locação encontrada</p>
            <p className="text-purple-200 mt-2">
              Crie uma nova locação para começar
            </p>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {locacaoEditando ? 'Editar Locação' : 'Nova Locação'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Slug * (URL amigável)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="casamento-joao-maria"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /l/{formData.slug || 'seu-slug'}
                    </p>
                  </div>

                  {/* Nome do Cliente */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nomeCliente}
                      onChange={(e) =>
                        setFormData({ ...formData, nomeCliente: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="João Silva"
                    />
                  </div>

                  {/* Nome do Evento */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-2">
                      Nome do Evento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nomeEvento}
                      onChange={(e) =>
                        setFormData({ ...formData, nomeEvento: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Casamento João & Maria"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email de Contato
                    </label>
                    <input
                      type="email"
                      value={formData.emailContato}
                      onChange={(e) =>
                        setFormData({ ...formData, emailContato: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="cliente@email.com"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Telefone de Contato
                    </label>
                    <input
                      type="tel"
                      value={formData.telefoneContato}
                      onChange={(e) =>
                        setFormData({ ...formData, telefoneContato: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  {/* Data Início */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Data/Hora Início *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dataInicio}
                      onChange={(e) =>
                        setFormData({ ...formData, dataInicio: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Data Fim */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Data/Hora Fim *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dataFim}
                      onChange={(e) =>
                        setFormData({ ...formData, dataFim: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Customizações */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-bold mb-4">Customizações</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Nome do Estabelecimento */}
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-2">
                        Nome do Estabelecimento (Tela de Descanso)
                      </label>
                      <input
                        type="text"
                        value={formData.nomeEstabelecimento}
                        onChange={(e) =>
                          setFormData({ ...formData, nomeEstabelecimento: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Nome exibido na tela"
                      />
                    </div>

                    {/* Logo URL */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        URL da Logo
                      </label>
                      <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, logoUrl: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://exemplo.com/logo.png"
                      />
                    </div>

                    {/* Cor do Tema */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Cor do Tema
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.corTema}
                          onChange={(e) =>
                            setFormData({ ...formData, corTema: e.target.value })
                          }
                          className="w-16 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.corTema}
                          onChange={(e) =>
                            setFormData({ ...formData, corTema: e.target.value })
                          }
                          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="#FF6B6B"
                        />
                      </div>
                    </div>

                    {/* Mensagem de Boas-Vindas */}
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-2">
                        Mensagem de Boas-Vindas
                      </label>
                      <textarea
                        value={formData.mensagemBoasVindas}
                        onChange={(e) =>
                          setFormData({ ...formData, mensagemBoasVindas: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows="2"
                        placeholder="Bem-vindo ao nosso evento!"
                      ></textarea>
                    </div>

                    {/* Background URL */}
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-2">
                        URL da Imagem de Fundo
                      </label>
                      <input
                        type="url"
                        value={formData.backgroundImageUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundImageUrl: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://exemplo.com/background.jpg"
                      />
                    </div>

                    {/* Vídeo de Descanso URL */}
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-2">
                        URL do Vídeo de Descanso (YouTube)
                      </label>
                      <input
                        type="url"
                        value={formData.videoDescansoUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, videoDescansoUrl: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Vídeo exibido na tela de descanso quando não houver músicas na fila
                      </p>
                    </div>

                    {/* Observações */}
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold mb-2">
                        Observações Internas
                      </label>
                      <textarea
                        value={formData.observacoes}
                        onChange={(e) =>
                          setFormData({ ...formData, observacoes: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows="2"
                        placeholder="Notas internas sobre a locação..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg"
                  >
                    {locacaoEditando ? 'Atualizar' : 'Criar'} Locação
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de QR Code */}
      {mostrarQRCode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-8 max-w-md w-full text-center"
          >
            <h2 className="text-2xl font-bold mb-4">{mostrarQRCode.nomeEvento}</h2>
            <p className="text-gray-600 mb-6">
              Escaneie para acessar a locação
            </p>

            <div className="bg-white p-6 rounded-lg inline-block shadow-xl mb-6">
              <QRCodeCanvas
                id={`qr-${mostrarQRCode.slug}`}
                value={mostrarQRCode.qrCodeData || `${API_URL}/l/${mostrarQRCode.slug}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-sm text-gray-600 mb-4 font-mono bg-gray-100 p-2 rounded">
              {mostrarQRCode.qrCodeData || `${API_URL}/l/${mostrarQRCode.slug}`}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => baixarQRCode(mostrarQRCode.slug)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <FaDownload />
                Baixar QR Code
              </button>
              <button
                onClick={() => setMostrarQRCode(null)}
                className="flex-1 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Estatísticas */}
      {mostrarEstatisticas && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-8 max-w-2xl w-full"
          >
            <h2 className="text-2xl font-bold mb-6">
              Estatísticas - {mostrarEstatisticas.locacao.nomeEvento}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaMusic size={24} />
                  <span className="text-sm opacity-80">Total de Pedidos</span>
                </div>
                <p className="text-4xl font-bold">{mostrarEstatisticas.totalPedidos}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaDollarSign size={24} />
                  <span className="text-sm opacity-80">Total Arrecadado</span>
                </div>
                <p className="text-4xl font-bold">
                  R$ {mostrarEstatisticas.totalArrecadado.toFixed(2)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaCalendar size={24} />
                  <span className="text-sm opacity-80">Período</span>
                </div>
                <p className="text-4xl font-bold">{mostrarEstatisticas.periodoDias} dias</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaChartLine size={24} />
                  <span className="text-sm opacity-80">Média/Dia</span>
                </div>
                <p className="text-4xl font-bold">
                  {mostrarEstatisticas.periodoDias > 0
                    ? (mostrarEstatisticas.totalArrecadado / mostrarEstatisticas.periodoDias).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarEstatisticas(null)}
              className="w-full border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Locacoes;
