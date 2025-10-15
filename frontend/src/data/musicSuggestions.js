// Categorias e sugestões de músicas brasileiras

export const categorias = [
  {
    id: 'sertanejo',
    nome: '🤠 Sertanejo',
    cor: 'bg-amber-500',
  },
  {
    id: 'pagode',
    nome: '🥁 Pagode',
    cor: 'bg-yellow-500',
  },
  {
    id: 'funk',
    nome: '🔊 Funk',
    cor: 'bg-pink-500',
  },
  {
    id: 'mpb',
    nome: '🎵 MPB',
    cor: 'bg-blue-500',
  },
  {
    id: 'rock',
    nome: '🎸 Rock BR',
    cor: 'bg-red-500',
  },
  {
    id: 'forro',
    nome: '🪗 Forró',
    cor: 'bg-green-500',
  },
  {
    id: 'samba',
    nome: '🎺 Samba',
    cor: 'bg-orange-500',
  },
  {
    id: 'gospel',
    nome: '🙏 Gospel',
    cor: 'bg-purple-500',
  },
];

export const sugestoes = {
  sertanejo: [
    'Evidências - Chitãozinho e Xororó',
    'Fico Assim Sem Você - Adriana Calcanhotto',
    'Faz um Milagre em Mim - Regis Danese',
    'Meu Violão e o Nosso Cachorro - Simone e Simaria',
    'Largado às Traças - Zé Neto e Cristiano',
    'Jenifer - Gabriel Diniz',
    'Morena - Luan Santana',
    'Vai Malandra - Anitta',
  ],
  pagode: [
    'Deixa a Vida Me Levar - Zeca Pagodinho',
    'Sorriso Maroto - Adivinha o Quê',
    'Thiaguinho - Falta Você',
    'Péricles - Melhor Eu Ir',
    'Turma do Pagode - Sua Cara',
    'Bom Gosto - Curtição',
    'Revelação - Deixa Acontecer',
    'Sorriso Maroto - Sinais',
  ],
  funk: [
    'Baile de Favela - MC João',
    'Bum Bum Tam Tam - MC Fioti',
    'Vai Malandra - Anitta',
    'Onda Diferente - Anitta',
    'Jenifer - Gabriel Diniz',
    'Dennis DJ - Lindona',
    'MC Kevinho - Olha a Explosão',
    'Ludmilla - Cheguei',
  ],
  mpb: [
    'Garota de Ipanema - Tom Jobim',
    'Aquarela - Toquinho',
    'Sozinho - Caetano Veloso',
    'Fotografia - Vinicius de Moraes',
    'Construção - Chico Buarque',
    'Como uma Onda - Lulu Santos',
    'Eduardo e Mônica - Legião Urbana',
    'Tempo Perdido - Legião Urbana',
  ],
  rock: [
    'Pais e Filhos - Legião Urbana',
    'Patience - Guns N Roses',
    'Faroeste Caboclo - Legião Urbana',
    'Ainda é Cedo - Legião Urbana',
    'Química - Legião Urbana',
    'Por Enquanto - Cássia Eller',
    'Exagerado - Cazuza',
    'Ideologia - Cazuza',
  ],
  forro: [
    'Xote da Alegria - Falamansa',
    'Morena Tropicana - Alceu Valença',
    'Asa Branca - Luiz Gonzaga',
    'Isso Aqui Tá Bom Demais - Dominguinhos',
    'Anunciação - Alceu Valença',
    'Pagode Russo - Luiz Gonzaga',
    'Forró do HH - Aviões do Forró',
    'Bicho de Pé - Calcinha Preta',
  ],
  samba: [
    'Deixa a Vida Me Levar - Zeca Pagodinho',
    'Aquarela Brasileira - Silas de Oliveira',
    'Partido Alto - Martinho da Vila',
    'Canta Canta Minha Gente - Martinho da Vila',
    'O Mundo é um Moinho - Cartola',
    'Feitiço da Vila - Noel Rosa',
    'Samba do Arnesto - Adoniran Barbosa',
    'Trem das Onze - Adoniran Barbosa',
  ],
  gospel: [
    'Tua Graça Me Basta - Fernandinho',
    'Porque Ele Vive - Aline Barros',
    'Deus Cuida de Mim - Kleber Lucas',
    'Ainda Existe Uma Cruz - Bruna Karla',
    'Vai Valer a Pena - Aline Barros',
    'Hosana - Gabriela Rocha',
    'Águas Purificadoras - Diante do Trono',
    'Sonhos de Deus - Ana Paula Valadão',
  ],
};

// Buscar todas as sugestões de uma categoria (fallback estático)
export const getSugestoesPorCategoria = (categoriaId) => {
  return sugestoes[categoriaId] || [];
};

// Buscar todas as sugestões
export const getTodasSugestoes = () => {
  return Object.values(sugestoes).flat();
};

// Buscar sugestões dinâmicas da API
export const getSugestoesDinamicas = async (categoriaId) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/api/sugestoes/${categoriaId}`);
    const data = await response.json();

    // Se API retornar sugestões, usar elas; senão usar estáticas
    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.error('Erro ao buscar sugestões dinâmicas:', error);
  }

  // Fallback para sugestões estáticas
  return getSugestoesPorCategoria(categoriaId);
};
