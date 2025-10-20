import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { joinRoom } from '../services/socket';

const LocacaoContext = createContext();

export const useLocacao = () => {
  const context = useContext(LocacaoContext);
  if (!context) {
    throw new Error('useLocacao deve ser usado dentro de um LocacaoProvider');
  }
  return context;
};

export const LocacaoProvider = ({ children }) => {
  const [locacao, setLocacao] = useState(null);
  const [locacaoId, setLocacaoId] = useState(() => {
    // 🎯 Inicializar com valor do sessionStorage se existir
    return sessionStorage.getItem('locacaoId') || null;
  });

  // 🎯 Sincronizar locacaoId do sessionStorage periodicamente
  useEffect(() => {
    const syncLocacaoId = () => {
      const storedId = sessionStorage.getItem('locacaoId');
      if (storedId !== locacaoId) {
        console.log(`🔄 [LOCAÇÃO CONTEXT] Sincronizando locacaoId: ${storedId || 'null'}`);
        setLocacaoId(storedId);
      }
    };

    // Verificar a cada 500ms se sessionStorage mudou
    const interval = setInterval(syncLocacaoId, 500);

    // Verificar imediatamente também
    syncLocacaoId();

    return () => clearInterval(interval);
  }, [locacaoId]);

  // 🎯 Entrar na room quando locacaoId mudar
  useEffect(() => {
    if (locacaoId) {
      console.log(`🎯 [LOCAÇÃO CONTEXT] Entrando na room da locação: ${locacaoId}`);
      joinRoom(locacaoId).then(() => {
        console.log(`✅ [LOCAÇÃO CONTEXT] Conectado à room da locação`);
      });
    } else {
      // Sem locação = room global
      console.log('🌐 [LOCAÇÃO CONTEXT] Entrando na room global');
      joinRoom(null).then(() => {
        console.log('✅ [LOCAÇÃO CONTEXT] Conectado à room global');
      });
    }
  }, [locacaoId]);

  const carregarLocacao = async (slug) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/public/locacao/${slug}`);

      if (response.data.sucesso) {
        setLocacao(response.data.locacao);
        setLocacaoId(response.data.locacao.id);

        // Armazenar no sessionStorage
        sessionStorage.setItem('locacaoId', response.data.locacao.id);
        sessionStorage.setItem('locacaoSlug', slug);
      }
    } catch (error) {
      console.error('Erro ao carregar locação:', error);
    }
  };

  const limparLocacao = () => {
    setLocacao(null);
    setLocacaoId(null);
    sessionStorage.removeItem('locacaoId');
    sessionStorage.removeItem('locacaoSlug');
  };

  return (
    <LocacaoContext.Provider
      value={{
        locacao,
        locacaoId,
        setLocacao: carregarLocacao,
        limparLocacao,
      }}
    >
      {children}
    </LocacaoContext.Provider>
  );
};

// Interceptor do Axios para adicionar locacaoId automaticamente
export const setupLocacaoInterceptor = () => {
  axios.interceptors.request.use(
    (config) => {
      const locacaoId = sessionStorage.getItem('locacaoId');

      // 🎯 LOG: Rastrear locacaoId em todas as requisições
      console.log('\n🌐 [AXIOS INTERCEPTOR] ═══════════════════════════════════');
      console.log(`📍 URL: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`🏢 locacaoId (sessionStorage): "${locacaoId || 'null (global)'}"`);

      if (locacaoId) {
        // Adicionar locacaoId no body para POST/PUT
        if (config.method === 'post' || config.method === 'put') {
          if (config.data) {
            config.data = {
              ...config.data,
              locacaoId,
            };
          } else {
            config.data = { locacaoId };
          }
          console.log(`✅ locacaoId adicionado ao body`);
        }

        // Adicionar locacaoId como query param para GET/DELETE
        if (config.method === 'get' || config.method === 'delete') {
          config.params = {
            ...config.params,
            locacaoId,
          };
          console.log(`✅ locacaoId adicionado aos query params`);
        }

        // Adicionar header customizado
        config.headers['X-Locacao-Id'] = locacaoId;
        console.log(`✅ locacaoId adicionado ao header X-Locacao-Id`);
      } else {
        console.log(`ℹ️  Requisição GLOBAL (sem locacaoId)`);
      }
      console.log('═══════════════════════════════════════════════════════\n');

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};
