import React from 'react';
import styled from 'styled-components';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import { usePWA } from '../hooks/usePWA';

const IndicatorBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${props => props.show ? '40px' : '0'};
  background: ${props => props.offline
    ? 'linear-gradient(90deg, #f44336 0%, #e91e63 100%)'
    : 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)'
  };
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 2000;
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const StatusText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const PulseIcon = styled.div`
  animation: ${props => props.offline ? 'pulse 1.5s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const OfflineIndicator = () => {
  const { isOffline } = usePWA();
  const [showOnline, setShowOnline] = React.useState(false);

  // Não mostrar indicador offline na página da TV
  // A TV precisa estar sempre online para funcionar
  const isTV = window.location.pathname === '/tv';
  if (isTV) {
    return null;
  }

  React.useEffect(() => {
    if (!isOffline && showOnline) {
      const timer = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, showOnline]);

  React.useEffect(() => {
    if (!isOffline && window.navigator.onLine) {
      setShowOnline(true);
    }
  }, [isOffline]);

  const shouldShow = isOffline || showOnline;

  if (!shouldShow) {
    return null;
  }

  return (
    <IndicatorBar show={shouldShow} offline={isOffline}>
      <PulseIcon offline={isOffline}>
        {isOffline ? <FaExclamationTriangle /> : <FaWifi />}
      </PulseIcon>
      <StatusText>
        {isOffline
          ? 'Você está offline - Algumas funcionalidades podem estar limitadas'
          : 'Conexão restabelecida'}
      </StatusText>
    </IndicatorBar>
  );
};

export default OfflineIndicator;