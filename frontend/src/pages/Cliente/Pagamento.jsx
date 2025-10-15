import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Pagamento() {
  const { status } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const mensagens = {
    sucesso: {
      titulo: '✅ Pagamento Aprovado!',
      texto: 'Sua música foi adicionada à fila. Obrigado!',
      cor: 'bg-green-500',
    },
    pendente: {
      titulo: '⏳ Pagamento Pendente',
      texto: 'Aguardando confirmação do pagamento...',
      cor: 'bg-yellow-500',
    },
    falha: {
      titulo: '❌ Pagamento Recusado',
      texto: 'Não foi possível processar o pagamento. Tente novamente.',
      cor: 'bg-red-500',
    },
  };

  const msg = mensagens[status] || mensagens.falha;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className={`${msg.cor} rounded-lg shadow-2xl p-8 max-w-md w-full text-white text-center`}>
        <h1 className="text-4xl font-bold mb-4">{msg.titulo}</h1>
        <p className="text-xl mb-6">{msg.texto}</p>
        <p className="text-sm opacity-90">Redirecionando em 5 segundos...</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100"
        >
          Voltar Agora
        </button>
      </div>
    </div>
  );
}

export default Pagamento;
