const prisma = require('../config/database');

/**
 * Registra uma música no histórico quando ela começa a tocar
 */
async function registrarInicioMusica(estabelecimentoId, dadosMusica) {
  try {
    const historico = await prisma.historico_musicas.create({
      data: {
        estabelecimentoId,
        pedidoMusicaId: dadosMusica.pedidoId || null,
        musicaTitulo: dadosMusica.titulo,
        musicaYoutubeId: dadosMusica.youtubeId,
        musicaThumbnail: dadosMusica.thumbnail || null,
        musicaDuracao: dadosMusica.duracao || null,
        nomeCliente: dadosMusica.nomeCliente || null,
        valor: dadosMusica.valor || 0,
        tipo: dadosMusica.tipo || 'cliente', // cliente, ambiente, admin
        observacao: dadosMusica.observacao || null,
        inicioReproducao: new Date(),
      }
    });

    console.log('📝 Música registrada no histórico:', historico.id);
    return historico;
  } catch (error) {
    console.error('❌ Erro ao registrar música no histórico:', error);
    throw error;
  }
}

/**
 * Atualiza o histórico quando a música termina
 */
async function registrarFimMusica(historicoId, duracaoTocada) {
  try {
    const historico = await prisma.historico_musicas.update({
      where: { id: historicoId },
      data: {
        fimReproducao: new Date(),
        duracaoTocada: duracaoTocada || null,
      }
    });

    console.log('✅ Fim da música registrado no histórico:', historico.id);
    return historico;
  } catch (error) {
    console.error('❌ Erro ao atualizar histórico:', error);
    throw error;
  }
}

/**
 * Busca histórico de músicas com filtros e paginação
 */
async function buscarHistorico(estabelecimentoId, filtros = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      dataInicio,
      dataFim,
      tipo,
      nomeCliente,
      musicaTitulo
    } = filtros;

    const skip = (page - 1) * limit;

    // Construir filtros WHERE
    const where = {
      estabelecimentoId,
    };

    if (dataInicio || dataFim) {
      where.inicioReproducao = {};
      if (dataInicio) where.inicioReproducao.gte = new Date(dataInicio);
      if (dataFim) where.inicioReproducao.lte = new Date(dataFim);
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (nomeCliente) {
      where.nomeCliente = {
        contains: nomeCliente
      };
    }

    if (musicaTitulo) {
      where.musicaTitulo = {
        contains: musicaTitulo
      };
    }

    // Buscar dados paginados
    const [historico, total] = await Promise.all([
      prisma.historico_musicas.findMany({
        where,
        orderBy: {
          inicioReproducao: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.historico_musicas.count({ where })
    ]);

    return {
      historico,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    throw error;
  }
}

/**
 * Busca estatísticas do histórico
 */
async function buscarEstatisticas(estabelecimentoId, periodo = 'hoje') {
  try {
    let dataInicio;
    const dataFim = new Date();

    // Definir período
    switch (periodo) {
      case 'hoje':
        dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case 'mes':
        dataInicio = new Date();
        dataInicio.setMonth(dataInicio.getMonth() - 1);
        break;
      default:
        dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);
    }

    const historico = await prisma.historico_musicas.findMany({
      where: {
        estabelecimentoId,
        inicioReproducao: {
          gte: dataInicio,
          lte: dataFim
        }
      }
    });

    // Calcular estatísticas
    const totalMusicas = historico.length;
    const musicasCliente = historico.filter(h => h.tipo === 'cliente').length;
    const musicasAmbiente = historico.filter(h => h.tipo === 'ambiente').length;
    const valorTotal = historico.reduce((sum, h) => sum + (h.valor || 0), 0);
    const duracaoTotal = historico.reduce((sum, h) => sum + (h.duracaoTocada || h.musicaDuracao || 0), 0);

    // Músicas mais tocadas
    const musicasContagem = {};
    historico.forEach(h => {
      const key = `${h.musicaTitulo}|${h.musicaYoutubeId}`;
      if (!musicasContagem[key]) {
        musicasContagem[key] = {
          titulo: h.musicaTitulo,
          youtubeId: h.musicaYoutubeId,
          thumbnail: h.musicaThumbnail,
          quantidade: 0
        };
      }
      musicasContagem[key].quantidade++;
    });

    const musicasMaisTocadas = Object.values(musicasContagem)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // Clientes mais ativos
    const clientesContagem = {};
    historico.filter(h => h.nomeCliente).forEach(h => {
      const nome = h.nomeCliente;
      if (!clientesContagem[nome]) {
        clientesContagem[nome] = {
          nome,
          quantidade: 0,
          valorGasto: 0
        };
      }
      clientesContagem[nome].quantidade++;
      clientesContagem[nome].valorGasto += h.valor || 0;
    });

    const clientesMaisAtivos = Object.values(clientesContagem)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    return {
      periodo,
      dataInicio,
      dataFim,
      totalMusicas,
      musicasCliente,
      musicasAmbiente,
      valorTotal,
      duracaoTotal,
      duracaoTotalFormatada: formatarDuracao(duracaoTotal),
      musicasMaisTocadas,
      clientesMaisAtivos
    };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
}

function formatarDuracao(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return `${horas}h ${minutos}m`;
}

module.exports = {
  registrarInicioMusica,
  registrarFimMusica,
  buscarHistorico,
  buscarEstatisticas
};
