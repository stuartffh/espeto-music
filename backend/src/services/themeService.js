const prisma = require('../config/database');

/**
 * Obter o tema ativo
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function obterTemaAtivo(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  try {
    let tema = await prisma.tema.findUnique({
      where: { estabelecimentoId } // ← Multi-tenant: unique por estabelecimento
    });

    // Se não existir tema, criar com valores padrão
    if (!tema) {
      tema = await prisma.tema.create({
        data: {
          estabelecimentoId, // ← Multi-tenant
          nome: 'Espeto Music',
          corPrimaria: '#DC2626',
          corSecundaria: '#F97316',
          corAcento: '#FBBF24',
          corFundo: '#0F172A',
          corFundoSecundario: '#1E293B',
          corTexto: '#F8FAFC',
          corTextoSecundario: '#CBD5E1',
          fontePrimaria: 'Inter',
          fonteSecundaria: 'Poppins',
          borderRadius: '8px',
          shadowIntensity: 'medium'
        }
      });
    }

    return tema;
  } catch (error) {
    throw new Error(`Erro ao obter tema: ${error.message}`);
  }
}

/**
 * Atualizar o tema ativo
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function atualizarTema(estabelecimentoId, dados) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  try {
    const tema = await prisma.tema.upsert({
      where: { estabelecimentoId }, // ← Multi-tenant
      update: {
        ...dados,
        atualizadoEm: new Date()
      },
      create: {
        estabelecimentoId, // ← Multi-tenant
        nome: dados.nome || 'Espeto Music',
        corPrimaria: dados.corPrimaria || '#DC2626',
        corSecundaria: dados.corSecundaria || '#F97316',
        corAcento: dados.corAcento || '#FBBF24',
        corFundo: dados.corFundo || '#0F172A',
        corFundoSecundario: dados.corFundoSecundario || '#1E293B',
        corTexto: dados.corTexto || '#F8FAFC',
        corTextoSecundario: dados.corTextoSecundario || '#CBD5E1',
        logoUrl: dados.logoUrl,
        backgroundUrl: dados.backgroundUrl,
        iconUrl: dados.iconUrl,
        fontePrimaria: dados.fontePrimaria || 'Inter',
        fonteSecundaria: dados.fonteSecundaria || 'Poppins',
        borderRadius: dados.borderRadius || '8px',
        shadowIntensity: dados.shadowIntensity || 'medium'
      }
    });

    return tema;
  } catch (error) {
    throw new Error(`Erro ao atualizar tema: ${error.message}`);
  }
}

/**
 * Resetar tema para os valores padrão
 * MULTI-TENANT: Requer estabelecimentoId
 */
async function resetarTema(estabelecimentoId) {
  if (!estabelecimentoId) {
    throw new Error('estabelecimentoId é obrigatório');
  }

  try {
    const tema = await prisma.tema.upsert({
      where: { estabelecimentoId }, // ← Multi-tenant
      update: {
        nome: 'Espeto Music',
        corPrimaria: '#DC2626',
        corSecundaria: '#F97316',
        corAcento: '#FBBF24',
        corFundo: '#0F172A',
        corFundoSecundario: '#1E293B',
        corTexto: '#F8FAFC',
        corTextoSecundario: '#CBD5E1',
        logoUrl: null,
        backgroundUrl: null,
        iconUrl: null,
        fontePrimaria: 'Inter',
        fonteSecundaria: 'Poppins',
        borderRadius: '8px',
        shadowIntensity: 'medium',
        atualizadoEm: new Date()
      },
      create: {
        estabelecimentoId, // ← Multi-tenant
        nome: 'Espeto Music',
        corPrimaria: '#DC2626',
        corSecundaria: '#F97316',
        corAcento: '#FBBF24',
        corFundo: '#0F172A',
        corFundoSecundario: '#1E293B',
        corTexto: '#F8FAFC',
        corTextoSecundario: '#CBD5E1',
        fontePrimaria: 'Inter',
        fonteSecundaria: 'Poppins',
        borderRadius: '8px',
        shadowIntensity: 'medium'
      }
    });

    return tema;
  } catch (error) {
    throw new Error(`Erro ao resetar tema: ${error.message}`);
  }
}

/**
 * Obter CSS customizado baseado no tema
 */
function gerarCssCustomizado(tema) {
  return `
:root {
  --color-primary: ${tema.corPrimaria};
  --color-secondary: ${tema.corSecundaria};
  --color-accent: ${tema.corAcento};
  --color-background: ${tema.corFundo};
  --color-background-secondary: ${tema.corFundoSecundario};
  --color-text: ${tema.corTexto};
  --color-text-secondary: ${tema.corTextoSecundario};
  --font-primary: ${tema.fontePrimaria}, sans-serif;
  --font-secondary: ${tema.fonteSecundaria}, sans-serif;
  --border-radius: ${tema.borderRadius};
  --shadow-sm: ${tema.shadowIntensity === 'light' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : tema.shadowIntensity === 'medium' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'};
  --shadow-md: ${tema.shadowIntensity === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : tema.shadowIntensity === 'medium' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)'};
  --shadow-lg: ${tema.shadowIntensity === 'light' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : tema.shadowIntensity === 'medium' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'};
}
  `.trim();
}

module.exports = {
  obterTemaAtivo,
  atualizarTema,
  resetarTema,
  gerarCssCustomizado
};
