import { create } from 'zustand';

const useStore = create((set) => ({
  musicaAtual: null,
  fila: [],
  carregando: false,

  setMusicaAtual: (musica) => set({ musicaAtual: musica }),
  setFila: (fila) => set({ fila }),
  setCarregando: (carregando) => set({ carregando }),

  atualizarEstado: (musicaAtual, fila) => set({ musicaAtual, fila }),
}));

export default useStore;
