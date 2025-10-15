import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Button, Card, Input } from '../components/ui';
import ColorPicker from '../components/admin/ColorPicker';
import ThemePreview from '../components/admin/ThemePreview';
import { API_URL } from '../config/api';

const AdminTheme = () => {
  const { theme: currentTheme, loading, reloadTheme } = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    corPrimaria: '',
    corSecundaria: '',
    corAcento: '',
    corFundo: '',
    corFundoSecundario: '',
    corTexto: '',
    corTextoSecundario: '',
    fontePrimaria: '',
    fonteSecundaria: '',
    borderRadius: '',
    shadowIntensity: 'medium',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPreview, setShowPreview] = useState(false);

  // Carregar tema atual no formulário
  useEffect(() => {
    if (currentTheme) {
      setFormData({
        nome: currentTheme.nome || '',
        corPrimaria: currentTheme.corPrimaria || '',
        corSecundaria: currentTheme.corSecundaria || '',
        corAcento: currentTheme.corAcento || '',
        corFundo: currentTheme.corFundo || '',
        corFundoSecundario: currentTheme.corFundoSecundario || '',
        corTexto: currentTheme.corTexto || '',
        corTextoSecundario: currentTheme.corTextoSecundario || '',
        fontePrimaria: currentTheme.fontePrimaria || '',
        fonteSecundaria: currentTheme.fonteSecundaria || '',
        borderRadius: currentTheme.borderRadius || '',
        shadowIntensity: currentTheme.shadowIntensity || 'medium',
      });
    }
  }, [currentTheme]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar tema');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: 'Tema salvo com sucesso!' });

      // Recarregar tema para aplicar mudanças
      setTimeout(() => {
        reloadTheme();
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Tem certeza que deseja resetar o tema para os valores padrão?')) {
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/theme/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao resetar tema');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: 'Tema resetado com sucesso!' });

      // Recarregar tema
      setTimeout(() => {
        reloadTheme();
      }, 500);
    } catch (error) {
      console.error('Erro ao resetar tema:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
      }}>
        <p style={{ color: 'var(--color-text)' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-background)',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--color-text)',
              marginBottom: '0.5rem',
            }}>
              Customização de Tema
            </h1>
            <p style={{
              fontFamily: 'var(--font-primary)',
              color: 'var(--color-text-secondary)',
            }}>
              Personalize as cores, fontes e estilos do sistema
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ocultar' : 'Mostrar'} Preview
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isSaving}
            >
              Resetar Tema
            </Button>
          </div>
        </div>

        {/* Mensagem de feedback */}
        {message.text && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            borderRadius: 'var(--border-radius)',
            backgroundColor: message.type === 'success'
              ? 'rgba(34, 197, 94, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#22C55E' : '#EF4444'}`,
            color: message.type === 'success' ? '#22C55E' : '#EF4444',
          }}>
            {message.text}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
          gap: '2rem',
        }}>
          {/* Formulário */}
          <div>
            {/* Informações Básicas */}
            <Card title="Informações Básicas" variant="elevated" style={{ marginBottom: '2rem' }}>
              <Input
                label="Nome do Tema"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                fullWidth
                placeholder="Ex: Espeto Music"
              />
            </Card>

            {/* Cores */}
            <Card title="Paleta de Cores" variant="elevated" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <ColorPicker
                  label="Cor Primária"
                  value={formData.corPrimaria}
                  onChange={(color) => handleChange('corPrimaria', color)}
                />
                <ColorPicker
                  label="Cor Secundária"
                  value={formData.corSecundaria}
                  onChange={(color) => handleChange('corSecundaria', color)}
                />
                <ColorPicker
                  label="Cor de Acento"
                  value={formData.corAcento}
                  onChange={(color) => handleChange('corAcento', color)}
                />
                <ColorPicker
                  label="Cor de Fundo"
                  value={formData.corFundo}
                  onChange={(color) => handleChange('corFundo', color)}
                />
                <ColorPicker
                  label="Cor de Fundo Secundário"
                  value={formData.corFundoSecundario}
                  onChange={(color) => handleChange('corFundoSecundario', color)}
                />
                <ColorPicker
                  label="Cor de Texto"
                  value={formData.corTexto}
                  onChange={(color) => handleChange('corTexto', color)}
                />
                <ColorPicker
                  label="Cor de Texto Secundário"
                  value={formData.corTextoSecundario}
                  onChange={(color) => handleChange('corTextoSecundario', color)}
                />
              </div>
            </Card>

            {/* Tipografia */}
            <Card title="Tipografia" variant="elevated" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <Input
                  label="Fonte Primária"
                  value={formData.fontePrimaria}
                  onChange={(e) => handleChange('fontePrimaria', e.target.value)}
                  fullWidth
                  placeholder="Ex: Inter"
                />
                <Input
                  label="Fonte Secundária"
                  value={formData.fonteSecundaria}
                  onChange={(e) => handleChange('fonteSecundaria', e.target.value)}
                  fullWidth
                  placeholder="Ex: Poppins"
                />
              </div>
            </Card>

            {/* Estilos */}
            <Card title="Estilos" variant="elevated" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <Input
                  label="Border Radius"
                  value={formData.borderRadius}
                  onChange={(e) => handleChange('borderRadius', e.target.value)}
                  fullWidth
                  placeholder="Ex: 8px"
                />
                <div>
                  <label style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}>
                    Intensidade das Sombras
                  </label>
                  <select
                    value={formData.shadowIntensity}
                    onChange={(e) => handleChange('shadowIntensity', e.target.value)}
                    style={{
                      fontFamily: 'var(--font-primary)',
                      padding: '0.5rem 1rem',
                      width: '100%',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '2px solid var(--color-text-secondary)',
                      borderRadius: 'var(--border-radius)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="light">Leve</option>
                    <option value="medium">Médio</option>
                    <option value="strong">Forte</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Botão Salvar */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Tema'}
            </Button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div style={{ position: 'sticky', top: '2rem' }}>
              <ThemePreview previewTheme={formData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTheme;
