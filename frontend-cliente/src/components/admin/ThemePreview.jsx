import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Input } from '../ui';

/**
 * Componente para preview em tempo real do tema
 *
 * @param {Object} props
 * @param {Object} props.previewTheme - Tema para preview
 */
const ThemePreview = ({ previewTheme }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Aplicar tema ao preview
  const applyPreviewTheme = () => {
    const styles = {
      '--color-primary': previewTheme.corPrimaria,
      '--color-secondary': previewTheme.corSecundaria,
      '--color-accent': previewTheme.corAcento,
      '--color-background': previewTheme.corFundo,
      '--color-background-secondary': previewTheme.corFundoSecundario,
      '--color-text': previewTheme.corTexto,
      '--color-text-secondary': previewTheme.corTextoSecundario,
      '--font-primary': `${previewTheme.fontePrimaria}, sans-serif`,
      '--font-secondary': `${previewTheme.fonteSecundaria}, sans-serif`,
      '--border-radius': previewTheme.borderRadius,
    };

    // Sombras
    const shadowIntensity = previewTheme.shadowIntensity || 'medium';
    const shadows = {
      light: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      },
      medium: {
        sm: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      strong: {
        sm: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        md: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        lg: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }
    };

    styles['--shadow-sm'] = shadows[shadowIntensity].sm;
    styles['--shadow-md'] = shadows[shadowIntensity].md;
    styles['--shadow-lg'] = shadows[shadowIntensity].lg;

    return styles;
  };

  return (
    <div style={applyPreviewTheme()}>
      <Card title="Preview do Tema" variant="elevated">
        <div style={{
          backgroundColor: 'var(--color-background)',
          padding: '1.5rem',
          borderRadius: 'var(--border-radius)',
          minHeight: '600px',
        }}>
          {/* Título */}
          <h2 style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--color-text)',
            marginBottom: '1rem',
          }}>
            {previewTheme.nome || 'Espeto Music'}
          </h2>

          <p style={{
            fontFamily: 'var(--font-primary)',
            color: 'var(--color-text-secondary)',
            marginBottom: '1.5rem',
          }}>
            Este é um preview de como o tema ficará na aplicação.
          </p>

          {/* Botões */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.75rem',
            }}>
              Botões
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
            }}>
              <Button variant="primary" size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="accent" size="sm">Accent</Button>
              <Button variant="outline" size="sm">Outline</Button>
            </div>
          </div>

          {/* Card de exemplo */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.75rem',
            }}>
              Card de Exemplo
            </h3>
            <div style={{
              backgroundColor: 'var(--color-background-secondary)',
              padding: '1rem',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow-md)',
            }}>
              <h4 style={{
                fontFamily: 'var(--font-secondary)',
                color: 'var(--color-text)',
                marginBottom: '0.5rem',
              }}>
                Título do Card
              </h4>
              <p style={{
                fontFamily: 'var(--font-primary)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
              }}>
                Este é um exemplo de texto dentro de um card com as cores do tema aplicadas.
              </p>
            </div>
          </div>

          {/* Input de exemplo */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.75rem',
            }}>
              Input de Exemplo
            </h3>
            <div style={{
              backgroundColor: 'var(--color-background-secondary)',
              padding: '1rem',
              borderRadius: 'var(--border-radius)',
            }}>
              <Input
                label="Nome"
                placeholder="Digite seu nome"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                fullWidth
              />
            </div>
          </div>

          {/* Paleta de cores */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.75rem',
            }}>
              Paleta de Cores
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius)',
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--color-text-secondary)',
                }} />
                <span style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  Primária
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius)',
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: 'var(--color-secondary)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--color-text-secondary)',
                }} />
                <span style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  Secundária
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius)',
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--color-text-secondary)',
                }} />
                <span style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  Acento
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius)',
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: 'var(--color-text)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--color-text-secondary)',
                }} />
                <span style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  Texto
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

ThemePreview.propTypes = {
  previewTheme: PropTypes.object.isRequired,
};

export default ThemePreview;
