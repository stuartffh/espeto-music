import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Card reutilizável com tema customizável
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo do card
 * @param {string} props.title - Título opcional do card
 * @param {string} props.variant - Variante: 'default', 'elevated', 'outlined'
 * @param {boolean} props.hoverable - Se true, aplica efeito hover
 * @param {Function} props.onClick - Callback ao clicar (torna o card clicável)
 * @param {string} props.className - Classes CSS adicionais
 */
const Card = ({
  children,
  title,
  variant = 'default',
  hoverable = false,
  onClick,
  className = '',
  ...props
}) => {
  const isClickable = !!onClick;

  // Estilos base
  const baseStyles = {
    fontFamily: 'var(--font-primary)',
    backgroundColor: 'var(--color-background-secondary)',
    borderRadius: 'var(--border-radius)',
    padding: '1.5rem',
    transition: 'all 0.3s ease-in-out',
    cursor: isClickable ? 'pointer' : 'default',
  };

  // Variantes
  const variantStyles = {
    default: {
      border: 'none',
      boxShadow: 'none',
    },
    elevated: {
      border: 'none',
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      border: '1px solid var(--color-text-secondary)',
      boxShadow: 'none',
    },
  };

  // Estado hover
  const [isHovered, setIsHovered] = React.useState(false);

  const hoverStyles = hoverable || isClickable ? {
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered ? 'var(--shadow-lg)' : variantStyles[variant].boxShadow,
  } : {};

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...hoverStyles,
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => (hoverable || isClickable) && setIsHovered(true)}
      onMouseLeave={() => (hoverable || isClickable) && setIsHovered(false)}
      style={combinedStyles}
      className={className}
      {...props}
    >
      {title && (
        <h3
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'var(--color-text)',
            marginBottom: '1rem',
            marginTop: 0,
          }}
        >
          {title}
        </h3>
      )}
      <div style={{ color: 'var(--color-text-secondary)' }}>
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined']),
  hoverable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Card;
