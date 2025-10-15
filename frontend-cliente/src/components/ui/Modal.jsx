import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Modal reutilizável com tema customizável
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade do modal
 * @param {Function} props.onClose - Callback ao fechar modal
 * @param {string} props.title - Título do modal
 * @param {React.ReactNode} props.children - Conteúdo do modal
 * @param {string} props.size - Tamanho: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} props.closeOnOverlayClick - Fecha ao clicar no overlay
 * @param {boolean} props.showCloseButton - Mostra botão X de fechar
 * @param {React.ReactNode} props.footer - Conteúdo do footer (botões, etc)
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
}) => {
  // Prevenir scroll no body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handler para ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Tamanhos do modal
  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1200px' },
  };

  // Estilos do overlay
  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  };

  // Estilos do container do modal
  const modalStyles = {
    backgroundColor: 'var(--color-background-secondary)',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-lg)',
    width: '100%',
    ...sizeStyles[size],
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-primary)',
  };

  // Estilos do header
  const headerStyles = {
    padding: '1.5rem',
    borderBottom: '1px solid var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  // Estilos do título
  const titleStyles = {
    fontFamily: 'var(--font-secondary)',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--color-text)',
    margin: 0,
  };

  // Estilos do body
  const bodyStyles = {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
    color: 'var(--color-text-secondary)',
  };

  // Estilos do footer
  const footerStyles = {
    padding: '1rem 1.5rem',
    borderTop: '1px solid var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  };

  // Estilos do botão de fechar
  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    color: 'var(--color-text)',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease-in-out',
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyles} onClick={handleOverlayClick}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <h2 style={titleStyles}>{title}</h2>
          {showCloseButton && (
            <button
              style={closeButtonStyles}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text)';
              }}
              aria-label="Fechar modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div style={bodyStyles}>{children}</div>

        {/* Footer (opcional) */}
        {footer && <div style={footerStyles}>{footer}</div>}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  closeOnOverlayClick: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  footer: PropTypes.node,
};

export default Modal;
