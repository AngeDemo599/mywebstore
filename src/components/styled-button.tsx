import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { playClick } from '@/lib/sounds';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface BaseProps {
  variant?: ButtonVariant | 'dark' | 'light';
  size?: ButtonSize;
  icon?: React.ReactNode;
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

interface ButtonOwnProps extends BaseProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

interface LinkOwnProps extends BaseProps {
  href: string;
}

type StyledButtonProps = ButtonOwnProps | LinkOwnProps;

export const StyledButton: React.FC<StyledButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  isLoading = false,
  ...props
}) => {
  // Map legacy 'dark'/'light' to new design system names
  const activeVariant = variant === 'dark' ? 'primary' : variant === 'light' ? 'secondary' : variant;

  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 select-none rounded-xl";

  const variants: Record<ButtonVariant, string> = {
    primary: `
      bg-[#2c2c2c] bg-gradient-to-b from-[#3a3a3a] to-[#262626]
      text-white border border-black
      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)]
      hover:from-[#404040] hover:to-[#2b2b2b]
      focus:ring-neutral-600
    `,
    secondary: `
      bg-d-surface text-d-text border border-d-border
      shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]
      hover:bg-d-hover-bg hover:text-d-text hover:border-d-input-border
      focus:ring-d-border
    `,
    outline: `
      bg-transparent text-d-text border border-d-border
      hover:bg-d-hover-bg hover:text-d-text hover:border-d-input-border
      focus:ring-d-border
      shadow-sm
    `,
    ghost: `
      bg-transparent text-d-text-sub border border-transparent
      hover:bg-d-hover-bg hover:text-d-text
      focus:ring-d-border
    `,
    danger: `
      bg-red-600 bg-gradient-to-b from-red-500 to-red-600
      text-white border border-red-800
      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_2px_4px_rgba(220,38,38,0.2)]
      hover:from-red-400 hover:to-red-500
      focus:ring-red-500
    `,
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-[15px] gap-2.5",
    lg: "px-6 py-3.5 text-base gap-3",
    icon: "p-2.5 w-10 h-10 justify-center",
  };

  const currentVariantStyle = variants[activeVariant as ButtonVariant] || variants.primary;
  const currentSizeStyle = sizes[size];
  const combinedClassName = `${baseStyles} ${currentVariantStyle} ${currentSizeStyle} ${className}`;

  const iconColor = activeVariant === 'primary' || activeVariant === 'danger' ? 'text-white/90' : 'text-current';

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin opacity-70" />
      ) : icon ? (
        <span className={iconColor}>{icon}</span>
      ) : null}
      {children && size !== 'icon' && <span>{children}</span>}
    </>
  );

  if ('href' in props && props.href) {
    const { href, ...rest } = props as LinkOwnProps;
    return (
      <Link href={href} className={combinedClassName} {...rest}>
        {content}
      </Link>
    );
  }

  const { disabled, onClick, ...buttonProps } = props as ButtonOwnProps;
  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      onClick={(e) => {
        playClick();
        onClick?.(e);
      }}
      {...buttonProps}
    >
      {content}
    </button>
  );
};
