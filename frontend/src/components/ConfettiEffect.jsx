import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export default function ConfettiEffect({ show, onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      // Gerar 50 partículas com posições e cores aleatórias
      const newParticles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        color: ['#00f5ff', '#b300ff', '#ff006e', '#00ff9f', '#ffea00'][Math.floor(Math.random() * 5)],
        x: Math.random() * 600 - 300,
        y: Math.random() * 600 - 300,
        rotate: Math.random() * 360,
      }));
      setParticles(newParticles);

      // Auto-cleanup após 2s
      const timeout = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: particle.color }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: particle.x,
                y: particle.y,
                rotate: particle.rotate,
                opacity: 0,
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
