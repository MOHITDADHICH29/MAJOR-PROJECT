import React from 'react';

interface VerticalBarsProps {
  className?: string;
  count?: number;
  bars?: number;
  color?: string;
}

export const VerticalBars: React.FC<VerticalBarsProps> = ({
  className = '',
  count,
  bars,
  color = '#1F4D45'
}) => {
  const n = bars || count || 5;
  return (
    <div className={`vertical-bars-divider ${className}`} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ backgroundColor: color }} />
      ))}
    </div>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  align = 'left',
  className = ''
}) => {
  const alignClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <div className={`flex flex-col space-y-2.5 ${alignClasses[align]} ${className}`}>
      {eyebrow && (
        <span className="text-xs uppercase tracking-widest font-mono text-muted font-semibold">
          {eyebrow}
        </span>
      )}
      <div className="flex items-center gap-3">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest tracking-tight font-medium">
          {title}
        </h2>
        <VerticalBars />
      </div>
      {subtitle && (
        <p className="text-sm sm:text-base text-body-light font-sans max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
