import { useState, useEffect } from 'react';
import { buscarMusicas, criarPedidoMusica, criarPagamento, buscarFila } from '../../services/api';
import socket from '../../services/socket';
import useStore from '../../store/useStore';
import { categorias, getSugestoesPorCategoria, getSugestoesDinamicas } from '../../data/musicSuggestions';
import axios from 'axios';

function Home() {
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

  useEffect(() => {
    // Buscar configurações
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    Promise.all([
      axios.get(`${API_URL}/api/config/MODO_GRATUITO`),
      axios.get(`${API_URL}/api/config/TEMPO_MAXIMO_MUSICA`)
    ])
      .then(([resModo, resTempo]) => {
        setModoGratuito(resModo.data.valor === 'true');
        const segundos = parseInt(resTempo.data.valor) || 480;
        setTempoMaximo(Math.floor(segundos / 60));
      })
      .catch(error => {
        console.error('Erro ao buscar config:', error);
        setModoGratuito(true);
        setTempoMaximo(8);
      })
      .finally(() => {
        setCarregandoConfig(false);
      });

    // Buscar fila inicial
    buscarFila().then(res => setFila(res.data)).catch(console.error);

    // Escutar atualizações via WebSocket
    socket.on('fila:atualizada', (novaFila) => {
      setFila(novaFila);
    });

    socket.on('pedido:pago', () => {
      buscarFila().then(res => setFila(res.data)).catch(console.error);
    });

    return () => {
      socket.off('fila:atualizada');
      socket.off('pedido:pago');
    };
  }, [setFila]);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setCarregandoBusca(true);
    try {
      const response = await buscarMusicas(busca);
      setResultados(response.data);
      setCategoriaAtiva(null); // Fechar categoria ao buscar
    } catch (error) {
      console.error('Erro ao buscar:', error);
      alert('Erro ao buscar músicas');
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
        alert('Erro ao buscar música');
      })
      .finally(() => {
        setCarregandoBusca(false);
      });
  };

  const handleEscolherMusica = async (musica) => {
    if (!nomeCliente.trim()) {
      alert('Por favor, digite seu nome primeiro!');
      return;
    }

    setAdicionando(true);

    try {
      const pedido = await criarPedidoMusica({
        nomeCliente: nomeCliente.trim(),
        musicaTitulo: musica.titulo,
        musicaYoutubeId: musica.id,
        musicaThumbnail: musica.thumbnail,
        musicaDuracao: musica.duracao || null,
      });

      if (modoGratuito) {
        // Modo gratuito: adicionar direto na fila
        alert(`Música "${musica.titulo}" adicionada à fila!`);
        await buscarFila().then(res => setFila(res.data));
        setBusca('');
        setResultados([]);
        setCategoriaAtiva(null);
      } else {
        // Modo pago: redirecionar para pagamento
        const pagamento = await criarPagamento(pedido.data.id);
        window.location.href = pagamento.data.initPoint;
      }
    } catch (error) {
      console.error('Erro:', error);
      alert(error.response?.data?.error || 'Erro ao processar pedido');
    } finally {
      setAdicionando(false);
    }
  };

  const toggleCategoria = async (categoriaId) => {
    if (categoriaAtiva === categoriaId) {
      setCategoriaAtiva(null);
      setSugestoesDinamicas([]);
    } else {
      setCategoriaAtiva(categoriaId);
      setResultados([]); // Limpar resultados ao abrir categoria

      // Buscar sugestões dinâmicas
      setCarregandoSugestoes(true);
      const sugestoes = await getSugestoesDinamicas(categoriaId);
      setSugestoesDinamicas(sugestoes);
      setCarregandoSugestoes(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center py-8 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold text-white">Espeto Music</h1>
            {!carregandoConfig && (
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  modoGratuito
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-400 text-gray-900'
                }`}
              >
                {modoGratuito ? 'MODO GRATUITO' : 'MODO PAGO'}
              </span>
            )}
          </div>
          <p className="text-white text-lg mb-3">Escolha a próxima música!</p>
          <button
            onClick={() => setMostrarRegras(!mostrarRegras)}
            className="text-white text-sm underline hover:text-yellow-300 transition"
          >
            {mostrarRegras ? '▲ Ocultar Regras' : '▼ Ver Regras de Uso'}
          </button>
        </div>

        {/* Seção de Regras */}
        {mostrarRegras && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📋 Regras de Uso
            </h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="font-semibold">Tempo máximo por música</p>
                  <p className="text-sm">Músicas devem ter no máximo {tempoMaximo} minutos de duração.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🎵</span>
                <div>
                  <p className="font-semibold">Nome obrigatório</p>
                  <p className="text-sm">Digite seu nome antes de escolher uma música.</p>
                </div>
              </div>

              {!modoGratuito && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-semibold">Pagamento via Mercado Pago</p>
                    <p className="text-sm">Cada música custa R$ 5,00. Pague via PIX ou cartão.</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <span className="text-2xl">🎼</span>
                <div>
                  <p className="font-semibold">Ordem de reprodução</p>
                  <p className="text-sm">As músicas são tocadas na ordem em que foram pagas/adicionadas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📺</span>
                <div>
                  <p className="font-semibold">Acompanhe na TV</p>
                  <p className="text-sm">Veja sua música tocando no painel da TV e acompanhe a fila em tempo real!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campo nome */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Seu Nome:
              </label>
              <input
                type="text"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Categorias */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Categorias</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => toggleCategoria(categoria.id)}
                    className={`${categoria.cor} text-white px-4 py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 ${
                      categoriaAtiva === categoria.id ? 'ring-4 ring-white shadow-xl' : ''
                    }`}
                  >
                    {categoria.nome}
                  </button>
                ))}
              </div>

              {/* Sugestões da categoria ativa */}
              {categoriaAtiva && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
                    Sugestões de {categorias.find(c => c.id === categoriaAtiva)?.nome}
                    {carregandoSugestoes && (
                      <span className="text-sm text-gray-500">(Carregando...)</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sugestoesDinamicas.length > 0 ? (
                      sugestoesDinamicas.map((sugestao, index) => (
                        <button
                          key={index}
                          onClick={() => handleBuscarSugestao(sugestao)}
                          disabled={carregandoBusca}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sugestao}
                        </button>
                      ))
                    ) : !carregandoSugestoes ? (
                      <p className="text-sm text-gray-500">Nenhuma sugestão disponível</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Busca */}
            <form onSubmit={handleBuscar} className="bg-white rounded-lg shadow-lg p-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Ou busque qualquer música:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome da música ou artista..."
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={carregandoBusca}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {carregandoBusca ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>

            {/* Resultados */}
            {resultados.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Resultados</h2>
                <div className="space-y-4">
                  {resultados.map((musica) => (
                    <div
                      key={musica.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={musica.thumbnail}
                        alt={musica.titulo}
                        className="w-24 h-24 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{musica.titulo}</h3>
                        <p className="text-sm text-gray-600 truncate">{musica.canal}</p>
                      </div>
                      <button
                        onClick={() => handleEscolherMusica(musica)}
                        disabled={adicionando}
                        className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                          modoGratuito
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {adicionando
                          ? 'Aguarde...'
                          : modoGratuito
                          ? 'Adicionar Grátis'
                          : 'Pagar R$ 5,00'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fila - Coluna lateral */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span>Próximas Músicas</span>
              </h2>
              {fila.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎵</div>
                  <p className="text-gray-500">Nenhuma música na fila ainda...</p>
                  <p className="text-sm text-gray-400 mt-2">Seja o primeiro a escolher!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {fila.map((pedido, index) => (
                    <div
                      key={pedido.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
                        pedido.status === 'tocando'
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-md'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <span className={`text-2xl font-bold ${
                          pedido.status === 'tocando' ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                      <img
                        src={pedido.musicaThumbnail}
                        alt=""
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{pedido.musicaTitulo}</p>
                        <p className="text-xs text-gray-600 truncate">
                          Por: {pedido.nomeCliente || 'Anônimo'}
                        </p>
                        {pedido.status === 'tocando' && (
                          <span className="inline-block mt-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                            Tocando Agora
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
