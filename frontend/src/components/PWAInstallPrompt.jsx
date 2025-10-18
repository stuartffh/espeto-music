import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaDownload, FaTimes } from 'react-icons/fa';

const InstallBanner = styled.div`
  position: fixed;
  bottom: ${props => props.show ? '20px' : '-100px'};
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 1000;
  transition: bottom 0.3s ease;
  max-width: 90%;
  width: 400px;

  @media (max-width: 768px) {
    bottom: ${props => props.show ? '10px' : '-100px'};
    left: 10px;
    right: 10px;
    transform: none;
    width: auto;
  }
`;

const InstallContent = styled.div`
  flex: 1;
`;

const InstallTitle = styled.h3`
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
`;

const InstallText = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.95;
`;

const InstallButton = styled.button`
  background: white;
  color: #ff6b6b;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  opacity: 0.8;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

const InstallInstructions = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  max-width: 400px;
  width: 90%;
  display: ${props => props.show ? 'block' : 'none'};
`;

const InstructionsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: ${props => props.show ? 'block' : 'none'};
`;

const InstructionsTitle = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const InstructionsList = styled.ol`
  color: #666;
  line-height: 1.8;
  padding-left: 20px;
`;

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  // Não mostrar PWA prompt na página da TV
  const isTV = window.location.pathname === '/tv';
  if (isTV) {
    return null;
  }

  useEffect(() => {
    // Detectar iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Verificar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Listener para PWA instalável
    const handlePWAInstallable = () => {
      setIsInstallable(true);
      // Verificar se o usuário já recusou anteriormente
      const installPromptDismissed = localStorage.getItem('pwaInstallPromptDismissed');
      const lastDismissed = localStorage.getItem('pwaInstallPromptDismissedDate');

      // Mostrar novamente após 7 dias
      if (!installPromptDismissed ||
          (lastDismissed && new Date().getTime() - new Date(lastDismissed).getTime() > 7 * 24 * 60 * 60 * 1000)) {
        setTimeout(() => setShowPrompt(true), 3000); // Mostrar após 3 segundos
      }
    };

    window.addEventListener('pwainstallable', handlePWAInstallable);

    // Para iOS, mostrar instruções se não estiver instalado
    if (ios && !standalone) {
      const iosPromptDismissed = localStorage.getItem('iosInstallPromptDismissed');
      const lastDismissed = localStorage.getItem('iosInstallPromptDismissedDate');

      if (!iosPromptDismissed ||
          (lastDismissed && new Date().getTime() - new Date(lastDismissed).getTime() > 7 * 24 * 60 * 60 * 1000)) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }

    return () => {
      window.removeEventListener('pwainstallable', handlePWAInstallable);
    };
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowInstructions(true);
    } else if (window.showInstallPrompt) {
      window.showInstallPrompt();
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('iosInstallPromptDismissed', 'true');
      localStorage.setItem('iosInstallPromptDismissedDate', new Date().toISOString());
    } else {
      localStorage.setItem('pwaInstallPromptDismissed', 'true');
      localStorage.setItem('pwaInstallPromptDismissedDate', new Date().toISOString());
    }
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    handleDismiss();
  };

  // Não mostrar se já estiver instalado
  if (isStandalone) {
    return null;
  }

  return (
    <>
      <InstallBanner show={showPrompt && (isIOS || isInstallable)}>
        <InstallContent>
          <InstallTitle>Instalar Espeto Music</InstallTitle>
          <InstallText>
            {isIOS
              ? 'Adicione o app à tela inicial para acesso rápido'
              : 'Instale o app para uma melhor experiência'}
          </InstallText>
        </InstallContent>
        <InstallButton onClick={handleInstallClick}>
          <FaDownload />
          Instalar
        </InstallButton>
        <CloseButton onClick={handleDismiss}>
          <FaTimes />
        </CloseButton>
      </InstallBanner>

      <InstructionsOverlay show={showInstructions} onClick={handleCloseInstructions} />
      <InstallInstructions show={showInstructions}>
        <InstructionsTitle>Como instalar no iOS</InstructionsTitle>
        <InstructionsList>
          <li>Toque no ícone de compartilhar <span role="img" aria-label="share">📤</span> na barra inferior do Safari</li>
          <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
          <li>Digite um nome para o app (ou mantenha "Espeto Music")</li>
          <li>Toque em "Adicionar" no canto superior direito</li>
        </InstructionsList>
        <InstallButton
          onClick={handleCloseInstructions}
          style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
        >
          Entendi
        </InstallButton>
      </InstallInstructions>
    </>
  );
};

export default PWAInstallPrompt;