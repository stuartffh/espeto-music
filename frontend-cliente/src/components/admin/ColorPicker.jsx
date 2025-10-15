import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente ColorPicker para seleção de cores
 *
 * @param {Object} props
 * @param {string} props.label - Label do campo
 * @param {string} props.value - Valor da cor em hexadecimal
 * @param {Function} props.onChange - Callback ao mudar cor
 */
const ColorPicker = ({ label, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.5rem',
          display: 'block',
        }}>
          {label}
        </label>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        border: isFocused
          ? '2px solid var(--color-primary)'
          : '2px solid var(--color-text-secondary)',
        borderRadius: 'var(--border-radius)',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--color-background)',
        transition: 'all 0.2s ease-in-out',
      }}>
        {/* Swatch de cor */}
        <div style={{
          position: 'relative',
          width: '3rem',
          height: '3rem',
          borderRadius: 'var(--border-radius)',
          border: '2px solid var(--color-text-secondary)',
          overflow: 'hidden',
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              width: 'calc(100% + 4px)',
              height: 'calc(100% + 4px)',
              border: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Input de texto para valor hexadecimal */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            // Validar formato hexadecimal
            if (/^#[0-9A-F]{0,6}$/i.test(val) || val === '#') {
              onChange(val);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="#000000"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '1rem',
            color: 'var(--color-text)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            flex: 1,
            textTransform: 'uppercase',
          }}
        />
      </div>
    </div>
  );
};

ColorPicker.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ColorPicker;
