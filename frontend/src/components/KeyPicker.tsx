import React, { useEffect, useState } from 'react';
import { api, type CredentialMasked } from '../api/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Field, Textarea } from './Field';
import { Icon } from './Icon';
import { useUI } from './ui';

/**
 * KeyPicker ([UI] addendum v1.2 §4 + B3 — key trùng resolve đúng):
 * liệt kê TỪNG credential của owner (label + masked + credId), chèn placeholder {{key}}
 * vào input và báo credId đã chọn để builder ghi vào credentialRefs.
 * Có ô advanced JS (sandbox) áp trước khi chèn, và nút xem giá trị resolved.
 */
export function KeyPicker({
  ownerId,
  onInsert,
  onPickRef,
}: {
  ownerId: string | null;
  onInsert: (snippet: string) => void;
  /** Báo credentialRef đã chọn (để builder map placeholder → credId). */
  onPickRef?: (ref: { placeholder: string; key: string; credId: string }) => void;
}) {
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState<CredentialMasked[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [js, setJs] = useState('');
  const [resolved, setResolved] = useState('');

  useEffect(() => {
    if (!open || !ownerId) return;
    api
      .get<CredentialMasked[]>(`/owners/${ownerId}/credentials`)
      .then(setCreds)
      .catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }));
  }, [open, ownerId]);

  const selectedCred = creds.find((c) => c.id === selectedId);
  // Đếm số credential trùng key để nhắc chọn credId (B3).
  const dupCount = selectedCred ? creds.filter((c) => c.key === selectedCred.key).length : 0;

  const snippet = () => (js.trim() ? `{{= ${js.trim()} }}` : selectedCred ? `{{${selectedCred.key}}}` : '');

  const preview = async () => {
    try {
      const scope = selectedCred ? { credentials: { [selectedCred.key]: `<${selectedCred.key}>` } } : {};
      const r = await api.post<{ result: string }>('/engine/resolve', { template: snippet(), scope });
      setResolved(r.result);
    } catch (e: any) {
      ui.notify({ title: 'Lỗi resolve', message: e.message, kind: 'error' });
    }
  };

  const insert = () => {
    const s = snippet();
    if (!s) return ui.notify({ title: 'Chưa chọn', message: 'Chọn credential hoặc nhập JS trước.', kind: 'warning' });
    onInsert(s);
    // Nếu chèn theo credential cụ thể → báo credId để builder chọn đúng khi key trùng.
    if (selectedCred && !js.trim() && onPickRef) {
      onPickRef({ placeholder: selectedCred.key, key: selectedCred.key, credId: selectedCred.id });
    }
    setOpen(false);
    setSelectedId('');
    setJs('');
    setResolved('');
  };

  return (
    <>
      <Button
        iconOnly
        icon={Icon.key({})}
        tooltip="Chọn credential (theo credId) để chèn placeholder {{key}} vào ô đang soạn"
        onClick={() => setOpen(true)}
        disabled={!ownerId}
      />
      {open && (
        <Modal
          title="Chèn credential key"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" tooltip="Đóng" onClick={() => setOpen(false)}>Đóng</Button>
              <Button variant="primary" icon={Icon.plus({})} tooltip="Chèn placeholder vào ô đang soạn" onClick={insert}>Chèn</Button>
            </>
          }
        >
          <Field label="Chọn credential (label · masked · credId)">
            <select className="select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">-- chọn credential --</option>
              {creds.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.key} · {c.label || '(no label)'} · {c.masked} · {c.id}
                </option>
              ))}
            </select>
          </Field>
          {selectedCred && dupCount > 1 && (
            <div className="sandbox-badge">
              Key "{selectedCred.key}" có {dupCount} giá trị — placeholder sẽ gắn credId {selectedCred.id} để resolve đúng.
            </div>
          )}
          <div className="sandbox-badge">Advanced JS (tuỳ chọn): chạy sandbox, cấm network/fs, timeout 200ms</div>
          <Field label="JS transform (để trống nếu chèn thẳng key)">
            <Textarea rows={3} value={js} onChange={(e) => setJs(e.target.value)} placeholder={"return (vars['github.token']||'').slice(0,8);"} />
          </Field>
          <div className="row">
            <Button icon={Icon.eye({})} tooltip="Xem giá trị resolved (dùng giá trị mẫu) để kiểm tra cấu hình" onClick={preview}>Xem resolved</Button>
          </div>
          {resolved !== '' && (
            <p className="mono" style={{ marginTop: 'var(--sp-2)' }}>Kết quả: {resolved}</p>
          )}
        </Modal>
      )}
    </>
  );
}
