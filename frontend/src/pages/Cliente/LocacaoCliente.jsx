import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { FaQrcode, FaDownload, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import Home from './Home';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function LocacaoCliente() {
  const { slug } = useParams();
  const [locacao, setLocacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(false);

  useEffect(() => {
    carregarLocacao();
  }, [slug]);

  const carregarLocacao = async () => {
    try {
      setLoading(true);
      console.log(`🎯 [LOCAÇÃO CLIENTE] Carregando locação com slug: ${slug}`);

      const response = await axios.get(`${API_URL}/api/public/locacao/${slug}`);

      if (response.data.sucesso) {
        const locacaoData = response.data.locacao;
        setLocacao(locacaoData);

        // 🎯 CRITICAL: Armazenar locacaoId no sessionStorage
        console.log(`✅ [LOCAÇÃO CLIENTE] Locação carregada:`, {
          id: locacaoData.id,
          slug: locacaoData.slug,
          nomeEvento: locacaoData.nomeEvento
        });

        sessionStorage.setItem('locacaoId', locacaoData.id);
        sessionStorage.setItem('locacaoSlug', locacaoData.slug);

        console.log(`📦 [LOCAÇÃO CLIENTE] sessionStorage.locacaoId definido como: "${locacaoData.id}"`);
        console.log(`📦 [LOCAÇÃO CLIENTE] sessionStorage.locacaoSlug definido como: "${locacaoData.slug}"`);

        // Aplicar customizações
        aplicarCustomizacoes(locacaoData);
      } else {
        setErro('Locação não encontrada');
      }
    } catch (error) {
      console.error('❌ [LOCAÇÃO CLIENTE] Erro ao carregar locação:', error);
      setErro(
        error.response?.data?.erro ||
        'Locação não encontrada ou não está ativa'
      );
    } finally {
      setLoading(false);
    }
  };

  const aplicarCustomizacoes = (loc) => {
    // Aplicar cor do tema
    if (loc.corTema) {
      document.documentElement.style.setProperty('--locacao-cor-tema', loc.corTema);
    }

    // Aplicar imagem de fundo
    if (loc.backgroundImageUrl) {
      document.body.style.backgroundImage = `url(${loc.backgroundImageUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }

    // Atualizar título da página
    if (loc.nomeEvento) {
      document.title = loc.nomeEvento;
    }
  };

  const baixarQRCode = () => {
    const canvas = document.getElementById('qr-locacao');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${slug}.png`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando locação...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Locação não disponível
          </h1>
          <p className="text-gray-600 mb-6">{erro}</p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Voltar para a página inicial
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header Customizado */}
      {locacao && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-black/50 backdrop-blur-md text-white">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              {/* Logo e Nome */}
              <div className="flex items-center gap-4">
                {locacao.logoUrl && (
                  <img
                    src={locacao.logoUrl}
                    alt={locacao.nomeEvento}
                    className="h-12 w-auto object-contain"
                  />
                )}
                <div>
                  <h1 className="font-bold text-lg">
                    {locacao.nomeEstabelecimento || locacao.nomeEvento}
                  </h1>
                  {locacao.mensagemBoasVindas && (
                    <p className="text-sm text-purple-200">
                      {locacao.mensagemBoasVindas}
                    </p>
                  )}
                </div>
              </div>

              {/* Botão QR Code */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMostrarQR(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <FaQrcode />
                Compartilhar
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Espaçamento para header fixo */}
      <div className="h-20"></div>

      {/* Componente Home com contexto de locação */}
      <div
        data-locacao-id={locacao?.id}
        data-locacao-slug={locacao?.slug}
        style={{
          '--locacao-cor-tema': locacao?.corTema || '#FF6B6B',
        }}
      >
        <Home locacao={locacao} />
      </div>

      {/* Modal QR Code */}
      {mostrarQR && locacao && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-8 max-w-md w-full text-center relative"
          >
            <button
              onClick={() => setMostrarQR(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2">{locacao.nomeEvento}</h2>
            <p className="text-gray-600 mb-6">
              Escaneie o QR Code para acessar este evento
            </p>

            <div className="bg-gray-100 p-6 rounded-lg inline-block shadow-xl mb-6">
              <QRCodeCanvas
                id="qr-locacao"
                value={locacao.qrCodeData || `${window.location.origin}/l/${locacao.slug}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-sm text-gray-600 mb-4 font-mono bg-gray-100 p-2 rounded break-all">
              {locacao.qrCodeData || `${window.location.origin}/l/${locacao.slug}`}
            </p>

            <div className="flex gap-4">
              <button
                onClick={baixarQRCode}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <FaDownload />
                Baixar QR Code
              </button>
              <button
                onClick={() => setMostrarQR(false)}
                className="flex-1 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default LocacaoCliente;
