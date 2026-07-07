import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icon } from './Icon';

/**
 * UI feedback system ([UI] 4.3, 4.4): thay THẾ HOÀN TOÀN alert/confirm/prompt.
 * Cung cấp notify() và confirm() qua context.
 */

type NotifyKind = 'success' | 'error' | 'warning' | 'info';
interface NotifyOpts {
  title: string;
  message: React.ReactNode;
  kind?: NotifyKind;
}
interface ConfirmOpts {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface UICtx {
  notify: (o: NotifyOpts) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
}

const Ctx = createContext<UICtx | null>(null);
export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI phải nằm trong <UIProvider>');
  return c;
};

const kindIcon: Record<NotifyKind, React.ReactNode> = {
  success: <span className="notify-icon">{Icon.check({ size: 20 })}</span>,
  error: <span className="notify-icon">{Icon.alert({ size: 20 })}</span>,
  warning: <span className="notify-icon">{Icon.alert({ size: 20 })}</span>,
  info: <span className="notify-icon">{Icon.info({ size: 20 })}</span>,
};

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [notifyState, setNotifyState] = useState<NotifyOpts | null>(null);
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);

  const notify = useCallback((o: NotifyOpts) => setNotifyState(o), []);
  const confirm = useCallback(
    (o: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ ...o, resolve })),
    [],
  );

  return (
    <Ctx.Provider value={{ notify, confirm }}>
      {children}
      {notifyState && (
        <Modal
          title={notifyState.title}
          variant={notifyState.kind ?? 'info'}
          onClose={() => setNotifyState(null)}
          footer={<Button variant="primary" icon={Icon.check({})} tooltip="Đóng thông báo và tiếp tục" onClick={() => setNotifyState(null)}>Đã hiểu</Button>}
        >
          {kindIcon[notifyState.kind ?? 'info']}
          <div>{notifyState.message}</div>
        </Modal>
      )}
      {confirmState && (
        <Modal
          title={confirmState.title}
          variant="confirm"
          onClose={() => {
            confirmState.resolve(false);
            setConfirmState(null);
          }}
          footer={
            <>
              <Button
                variant="ghost"
                icon={Icon.x({})}
                tooltip="Hủy thao tác, không thực hiện gì"
                onClick={() => {
                  confirmState.resolve(false);
                  setConfirmState(null);
                }}
              >
                {confirmState.cancelLabel ?? 'Hủy'}
              </Button>
              <Button
                variant={confirmState.danger ? 'danger' : 'primary'}
                icon={Icon.check({})}
                tooltip="Xác nhận và thực hiện thao tác này"
                onClick={() => {
                  confirmState.resolve(true);
                  setConfirmState(null);
                }}
              >
                {confirmState.confirmLabel ?? 'Xác nhận'}
              </Button>
            </>
          }
        >
          {confirmState.message}
        </Modal>
      )}
    </Ctx.Provider>
  );
}
