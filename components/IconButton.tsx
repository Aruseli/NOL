'use client';

interface IconButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  props?: any;
}

export const IconButton = ({
  icon,
  ariaLabel,
  onClick,
  className,
  type = 'button',
  disabled,
  props
}: IconButtonProps) => {

  return (
    <button
      type={type}
      className={`cursor-pointer relative ${className || 'border-none rounded-xl'}`}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
};
