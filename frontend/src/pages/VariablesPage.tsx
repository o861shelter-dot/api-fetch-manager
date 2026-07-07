import React, { useEffect, useState } from 'react';
import { api, type Variable } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Field, Input } from '../components/Field';
import { Icon } from '../components/Icon';

export function VariablesPage() {
  const { ownerId } = useApp();
  const ui = useUI();
  const [tab, setTab] = useState<'global' | 'owner'>('global');
  const [vars, setVars] = useState<Record<string, Variable>>({});
  const [editOpen, setEditOpen] = useState(false);

  const scope = tab === 'global' ? 'global' : ownerId ?? 'global';
  const load = async () => setVars(await api.get<Record<string, Variable>>(`/variables?scope=${scope}`));
  useEffect(() => { load().catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' })); /* eslint-disable-next-line */ }, [tab, ownerId]);

  const del = async (key: string) => {
    const okc = await ui.confirm({ title: 'Xóa biến', message: <>Xóa biến <b>{key}</b>?</>, danger: true, confirmLabel: 'Xóa' });
    if (!okc) return;
    await api.del(`/variables?scope=${scope}&key=${encodeURIComponent(key)}`);
    ui.notify({ title: 'Đã xóa', message: key, kind: 'success' });
    load();
  };
  const copyRef = (key: string) => {
    navigator.clipboard.writeText(`{{var.${key}}}`);
    ui.notify({ title: 'Đã copy', message: `{{var.${key}}} — dán vào fetch để dùng lại.`, kind: 'success' });
  };

  const entries = Object.entries(vars);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Variables</h1>
        <span className="page-desc">Kho biến tái sử dụng · tham chiếu bằng {'{{var.key}}'}</span>
      </div>
      <div className="toolbar">
        <Button variant={tab === 'global' ? 'primary' : 'default'} icon={Icon.vars({})} tooltip="Biến dùng chung mọi owner" onClick={() => setTab('global')}>Global</Button>
        <Button variant={tab === 'owner' ? 'primary' : 'default'} icon={Icon.vars({})} tooltip="Biến riêng của owner đang chọn (ưu tiên hơn global)" onClick={() => setTab('owner')} disabled={!ownerId}>Theo owner</Button>
        <div className="toolbar__spacer" />
        <Button icon={Icon.plus({})} variant="primary" tooltip="Thêm biến mới vào scope hiện tại" onClick={() => setEditOpen(true)}>Biến mới</Button>
      </div>

      {entries.length === 0 ? <div className="empty">Chưa có biến trong scope này.</div> : (
        <table className="table">
          <thead><tr><th>Key</th><th>Value</th><th>Source</th><th>Cập nhật</th><th style={{ width: 90 }}></th></tr></thead>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td className="mono">{k}</td>
                <td className="mono" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{JSON.stringify(v.value)}</td>
                <td><span className="badge">{v.source}</span></td>
                <td>{new Date(v.updatedAt).toLocaleString()}</td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <Button iconOnly icon={Icon.copy({})} variant="ghost" tooltip="Copy tham chiếu {{var.key}} để dán vào fetch" onClick={() => copyRef(k)} />
                    <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Xóa biến (cần xác nhận)" onClick={() => del(k)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editOpen && <VarModal scope={scope} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} ui={ui} />}
    </div>
  );
}

function VarModal({ scope, onClose, onSaved, ui }: { scope: string; onClose: () => void; onSaved: () => void; ui: ReturnType<typeof useUI> }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!key.trim()) return ui.notify({ title: 'Thiếu key', message: 'Nhập key.', kind: 'warning' });
    setSaving(true);
    try {
      let parsed: unknown = value;
      try { parsed = JSON.parse(value); } catch { /* giữ string */ }
      await api.post('/variables', { scope, key, value: parsed, source: 'manual' });
      ui.notify({ title: 'Đã lưu', message: key, kind: 'success' });
      onSaved();
    } catch (e: any) { ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }); }
    finally { setSaving(false); }
  };
  return (
    <Modal title="Thêm/sửa biến" onClose={onClose} footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.save({})} tooltip="Lưu biến vào scope hiện tại" loading={saving} onClick={save}>Lưu</Button>
    </>}>
      <Field label="Key"><Input className="input mono" value={key} onChange={(e) => setKey(e.target.value)} placeholder="github.lastRepoUrl" /></Field>
      <Field label="Value (JSON hoặc chuỗi)"><Input value={value} onChange={(e) => setValue(e.target.value)} /></Field>
    </Modal>
  );
}
