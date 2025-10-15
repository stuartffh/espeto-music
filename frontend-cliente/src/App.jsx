import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './hooks/useTheme';
import { Button, Card, Input, Modal } from './components/ui';

// Componente de demonstração que usa o tema
function DemoContent() {
  const { theme, loading, error } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)'
      }}>
        <p>Carregando tema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        color: '#F8FAFC'
      }}>
        <p>Erro ao carregar tema: {error}</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-background)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <header style={{
          marginBottom: '3rem',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            marginBottom: '0.5rem',
          }}>
            {theme?.nome || 'Espeto Music'}
          </h1>
          <p style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '1.25rem',
            color: 'var(--color-text-secondary)',
          }}>
            Sistema de Temas Customizável
          </p>
        </header>

        {/* Grid de Demos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Card com botões */}
          <Card title="Botões" variant="elevated">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant="primary" fullWidth>
                Primary Button
              </Button>
              <Button variant="secondary" fullWidth>
                Secondary Button
              </Button>
              <Button variant="accent" fullWidth>
                Accent Button
              </Button>
              <Button variant="outline" fullWidth>
                Outline Button
              </Button>
              <Button variant="ghost" fullWidth>
                Ghost Button
              </Button>
            </div>
          </Card>

          {/* Card com inputs */}
          <Card title="Inputs" variant="elevated">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Nome"
                placeholder="Digite seu nome"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                fullWidth
              />
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                required
                fullWidth
              />
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                error="Senha muito curta"
                fullWidth
              />
            </div>
          </Card>

          {/* Card com modal */}
          <Card title="Modal" variant="elevated">
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
              Clique no botão para abrir um modal de exemplo.
            </p>
            <Button variant="primary" fullWidth onClick={() => setModalOpen(true)}>
              Abrir Modal
            </Button>
          </Card>
        </div>

        {/* Cards com variantes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
        }}>
          <Card title="Card Default" variant="default">
            <p>Este é um card com variante default (sem sombra ou borda).</p>
          </Card>

          <Card title="Card Elevated" variant="elevated" hoverable>
            <p>Este é um card elevated com efeito hover.</p>
          </Card>

          <Card title="Card Outlined" variant="outlined">
            <p>Este é um card com borda outline.</p>
          </Card>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Exemplo de Modal"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirmar
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: '1rem' }}>
          Este é um modal de exemplo usando o sistema de temas.
        </p>
        <p>
          Todos os componentes respondem às configurações de tema definidas no backend.
        </p>
      </Modal>
    </div>
  );
}

// App principal com ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <DemoContent />
    </ThemeProvider>
  );
}

export default App;
