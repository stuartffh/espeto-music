## Lista de Agentes
- **TV Player** (`frontend-tv/public/tv-player.html`)

## Funções e Comportamentos
### TV Player
- **Função principal:** renderizar e controlar a reprodução de vídeos na TV utilizando streams enviados pelo backend e comandos do frontend principal.
- **Stack/Tecnologias:** HTML5, CSS3, JavaScript ES6+, Hls.js, integração via `postMessage`.
- **Interações externas:** consome URLs de stream (MP4/HLS) expostas pelo backend, responde a comandos vindos do iframe pai e notifica eventos de término de vídeo.
- **Permissões necessárias:** iframe pai deve ser carregado com `allow="autoplay; fullscreen; encrypted-media"` e acesso à origem dos streams precisa liberar CORS.
- **Comportamentos obrigatórios:** manter os métodos `prepareForNewSource`, `setNativeSource` e `playWithFallback` funcionando para garantir autoplay com fallback (incluindo fluxo nativo para Smart TVs) e preservar o prompt de interação quando o autoplay não for permitido. Utilize `autoStartAfterSource` sempre que injetar uma nova fonte para disparar `playWithFallback` e exibir o OSD se o autoplay falhar.
- **Integração com React (frontend-tv/src/App.jsx):** toda troca de vídeo deve ser feita via `postMessage` somente após receber a mensagem `player-ready`, que atualiza o estado `iframeReady`. O host precisa enviar `host-ready` no `onLoad` do iframe, reaproveitar `sendVideoToIframe` e incluir sempre o flag `autoplayConsent` atual para manter o player sincronizado.
- **Consentimento de autoplay:** o player mantém o consentimento em `localStorage` (`tv-autoplay-consent`). Quando precisa silenciar o vídeo, ele informa o host via `player-autoplay-muted` ou `player-autoplay-blocked`. Toda interação do usuário que libere áudio deve chamar `grantAutoplayConsent()` para persistir e avisar o host. Evite reativar o áudio automaticamente sem consentimento explícito para não forçar pausas involuntárias.
- **Exemplo de uso:** `window.postMessage({ type: 'load-video', url: 'http://localhost:3000/api/stream/video/ID', format: 'mp4' }, '*');`.

### Backend - Reprodução Automática
- **Função principal:** manter o backend alinhado com o frontend garantindo que cada pagamento aprovado dispare `playerService.iniciarMusica`
  apenas após o vídeo estar baixado.
- **Stack/Tecnologias:** Node.js, Express, Prisma, Socket.io, `downloadService` e `playerService`.
- **Comportamentos obrigatórios:**
  - `pagamentoService.processarWebhook` deve devolver `deveIniciarReproducao` quando não houver outra música tocando no banco.
  - O controller precisa aguardar `downloadService.baixarVideo` antes de chamar `playerService.iniciarMusica` e emitir sempre `fila:atualizada`
    e `pedido:pago` via Socket.io para sincronizar os frontends.
  - Em fluxo gratuito, `musicaController.criar` deve `await playerService.iniciarMusica` antes de responder para garantir que o estado em memória
    esteja consistente com a base e com os clientes conectados.
