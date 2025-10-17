import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Shield,
  Building2,
  Tv,
  Users,
  Music,
  TrendingUp,
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Eye,
  RefreshCw,
  LogOut,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import StatsCard from '../../components/StatsCard';
import useSuperAdminStore from '../../store/superAdminStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { token, superAdmin, logout } = useSuperAdminStore();
  const [loading, setLoading] = useState(true);
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/super-admin/login');
      return;
    }

    carregarDados();
  }, [token, navigate]);

  const carregarDados = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, estabelecimentosRes] = await Promise.all([
        axios.get(`${API_URL}/api/super-admin/dashboard`, { headers }),
        axios.get(`${API_URL}/api/super-admin/estabelecimentos`, { headers })
      ]);

      setStats(statsRes.data);
      setEstabelecimentos(estabelecimentosRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/super-admin/login');
      } else {
        setError('Erro ao carregar dados. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  const toggleEstabelecimento = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`${API_URL}/api/super-admin/estabelecimentos/${id}/toggle-ativo`, {}, { headers });

      // Atualizar lista localmente
      setEstabelecimentos(prev =>
        prev.map(est => est.id === id ? { ...est, ativo: !est.ativo } : est)
      );
    } catch (err) {
      console.error('Erro ao alternar estabelecimento:', err);
      alert('Erro ao alternar status do estabelecimento');
    }
  };

  const estabelecimentosFiltrados = estabelecimentos.filter(est =>
    est.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanoBadge = (plano) => {
    const planos = {
      basico: { label: 'Básico', color: 'bg-gray-500' },
      pro: { label: 'Pro', color: 'bg-blue-500' },
      enterprise: { label: 'Enterprise', color: 'bg-purple-500' }
    };
    return planos[plano] || planos.basico;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2.5 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Super Admin</h1>
                <p className="text-sm text-purple-200">Painel de Controle Global</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white font-medium">{superAdmin.nome}</p>
                <p className="text-xs text-purple-300">@{superAdmin.username}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 bg-black/20 backdrop-blur-sm p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setAbaAtiva('overview')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              abaAtiva === 'overview'
                ? 'bg-white text-purple-900 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setAbaAtiva('estabelecimentos')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              abaAtiva === 'estabelecimentos'
                ? 'bg-white text-purple-900 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Estabelecimentos
          </button>
        </div>

        {/* Overview Tab */}
        {abaAtiva === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={Building2}
                label="Estabelecimentos"
                value={stats.totalEstabelecimentos}
                color="from-blue-500 to-blue-600"
                detail={`${stats.estabelecimentosAtivos} ativos`}
              />
              <StatsCard
                icon={Tv}
                label="TVs Cadastradas"
                value={stats.totalTVs}
                color="from-purple-500 to-purple-600"
                detail={`${stats.tvsOnline} online`}
              />
              <StatsCard
                icon={Users}
                label="Administradores"
                value={stats.totalAdmins}
                color="from-green-500 to-green-600"
              />
              <StatsCard
                icon={Music}
                label="Músicas Hoje"
                value={stats.totalMusicasHoje}
                color="from-orange-500 to-orange-600"
                detail={`${stats.totalPedidos} total`}
              />
            </div>

            {/* Planos */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Distribuição por Plano
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.estabelecimentosPorPlano?.map((item) => {
                    const planoBadge = getPlanoBadge(item.plano);
                    return (
                      <div key={item.plano} className="bg-black/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${planoBadge.color}`}>
                            {planoBadge.label}
                          </span>
                          <span className="text-2xl font-bold text-white">{item._count}</span>
                        </div>
                        <p className="text-sm text-purple-200">estabelecimentos</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Top Estabelecimentos */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top 5 Estabelecimentos
                </h2>
                <div className="space-y-3">
                  {stats.topEstabelecimentos?.map((item, index) => (
                    <div key={item.estabelecimento.id} className="flex items-center gap-4 bg-black/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white/50 w-8">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.estabelecimento.nome}</p>
                        <p className="text-sm text-purple-200">/{item.estabelecimento.slug}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">{item._count}</p>
                        <p className="text-xs text-purple-200">músicas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Estabelecimentos Tab */}
        {abaAtiva === 'estabelecimentos' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, slug ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 bg-white/10 border-white/20 text-white placeholder-purple-300"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={carregarDados}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button
                  onClick={() => {/* TODO: Abrir modal de criação */}}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo
                </Button>
              </div>
            </div>

            {/* Lista */}
            <div className="grid grid-cols-1 gap-4">
              {estabelecimentosFiltrados.map((est) => {
                const planoBadge = getPlanoBadge(est.plano);
                return (
                  <Card key={est.id} className="bg-white/10 backdrop-blur-md border-white/20">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{est.nome}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${planoBadge.color}`}>
                              {planoBadge.label}
                            </span>
                            {est.ativo ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-purple-200">
                            <span>/{est.slug}</span>
                            <span>Código: {est.codigo}</span>
                            <span>{est.email}</span>
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-purple-300">
                            <span>{est.limiteTVs} TVs</span>
                            <span>{est.limiteMusicasMes} músicas/mês</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleEstabelecimento(est.id)}
                            className={est.ativo ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}
                          >
                            {est.ativo ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {estabelecimentosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <p className="text-white text-lg">Nenhum estabelecimento encontrado</p>
                <p className="text-purple-300 text-sm mt-2">
                  {searchTerm ? 'Tente outra busca' : 'Adicione o primeiro estabelecimento'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default SuperAdminDashboard;
