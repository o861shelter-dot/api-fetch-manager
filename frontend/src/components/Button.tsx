import React from 'react';

/** Button ([UI] 4.1): LUÔN icon + tooltip. */
export function Button({
  children,
  icon,
  tooltip,
  variant = 'default',
  loading,
  iconOnly,
  ...rest
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  tooltip: string; // BẮT BUỘC: mô tả chức năng + kết quả
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  loading?: boolean;
  iconOnly?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = ['btn'];
  if (variant === 'primary') cls.push('btn--primary');
  if (variant === 'danger') cls.push('btn--danger');
  if (variant === 'ghost') cls.push('btn--ghost');
  if (iconOnly) cls.push('btn--icon');
  return (
    <button className={cls.join(' ')} data-tooltip={tooltip} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="btn__spinner" /> : icon}
      {!iconOnly && children ? <span>{children}</span> : null}
    </button>
  );
}
