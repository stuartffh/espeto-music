// Gerador de ícones PWA
export const generatePWAIcons = () => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ff5252');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Ícone de microfone
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = size * 0.05;

    // Desenhar microfone
    const centerX = size / 2;
    const centerY = size / 2;
    const micWidth = size * 0.2;
    const micHeight = size * 0.35;
    const micRadius = micWidth / 2;

    // Corpo do microfone (cápsula)
    ctx.beginPath();
    ctx.moveTo(centerX - micRadius, centerY - micHeight * 0.3);
    ctx.lineTo(centerX - micRadius, centerY);
    ctx.arc(centerX, centerY, micRadius, Math.PI, 0, false);
    ctx.lineTo(centerX + micRadius, centerY - micHeight * 0.3);
    ctx.arc(centerX, centerY - micHeight * 0.3, micRadius, 0, Math.PI, false);
    ctx.fill();

    // Suporte do microfone
    ctx.beginPath();
    ctx.arc(centerX, centerY, micWidth * 0.8, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();

    // Base do microfone
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + micWidth * 0.8);
    ctx.lineTo(centerX, centerY + micHeight * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - micWidth * 0.5, centerY + micHeight * 0.4);
    ctx.lineTo(centerX + micWidth * 0.5, centerY + micHeight * 0.4);
    ctx.stroke();

    // Adicionar texto "EM" pequeno no canto
    if (size >= 128) {
      ctx.font = `bold ${size * 0.15}px Arial`;
      ctx.fillStyle = 'white';
      ctx.fillText('EM', size * 0.1, size * 0.9);
    }

    // Converter para blob e salvar
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `icon-${size}x${size}.png`;
      // Apenas para debug - não fazer download automático
      console.log(`Ícone ${size}x${size} gerado:`, url);
    }, 'image/png');
  });
};

// Função para criar ícones SVG base
export const createIconSVG = () => {
  return `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff5252;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="512" height="512" fill="url(#bgGradient)" rx="100" />

      <!-- Microphone Icon -->
      <g transform="translate(256, 256)">
        <!-- Mic body -->
        <rect x="-40" y="-120" width="80" height="120" rx="40" fill="white" />

        <!-- Mic stand arc -->
        <path d="M -80 20 Q -80 80, 0 80 Q 80 80, 80 20"
              stroke="white" stroke-width="16" fill="none" />

        <!-- Mic stand base -->
        <line x1="0" y1="80" x2="0" y2="120" stroke="white" stroke-width="16" />
        <line x1="-50" y1="120" x2="50" y2="120" stroke="white" stroke-width="16" />

        <!-- Mic grille lines -->
        <line x1="-25" y1="-90" x2="25" y2="-90" stroke="#ff6b6b" stroke-width="4" />
        <line x1="-25" y1="-70" x2="25" y2="-70" stroke="#ff6b6b" stroke-width="4" />
        <line x1="-25" y1="-50" x2="25" y2="-50" stroke="#ff6b6b" stroke-width="4" />
      </g>

      <!-- Brand Text -->
      <text x="256" y="420" font-family="Arial, sans-serif" font-size="48"
            font-weight="bold" fill="white" text-anchor="middle">
        ESPETO MUSIC
      </text>
    </svg>
  `;
};