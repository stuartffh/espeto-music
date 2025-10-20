import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * PainelLocacao
 *
 * Página acessada via QR code: /painel/:slugPainelTV
 * Carrega a locação e redireciona para o painel TV com o slug do cliente embedded
 */
function PainelLocacao() {
  const { slugPainelTV } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarPainel();
  }, [slugPainelTV]);

  const carregarPainel = async () => {
    try {
      setLoading(true);

      // Buscar locação pelo slugPainelTV
      const response = await axios.get(`${API_URL}/api/public/painel/${slugPainelTV}`);

      if (response.data.sucesso && response.data.locacao) {
        const locacao = response.data.locacao;

        // Redirecionar para o painel TV normal (/tv) com query params da locação
        // O painel TV vai usar esses dados para customizar a experiência
        const params = new URLSearchParams({
          locacaoId: locacao.id,
          slug: locacao.slug,
          nomeEstabelecimento: locacao.nomeEstabelecimento || locacao.nomeEvento,
          videoDescansoUrl: locacao.videoDescansoUrl || ''
        });

        navigate(`/tv?${params.toString()}`, { replace: true });
      } else {
        setErro('Painel não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar painel:', error);

      if (error.response) {
        if (error.response.status === 404) {
          setErro('Painel não encontrado');
        } else if (error.response.status === 403) {
          setErro('Esta locação não está ativa no momento');
        } else {
          setErro(error.response.data?.erro || 'Erro ao carregar painel');
        }
      } else {
        setErro('Erro de conexão com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Carregando painel...</p>
          <p className="text-purple-200 text-sm mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md text-center">
          <AlertCircle size={64} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-3">Ops!</h1>
          <p className="text-purple-200 text-lg mb-6">{erro}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return null; // Redireciona automaticamente
}

export default PainelLocacao;
