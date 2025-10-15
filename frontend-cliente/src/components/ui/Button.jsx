import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Button reutilizável com tema customizável
 *
 * @param {Object} props
 * @param {string} props.variant - Variante do botão: 'primary', 'secondary', 'accent', 'outline', 'ghost'
 * @param {string} props.size - Tamanho: 'sm', 'md', 'lg'
 * @param {boolean} props.fullWidth - Se true, o botão ocupa 100% da largura
 * @param {boolean} props.disabled - Desabilita o botão
 * @param {Function} props.onClick - Callback ao clicar
 * @param {React.ReactNode} props.children - Conteúdo do botão
 * @param {string} props.type - Tipo HTML: 'button', 'submit', 'reset'
 * @param {string} props.className - Classes CSS adicionais
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Estilos base
  const baseStyles = `
    font-family: var(--font-primary);
    font-weight: 600;
    border-radius: var(--border-radius);
    transition: all 0.2s ease-in-out;
    cursor: pointer;
    border: 2px solid transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    outline: none;
    text-decoration: none;
  `;

  // Variantes de estilo
  const variantStyles = {
    primary: `
      background-color: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      hover:bg-opacity-90 hover:shadow-md
    `,
    secondary: `
      background-color: var(--color-secondary);
      color: white;
      border-color: var(--color-secondary);
      hover:bg-opacity-90 hover:shadow-md
    `,
    accent: `
      background-color: var(--color-accent);
      color: var(--color-background);
      border-color: var(--color-accent);
      hover:bg-opacity-90 hover:shadow-md
    `,
    outline: `
      background-color: transparent;
      color: var(--color-primary);
      border-color: var(--color-primary);
      hover:bg-color-primary hover:text-white
    `,
    ghost: `
      background-color: transparent;
      color: var(--color-text);
      border-color: transparent;
      hover:bg-color-background-secondary
    `
  };

  // Tamanhos
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Estado desabilitado
  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  // Largura completa
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyles}
        ${widthStyles}
        ${className}
      `.trim()}
      style={{
        fontFamily: 'var(--font-primary)',
        fontWeight: 600,
        borderRadius: 'var(--border-radius)',
        transition: 'all 0.2s ease-in-out',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: variant === 'outline' ? '2px solid var(--color-primary)' : '2px solid transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        outline: 'none',
        textDecoration: 'none',
        padding: size === 'sm' ? '0.375rem 0.75rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.5rem 1rem',
        fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        backgroundColor:
          variant === 'primary' ? 'var(--color-primary)' :
          variant === 'secondary' ? 'var(--color-secondary)' :
          variant === 'accent' ? 'var(--color-accent)' :
          'transparent',
        color:
          variant === 'primary' || variant === 'secondary' ? 'white' :
          variant === 'accent' ? 'var(--color-background)' :
          variant === 'outline' ? 'var(--color-primary)' :
          'var(--color-text)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'primary' || variant === 'secondary' || variant === 'accent') {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'white';
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === 'primary' || variant === 'secondary' || variant === 'accent') {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.boxShadow = 'none';
          } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-primary)';
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'outline', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};

export default Button;
