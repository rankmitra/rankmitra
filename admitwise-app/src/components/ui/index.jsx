/**
 * ui/index.jsx
 * Shared, minimal UI primitives used across the app.
 * Design language: Apple clarity + Stripe professionalism.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, disabled, hint, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}

          {(label === 'Category' || label === 'Quota' || label === 'Gender') && (
            <span className="
              w-4 h-4
              rounded-full
              border border-gray-300
              text-gray-400
              text-[10px]
              flex items-center justify-center
              cursor-pointer
              hover:bg-gray-100
            ">
              ⓘ
            </span>
          )}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5 text-sm rounded-xl border bg-white
          text-gray-900 font-medium
          border-gray-200 hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150
          appearance-none cursor-pointer
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")]
          bg-no-repeat bg-[right_12px_center]
        `}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────
export function TextInput({ label, value, onChange, placeholder, hint, type = 'text', className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full px-3 py-2.5 text-sm rounded-xl border bg-white
          text-gray-900 font-medium
          border-gray-200 hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-150
          placeholder:text-gray-300 placeholder:font-normal
        "
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, loading, className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1';

  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-900 disabled:opacity-40',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, bg, text, border, size = 'sm' }) {
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${bg} ${text} ${border} ${sizes[size]}`}>
      {label}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ message = 'Loading…', size = 'md' }) {
  const sizes = { sm: 16, md: 22, lg: 32 };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <Loader2 size={sizes[size]} className="animate-spin text-gray-300" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {Icon && <Icon size={32} className="text-gray-200" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400 max-w-xs">{description}</p>}
    </div>
  );
}

// ─── SectionDivider ──────────────────────────────────────────────────────────
export function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      {label && <span className="text-xs text-gray-400 font-medium">{label}</span>}
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── Toggle Pill ─────────────────────────────────────────────────────────────
export function TogglePill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer
        ${active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }
      `}
    >
      {label}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}
