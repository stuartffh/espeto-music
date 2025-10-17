import { useTenant as useTenantContext } from '../contexts/TenantContext';

/**
 * Hook para acessar dados do tenant (estabelecimento) atual
 *
 * Detecta automaticamente o tenant através de:
 * - Parâmetro :slug na URL (/:slug/...)
 * - Query parameter ?codigo=ABC123
 * - localStorage (para TV/Admin após autenticação)
 *
 * @returns {Object} Dados e funções do tenant
 * @property {string|null} slug - Slug do estabelecimento na URL
 * @property {string|null} codigo - Código do estabelecimento
 * @property {number|null} estabelecimentoId - ID do estabelecimento no banco
 * @property {string|null} nome - Nome do estabelecimento
 * @property {boolean} isLoading - Indica se está carregando dados do tenant
 * @property {boolean} hasTenant - Indica se existe um tenant identificado
 * @property {Function} setTenantData - Define dados do tenant (após autenticação)
 * @property {Function} clearTenantData - Limpa dados do tenant (logout)
 *
 * @example
 * // Em qualquer componente da aplicação:
 * function MeuComponente() {
 *   const { slug, estabelecimentoId, hasTenant, setTenantData } = useTenant();
 *
 *   // Usar slug na URL da API
 *   const url = `/api/musicas?slug=${slug}`;
 *
 *   // Verificar se tem tenant antes de fazer operações
 *   if (!hasTenant) {
 *     return <div>Estabelecimento não identificado</div>;
 *   }
 *
 *   // Após autenticação, salvar dados do tenant
 *   const handleLogin = async () => {
 *     const response = await api.post('/auth/login', { ... });
 *     setTenantData({
 *       estabelecimentoId: response.data.estabelecimentoId,
 *       nome: response.data.nome,
 *     });
 *   };
 *
 *   return <div>Bem-vindo ao {nome || slug}</div>;
 * }
 */
export function useTenant() {
  return useTenantContext();
}

export default useTenant;
