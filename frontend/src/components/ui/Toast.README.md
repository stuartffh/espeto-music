# 🍞 Toast Component

Sistema de notificações toast moderno e responsivo para o Espeto Music.

## 📋 Características

- ✅ **4 tipos de notificação**: success, error, warning, info
- ✅ **Animações suaves** com Framer Motion
- ✅ **Barra de progresso** automática
- ✅ **Auto-dismiss** configurável
- ✅ **Botão de fechar** manual
- ✅ **Responsivo** para mobile
- ✅ **Glassmorphism** design
- ✅ **Posição fixa** no topo da tela

## 🎨 Tipos Disponíveis

### Success (Verde)
```jsx
showToast('Música adicionada com sucesso! 🎵', 'success');
```

### Error (Vermelho)
```jsx
showToast('Erro ao processar pedido', 'error');
```

### Warning (Amarelo)
```jsx
showToast('Atenção: Fila quase cheia!', 'warning');
```

### Info (Azul)
```jsx
showToast('Carregando informações...', 'info');
```

## 📦 Como Usar

### 1. Importar o hook
```jsx
import { useToast } from '../../hooks/useToast';
```

### 2. Inicializar no componente
```jsx
function MeuComponente() {
  const { toast, showToast, hideToast } = useToast();

  // ...
}
```

### 3. Mostrar toast
```jsx
// Sucesso
showToast('Operação realizada!', 'success');

// Erro
showToast('Algo deu errado', 'error');

// Com emoji
showToast('Música adicionada! 🎵', 'success');
```

### 4. Adicionar o componente Toast no JSX
```jsx
return (
  <div>
    {/* Seu conteúdo */}

    <Toast
      message={toast.message}
      type={toast.type}
      isOpen={toast.isOpen}
      onClose={hideToast}
    />
  </div>
);
```

## ⚙️ Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `message` | string | - | Mensagem a ser exibida |
| `type` | string | 'info' | Tipo: 'success', 'error', 'warning', 'info' |
| `isOpen` | boolean | false | Controla visibilidade |
| `onClose` | function | - | Callback ao fechar |
| `duration` | number | 3000 | Tempo em ms (0 = não fecha) |

## 🎯 Exemplos Práticos

### Sucesso ao adicionar música
```jsx
const handleAddMusic = async () => {
  try {
    await addMusicToQueue(music);
    showToast('Música adicionada à fila! 🎵', 'success');
  } catch (error) {
    showToast('Erro ao adicionar música', 'error');
  }
};
```

### Erro de validação
```jsx
if (!nomeCliente.trim()) {
  showToast('Por favor, digite seu nome', 'warning');
  return;
}
```

### Informação
```jsx
showToast('Buscando músicas...', 'info');
```

## 🎨 Customização

### Mudar duração
```jsx
// Toast que fecha em 5 segundos
<Toast duration={5000} {...toast} />

// Toast que não fecha automaticamente
<Toast duration={0} {...toast} />
```

### Posição
O toast está fixo no topo central da tela, mas pode ser modificado no componente:

```jsx
// Mudar para bottom
className="fixed bottom-4 left-1/2 ..."

// Mudar para canto superior direito
className="fixed top-4 right-4 ..."
```

## 🔧 Estrutura de Arquivos

```
frontend/src/
├── components/ui/
│   └── Toast.jsx          # Componente Toast
└── hooks/
    └── useToast.js        # Hook customizado
```

## 📱 Responsividade

- **Mobile**: Largura de `calc(100% - 2rem)` com margem lateral
- **Desktop**: Largura máxima de `28rem` (448px)
- Fonte adaptável: `text-sm sm:text-base`

## 🎭 Animações

- **Entrada**: Slide down + fade in + scale
- **Saída**: Slide up + fade out + scale
- **Progresso**: Barra animada com gradient

## 💡 Dicas

1. **Use emojis** para tornar as mensagens mais amigáveis
2. **Seja breve** - mensagens curtas são mais eficazes
3. **Use o tipo correto** - success para sucesso, error para erro
4. **Evite múltiplos toasts** simultâneos - o hook gerencia um por vez
