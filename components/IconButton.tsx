'use client';

interface IconButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  props?: any;
}

export const IconButton = ({
  icon,
  ariaLabel,
  onClick,
  className,
  props
}: IconButtonProps) => {

  return (
    <button
      className={`cursor-pointer relative ${className || 'border-none rounded-xl'}`}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  );
};
