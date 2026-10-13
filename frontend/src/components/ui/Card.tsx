import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'mint' | 'panel' | 'deep' | 'alt';
  hoverable?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'white',
  hoverable = false,
  padded = true,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    white: 'bg-white border border-border text-body',
    mint: 'bg-panel-light border border-border text-body',
    panel: 'bg-panel border border-border text-body',
    alt: 'bg-panel-alt border border-border text-body',
    deep: 'bg-deep text-white border-transparent',
  };

  const hoverStyle = hoverable ? 'transition-all duration-200 hover:border-forest hover:shadow-card-hover' : '';
  const paddingStyle = padded ? 'p-5 sm:p-6' : '';

  return (
    <div
      className={`rounded-card ${variantStyles[variant]} ${hoverStyle} ${paddingStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  value: string | number;
  label: string;
  sublabel?: string;
  trend?: string;
  variant?: 'alt' | 'mint' | 'white' | 'deep';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  sublabel,
  trend,
  variant = 'alt',
  className = ''
}) => {
  const variantStyles = {
    alt: 'bg-panel-alt border-border text-forest',
    mint: 'bg-panel-light border-border text-forest',
    white: 'bg-white border-border text-forest',
    deep: 'bg-deep text-white border-transparent',
  };

  return (
    <div className={`p-5 sm:p-6 rounded-card border ${variantStyles[variant]} flex flex-col justify-between ${className}`}>
      <span className="text-xs uppercase tracking-wider font-mono text-muted font-semibold">
        {label}
      </span>
      <div className="my-2">
        <span className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold tracking-tight">
          {value}
        </span>
      </div>
      {(sublabel || trend) && (
        <div className="flex items-center justify-between text-xs font-sans text-muted">
          <span>{sublabel}</span>
          {trend && <span className="font-mono font-medium text-healthy">{trend}</span>}
        </div>
      )}
    </div>
  );
};

interface BadgeProps {
  variant?: 'healthy' | 'mri' | 'warning' | 'risk' | 'neutral' | 'mint' | 'forest';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  children,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  const variantStyles = {
    healthy: 'bg-healthy-light text-healthy border border-healthy/30',
    mri: 'bg-mri-light text-mri border border-mri/30',
    warning: 'bg-warning-light text-warning border border-warning/30',
    risk: 'bg-risk-light text-risk border border-risk/30',
    neutral: 'bg-white text-muted border border-border',
    mint: 'bg-panel-light text-forest border border-border',
    forest: 'bg-forest text-white border-transparent',
  };

  return (
    <span className={`inline-flex items-center font-mono font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
