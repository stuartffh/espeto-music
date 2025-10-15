import { motion } from 'framer-motion';

export default function EqualizerAnimation() {
  const bars = [
    { duration: 0.6, heights: [10, 40, 20, 50, 30, 15, 45] },
    { duration: 0.7, heights: [30, 15, 45, 20, 50, 25, 35] },
    { duration: 0.8, heights: [20, 50, 30, 40, 15, 45, 25] },
    { duration: 0.65, heights: [45, 25, 35, 50, 20, 30, 40] },
    { duration: 0.75, heights: [35, 45, 15, 30, 40, 50, 20] },
  ];

  return (
    <div className="flex items-center gap-1 h-8">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          className="w-1 bg-gradient-to-t from-neon-cyan to-neon-purple rounded-full"
          animate={{
            height: bar.heights.map(h => `${h}%`),
          }}
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
