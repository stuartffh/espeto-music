import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext.jsx';

function Pagamento() {
  const { status } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const { theme } = useConfig();

  const mensagens = {
    sucesso: {
      titulo: '✅ Pagamento Aprovado!',
      texto: 'Sua música foi adicionada à fila. Obrigado!',
      painel: 'border-green-500 text-green-700 bg-green-50',
      destaque: 'text-green-700',
    },
    pendente: {
      titulo: '⏳ Pagamento Pendente',
      texto: 'Aguardando confirmação do pagamento...',
      painel: 'border-yellow-400 text-yellow-700 bg-yellow-50',
      destaque: 'text-yellow-700',
    },
    falha: {
      titulo: '❌ Pagamento Recusado',
      texto: 'Não foi possível processar o pagamento. Tente novamente.',
      painel: 'border-red-500 text-red-700 bg-red-50',
      destaque: 'text-red-700',
    },
  };

  const msg = mensagens[status] || mensagens.falha;

  return (
    <div className="min-h-screen theme-gradient-bg flex items-center justify-center p-4 transition-colors">
      <div className={`theme-card border-l-4 ${msg.painel} rounded-lg shadow-2xl p-8 max-w-md w-full text-center`}> 
        <h1 className={`text-3xl font-bold mb-3 ${msg.destaque}`}>{msg.titulo}</h1>
        <p className="text-lg mb-6">{msg.texto}</p>
        <p className="text-sm text-gray-600">Redirecionando em 5 segundos...</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 btn-primary rounded-lg font-semibold shadow hover:opacity-90"
          style={{ background: theme?.primary, color: theme?.onPrimary }}
        >
          Voltar Agora
        </button>
      </div>
    </div>
  );
}

export default Pagamento;
