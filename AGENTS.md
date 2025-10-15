## Lista de Agentes
- **TV Player** (`frontend-tv/public/tv-player.html`)

## Funções e Comportamentos
### TV Player
- **Função principal:** renderizar e controlar a reprodução de vídeos na TV utilizando streams enviados pelo backend e comandos do frontend principal.
- **Stack/Tecnologias:** HTML5, CSS3, JavaScript ES6+, Hls.js, integração via `postMessage`.
- **Interações externas:** consome URLs de stream (MP4/HLS) expostas pelo backend, responde a comandos vindos do iframe pai e notifica eventos de término de vídeo.
- **Permissões necessárias:** iframe pai deve ser carregado com `allow="autoplay; fullscreen; encrypted-media"` e acesso à origem dos streams precisa liberar CORS.
- **Comportamentos obrigatórios:** manter os métodos `prepareForNewSource`, `setNativeSource` e `playWithFallback` funcionando para garantir autoplay com fallback (incluindo fluxo nativo para Smart TVs) e preservar o prompt de interação quando o autoplay não for permitido. Utilize `autoStartAfterSource` sempre que injetar uma nova fonte para disparar `playWithFallback` e exibir o OSD se o autoplay falhar.
- **Integração com React (frontend-tv/src/App.jsx):** toda troca de vídeo deve ser feita via `postMessage` após o iframe sinalizar que está pronto (`iframeReady`). Reaproveite o helper `sendVideoToIframe` e o estado `iframeReady` já existentes no componente principal para garantir que novas músicas sejam carregadas apenas quando o player estiver carregado.
- **Exemplo de uso:** `window.postMessage({ type: 'load-video', url: 'http://localhost:3000/api/stream/video/ID', format: 'mp4' }, '*');`.
