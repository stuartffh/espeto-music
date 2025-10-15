## Lista de Agentes
- **TV Player** (`frontend-tv/public/tv-player.html`)

## Funções e Comportamentos
### TV Player
- **Função principal:** renderizar e controlar a reprodução de vídeos na TV utilizando streams enviados pelo backend e comandos do frontend principal.
- **Stack/Tecnologias:** HTML5, CSS3, JavaScript ES6+, Hls.js, integração via `postMessage`.
- **Interações externas:** consome URLs de stream (MP4/HLS) expostas pelo backend, responde a comandos vindos do iframe pai e notifica eventos de término de vídeo.
- **Permissões necessárias:** iframe pai deve ser carregado com `allow="autoplay; fullscreen; encrypted-media"` e acesso à origem dos streams precisa liberar CORS.
- **Comportamentos obrigatórios:** manter os métodos `prepareForNewSource` e `playWithFallback` funcionando para garantir autoplay com fallback (incluindo fluxo nativo para Smart TVs) e preservar o prompt de interação quando o autoplay não for permitido.
- **Exemplo de uso:** `window.postMessage({ type: 'load-video', url: 'http://localhost:3000/api/stream/video/ID', format: 'mp4' }, '*');`.
