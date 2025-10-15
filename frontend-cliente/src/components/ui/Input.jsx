import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Input reutilizável com tema customizável
 *
 * @param {Object} props
 * @param {string} props.type - Tipo do input (text, email, password, etc.)
 * @param {string} props.label - Label opcional
 * @param {string} props.placeholder - Placeholder
 * @param {string} props.value - Valor controlado
 * @param {Function} props.onChange - Callback onChange
 * @param {string} props.error - Mensagem de erro
 * @param {boolean} props.disabled - Desabilita o input
 * @param {boolean} props.required - Campo obrigatório
 * @param {boolean} props.fullWidth - Largura completa
 * @param {string} props.size - Tamanho: 'sm', 'md', 'lg'
 * @param {string} props.className - Classes CSS adicionais
 */
const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  fullWidth = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Tamanhos
  const sizeStyles = {
    sm: {
      fontSize: '0.875rem',
      padding: '0.375rem 0.75rem',
    },
    md: {
      fontSize: '1rem',
      padding: '0.5rem 1rem',
    },
    lg: {
      fontSize: '1.125rem',
      padding: '0.75rem 1.25rem',
    },
  };

  // Estilos do input
  const inputStyles = {
    fontFamily: 'var(--font-primary)',
    ...sizeStyles[size],
    width: fullWidth ? '100%' : 'auto',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text)',
    border: error
      ? '2px solid #EF4444'
      : isFocused
      ? '2px solid var(--color-primary)'
      : '2px solid var(--color-text-secondary)',
    borderRadius: 'var(--border-radius)',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  // Estilos do label
  const labelStyles = {
    fontFamily: 'var(--font-primary)',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: error ? '#EF4444' : 'var(--color-text)',
    marginBottom: '0.5rem',
    display: 'block',
  };

  // Estilos da mensagem de erro
  const errorStyles = {
    fontFamily: 'var(--font-primary)',
    fontSize: '0.75rem',
    color: '#EF4444',
    marginTop: '0.25rem',
  };

  return (
    <div
      className={className}
      style={{
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={inputStyles}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <div style={errorStyles}>{error}</div>}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Input;
