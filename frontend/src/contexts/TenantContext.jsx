import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const TenantContext = createContext();

/**
 * TenantProvider - Provê contexto multi-tenant para toda a aplicação
 *
 * Detecta o tenant (estabelecimento) através de:
 * 1. Parâmetro :slug na URL (/:slug/...)
 * 2. Query parameter ?codigo=ABC123
 * 3. localStorage (para TV e Admin após autenticação)
 *
 * Fornece:
 * - slug: identificador do estabelecimento na URL
 * - codigo: código do estabelecimento (se disponível)
 * - estabelecimentoId: ID do estabelecimento (após autenticação)
 * - isLoading: indicador de carregamento
 * - setTenantData: função para definir dados do tenant
 */
export function TenantProvider({ children }) {
  const params = useParams();
  const location = useLocation();

  // Estado do tenant
  const [tenantData, setTenantDataState] = useState(() => {
    // Tentar recuperar do localStorage (para TV/Admin)
    const saved = localStorage.getItem('tenantData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao parsear tenantData do localStorage:', e);
      }
    }
    return {
      slug: null,
      codigo: null,
      estabelecimentoId: null,
      nome: null,
      isLoading: true,
    };
  });

  // Atualizar tenant quando URL mudar
  useEffect(() => {
    const urlSlug = params.slug;

    // Extrair código do query parameter
    const searchParams = new URLSearchParams(location.search);
    const queryCodigo = searchParams.get('codigo');

    // Se temos um slug na URL, atualizar
    if (urlSlug) {
      setTenantDataState(prev => ({
        ...prev,
        slug: urlSlug,
        codigo: queryCodigo || prev.codigo,
        isLoading: false,
      }));
    } else if (queryCodigo) {
      // Se não tem slug mas tem código, usar código
      setTenantDataState(prev => ({
        ...prev,
        codigo: queryCodigo,
        isLoading: false,
      }));
    } else {
      // Sem slug nem código - manter estado anterior ou marcar como não carregando
      setTenantDataState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [params.slug, location.search]);

  // Salvar no localStorage quando tenant mudar (para persistência)
  useEffect(() => {
    if (tenantData.slug || tenantData.codigo || tenantData.estabelecimentoId) {
      localStorage.setItem('tenantData', JSON.stringify(tenantData));
    }
  }, [tenantData]);

  // Função para atualizar dados do tenant (chamada após autenticação)
  const setTenantData = (data) => {
    setTenantDataState(prev => ({
      ...prev,
      ...data,
      isLoading: false,
    }));
  };

  // Função para limpar dados do tenant (logout)
  const clearTenantData = () => {
    localStorage.removeItem('tenantData');
    setTenantDataState({
      slug: params.slug || null,
      codigo: null,
      estabelecimentoId: null,
      nome: null,
      isLoading: false,
    });
  };

  const value = {
    // Dados do tenant
    slug: tenantData.slug,
    codigo: tenantData.codigo,
    estabelecimentoId: tenantData.estabelecimentoId,
    nome: tenantData.nome,

    // Estado
    isLoading: tenantData.isLoading,
    hasTenant: !!(tenantData.slug || tenantData.codigo || tenantData.estabelecimentoId),

    // Funções
    setTenantData,
    clearTenantData,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do tenant
 *
 * @returns {Object} Contexto do tenant
 * @throws {Error} Se usado fora do TenantProvider
 *
 * @example
 * const { slug, estabelecimentoId, hasTenant } = useTenant();
 */
export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
