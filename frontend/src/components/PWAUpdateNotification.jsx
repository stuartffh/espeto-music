import React from 'react';
import styled from 'styled-components';
import { FaSync } from 'react-icons/fa';
import { usePWA } from '../hooks/usePWA';

const UpdateBanner = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  gap: 12px;
  z-index: 1100;
  animation: slideDown 0.3s ease;

  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(-100px);
    }
    to {
      transform: translateX(-50%) translateY(0);
    }
  }
`;

const UpdateText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const UpdateButton = styled.button`
  background: white;
  color: #4CAF50;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PWAUpdateNotification = () => {
  const { updateAvailable, updatePWA } = usePWA();

  // Não mostrar notificação de atualização na página da TV
  const isTV = window.location.pathname === '/tv';
  if (isTV || !updateAvailable) {
    return null;
  }

  return (
    <UpdateBanner show={updateAvailable}>
      <UpdateText>Nova versão disponível!</UpdateText>
      <UpdateButton onClick={updatePWA}>
        <FaSync />
        Atualizar
      </UpdateButton>
    </UpdateBanner>
  );
};

export default PWAUpdateNotification;