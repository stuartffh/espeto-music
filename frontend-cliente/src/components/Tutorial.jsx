import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Search, CreditCard, CheckCircle } from 'lucide-react';
import Button from './ui/Button';

const steps = [
  {
    icon: Search,
    title: 'Busque sua Música',
    description: 'Digite o nome da música ou artista que você quer ouvir',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Music,
    title: 'Escolha e Pague',
    description: 'Selecione a música desejada e clique em "Pagar pra Tocar"',
    color: 'from-pink-500 to-red-500'
  },
  {
    icon: CreditCard,
    title: 'Pagamento PIX',
    description: 'Escaneie o QR Code ou copie o código PIX para pagar',
    color: 'from-red-500 to-orange-500'
  },
  {
    icon: CheckCircle,
    title: 'Aguarde na Fila',
    description: 'Após o pagamento, sua música entrará na fila automaticamente',
    color: 'from-orange-500 to-yellow-500'
  }
];

export default function Tutorial({ onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Verificar se o tutorial já foi visto
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (tutorialCompleted) {
      setIsVisible(false);
      if (onComplete) onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-gradient-to-br from-dark-card to-dark-bg border border-neon-purple/20 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Botão Fechar */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Conteúdo */}
          <div className="p-8">
            {/* Ícone com Gradiente */}
            <motion.div
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-10 h-10 text-white" />
            </motion.div>

            {/* Título */}
            <motion.h2
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-center text-white mb-3"
            >
              {step.title}
            </motion.h2>

            {/* Descrição */}
            <motion.p
              key={`desc-${currentStep}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center text-gray-300 mb-8"
            >
              {step.description}
            </motion.p>

            {/* Indicadores de Progresso */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={false}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1,
                    opacity: index === currentStep ? 1 : 0.3
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? `w-8 bg-gradient-to-r ${step.color}`
                      : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Botões de Navegação */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  onClick={handlePrevious}
                  variant="secondary"
                  className="flex-1"
                >
                  Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                variant="primary"
                className={`flex-1 ${currentStep === 0 ? 'w-full' : ''}`}
              >
                {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
              </Button>
            </div>

            {/* Botão Pular */}
            {currentStep < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Pular Tutorial
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
