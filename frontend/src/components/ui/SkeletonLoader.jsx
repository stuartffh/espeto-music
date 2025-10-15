import clsx from 'clsx';

export default function SkeletonLoader({ variant = 'rect', count = 1, className = '' }) {
  const variants = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    circle: 'h-12 w-12 rounded-full',
    rect: 'h-24 w-full',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'skeleton rounded-lg',
            variants[variant],
            className
          )}
        />
      ))}
    </>
  );
}
