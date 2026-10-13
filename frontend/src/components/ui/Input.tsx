import React from 'react';

export interface UnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const UnderlineInput: React.FC<UnderlineInputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col space-y-1">
      {label && (
        <label htmlFor={inputId} className="text-xs uppercase tracking-wider font-mono text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-underline w-full text-sm font-sans placeholder:text-muted/60 focus:border-forest transition-colors ${error ? 'border-risk' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-risk font-mono mt-1">{error}</span>}
    </div>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col space-y-1">
      {label && (
        <label htmlFor={selectId} className="text-xs uppercase tracking-wider font-mono text-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`bg-white border border-border rounded-card px-3 py-2 text-sm text-body font-sans focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: string | number;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  valueDisplay,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col space-y-1.5">
      {(label || valueDisplay !== undefined) && (
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          {label && <span>{label}</span>}
          {valueDisplay !== undefined && <span className="text-forest font-semibold">{valueDisplay}</span>}
        </div>
      )}
      <input
        type="range"
        className={`w-full accent-forest h-1.5 bg-panel rounded-full cursor-pointer ${className}`}
        {...props}
      />
    </div>
  );
};

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <label className={`inline-flex items-center gap-2.5 cursor-pointer ${className}`}>
      <div
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 border ${checked ? 'bg-forest border-forest' : 'bg-panel border-border'}`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </div>
      {label && <span className="text-xs font-sans text-body">{label}</span>}
    </label>
  );
};
