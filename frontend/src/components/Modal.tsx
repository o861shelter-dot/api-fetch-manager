import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';

/**
 * Modal ([UI] 4.2): nút X đóng; CLICK NGOÀI KHÔNG ĐÓNG; ESC đóng; tự scroll (max-height 90vh);
 * trap focus. Là nền tảng cho MỌI thông báo & form.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
  variant,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  variant?: 'notify' | 'error' | 'success' | 'warning' | 'info' | 'confirm';
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') trapFocus(e, modalRef.current);
    };
    document.addEventListener('keydown', onKey);
    // focus phần tử đầu
    setTimeout(() => modalRef.current?.querySelector<HTMLElement>('button, input, textarea, select')?.focus(), 0);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const modalCls = ['modal'];
  if (wide) modalCls.push('modal--wide');
  if (variant === 'notify' || ['error', 'success', 'warning', 'info'].includes(variant ?? ''))
    modalCls.push('modal--notify');
  if (variant) modalCls.push(`modal--${variant}`);

  return (
    <div
      className="overlay"
      // CLICK NGOÀI KHÔNG ĐÓNG: chỉ chặn, không gọi onClose.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.stopPropagation();
      }}
    >
      <div className={modalCls.join(' ')} role="dialog" aria-modal="true" ref={modalRef}>
        <header className="modal__head">
          <h3 className="modal__title">{title}</h3>
          <button className="btn btn--ghost btn--icon modal__close" data-tooltip="Đóng cửa sổ này (không lưu thay đổi)" aria-label="Đóng" onClick={onClose}>
            {Icon.x({})}
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
