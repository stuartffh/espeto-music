/**
 * Script de teste para diagnóstico do autoplay
 */

const prisma = require('./src/config/database');
const playerService = require('./src/services/playerService');
const musicaService = require('./src/services/musicaService');

async function testarAutoplay() {
  console.log('🔍 Iniciando diagnóstico do autoplay...\n');

  // 1. Verificar estado do player
  console.log('1️⃣ Verificando estado do player em memória:');
  const estadoPlayer = playerService.obterEstado();
  console.log('   - Status:', estadoPlayer.status);
  console.log('   - Música atual:', estadoPlayer.musicaAtual?.musicaTitulo || 'Nenhuma');
  console.log('');

  // 2. Verificar estado no banco
  console.log('2️⃣ Verificando estado do player no banco:');
  const estadoBanco = await prisma.estado_player.findUnique({
    where: { id: 'singleton' }
  });
  console.log('   - Status:', estadoBanco?.status || 'Não encontrado');
  console.log('   - musicaAtualId:', estadoBanco?.musicaAtualId || 'null');
  console.log('');

  // 3. Verificar fila de músicas
  console.log('3️⃣ Verificando fila de músicas:');
  const fila = await musicaService.buscarFilaMusicas();
  console.log('   - Total na fila:', fila.length);

  const pagasNaoTocando = fila.filter(m => m.status === 'pago');
  console.log('   - Músicas pagas (aguardando):', pagasNaoTocando.length);

  const tocando = fila.filter(m => m.status === 'tocando');
  console.log('   - Músicas tocando:', tocando.length);

  if (pagasNaoTocando.length > 0) {
    console.log('\n   📋 Músicas aguardando na fila:');
    pagasNaoTocando.forEach((m, i) => {
      console.log(`      ${i + 1}. ${m.musicaTitulo} - ${m.nomeCliente} (ID: ${m.id})`);
    });
  }
  console.log('');

  // 4. Verificar se há músicas pagas mas player parado
  console.log('4️⃣ Diagnóstico do problema:');
  if (pagasNaoTocando.length > 0 && !estadoPlayer.musicaAtual) {
    console.log('   ❌ PROBLEMA DETECTADO: Há músicas na fila mas nenhuma tocando!');
    console.log('   💡 Solução: Iniciar a primeira música da fila');
    console.log('');

    const primeiraMusicaNaFila = pagasNaoTocando[0];
    console.log(`   🎵 Iniciando música: ${primeiraMusicaNaFila.musicaTitulo}`);

    // Marcar como tocando
    const musicaTocando = await musicaService.tocarMusica(primeiraMusicaNaFila.id);

    // Iniciar no player
    await playerService.iniciarMusica(musicaTocando);

    console.log('   ✅ Música iniciada com sucesso!');
  } else if (estadoPlayer.musicaAtual) {
    console.log('   ✅ Player está funcionando corretamente');
    console.log(`   🎵 Tocando: ${estadoPlayer.musicaAtual.musicaTitulo}`);
  } else {
    console.log('   ℹ️  Fila vazia - aguardando pedidos');
  }
  console.log('');

  // 5. Verificar configurações
  console.log('5️⃣ Verificando configurações do sistema:');
  const maxFila = await prisma.configuracoes.findUnique({
    where: { chave: 'MAX_MUSICAS_FILA' }
  });
  console.log('   - MAX_MUSICAS_FILA:', maxFila?.valor || 'não configurado');

  const permiteDuplicadas = await prisma.configuracoes.findUnique({
    where: { chave: 'PERMITIR_MUSICAS_DUPLICADAS' }
  });
  console.log('   - PERMITIR_MUSICAS_DUPLICADAS:', permiteDuplicadas?.valor || 'não configurado');
  console.log('');

  console.log('✅ Diagnóstico completo!\n');
  process.exit(0);
}

// Executar teste
testarAutoplay().catch(error => {
  console.error('❌ Erro ao executar diagnóstico:', error);
  process.exit(1);
});
