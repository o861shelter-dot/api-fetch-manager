import React, { useEffect, useState } from 'react';
import { api, type CredentialMasked } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Field, Input, Select } from '../components/Field';
import { Icon } from '../components/Icon';

export function CredentialsPage() {
  const { ownerId, owners, reloadOwners, setOwnerId } = useApp();
  const ui = useUI();
  const [creds, setCreds] = useState<CredentialMasked[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ioOpen, setIoOpen] = useState<false | 'import' | 'export'>(false);

  const load = async () => {
    if (!ownerId) return setCreds([]);
    setCreds(await api.get<CredentialMasked[]>(`/owners/${ownerId}/credentials`));
  };
  useEffect(() => {
    load().catch((e) => ui.notify({ title: 'Lỗi tải', message: e.message, kind: 'error' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const reveal = async (c: CredentialMasked) => {
    const okc = await ui.confirm({
      title: 'Hiện giá trị credential?',
      message: <>Bạn sắp xem giá trị thật của <b>{c.key}</b>. Giá trị nhạy cảm sẽ hiển thị. Tiếp tục?</>,
      confirmLabel: 'Hiện giá trị',
      danger: true,
    });
    if (!okc) return;
    try {
      const { value } = await api.post<{ value: string }>(`/owners/${ownerId}/credentials/${c.id}/reveal`);
      ui.notify({ title: `Giá trị: ${c.key}`, message: <span className="mono">{value}</span>, kind: 'info' });
    } catch (e: any) {
      ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' });
    }
  };

  const del = async (c: CredentialMasked) => {
    const okc = await ui.confirm({
      title: 'Xác nhận xóa',
      message: <>Xóa credential <b>{c.key}</b>? Không thể hoàn tác.</>,
      confirmLabel: 'Xóa',
      danger: true,
    });
    if (!okc) return;
    await api.del(`/owners/${ownerId}/credentials/${c.id}`);
    ui.notify({ title: 'Đã xóa', message: 'Credential đã bị xóa.', kind: 'success' });
    load();
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Credentials</h1>
        <span className="page-desc">Quản lý key theo emailOwner · giá trị luôn được mã hoá & masked</span>
      </div>

      <div className="toolbar">
        <Button icon={Icon.plus({})} tooltip="Thêm 1 emailOwner mới để nhóm credential" onClick={() => setOwnerOpen(true)}>Owner mới</Button>
        <Button icon={Icon.plus({})} variant="primary" tooltip="Thêm 1 giá trị credential mới cho owner đang chọn (server sẽ mã hoá trước khi lưu)" disabled={!ownerId} onClick={() => setAddOpen(true)}>Thêm key</Button>
        <div className="toolbar__spacer" />
        <Button icon={Icon.upload({})} tooltip="Import dữ liệu owner + credential từ JSON (ghi đè/thêm mới)" onClick={() => setIoOpen('import')}>Import</Button>
        <Button icon={Icon.download({})} tooltip="Export toàn bộ dữ liệu ra JSON để sao lưu" onClick={() => setIoOpen('export')}>Export</Button>
      </div>

      {!ownerId ? (
        <div className="empty">Chưa có owner nào. Tạo owner mới để bắt đầu.</div>
      ) : creds.length === 0 ? (
        <div className="empty">Owner này chưa có credential. Bấm "Thêm key".</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr><th>Key</th><th>Service</th><th>Label</th><th>Giá trị (masked)</th><th style={{ width: 90 }}></th></tr>
            </thead>
            <tbody>
              {creds.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.key}</td>
                  <td>{c.service}</td>
                  <td>{c.label || '—'}</td>
                  <td className="mono">{c.masked}</td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <Button iconOnly icon={Icon.eye({})} variant="ghost" tooltip="Hiện giá trị thật (cần xác nhận)" onClick={() => reveal(c)} />
                      <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Xóa credential này (cần xác nhận)" onClick={() => del(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-list">
            {creds.map((c) => (
              <div className="card" key={c.id}>
                <div className="card-row"><span className="k">Key</span><span className="mono">{c.key}</span></div>
                <div className="card-row"><span className="k">Service</span><span>{c.service}</span></div>
                <div className="card-row"><span className="k">Giá trị</span><span className="mono">{c.masked}</span></div>
                <div className="row" style={{ marginTop: 8 }}>
                  <Button icon={Icon.eye({})} variant="ghost" tooltip="Hiện giá trị thật (cần xác nhận)" onClick={() => reveal(c)}>Hiện</Button>
                  <Button icon={Icon.trash({})} variant="ghost" tooltip="Xóa credential" onClick={() => del(c)}>Xóa</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {ownerOpen && <OwnerModal onClose={() => setOwnerOpen(false)} onSaved={async (id) => { setOwnerOpen(false); await reloadOwners(); setOwnerId(id); }} ui={ui} />}
      {addOpen && ownerId && <AddCredModal ownerId={ownerId} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} ui={ui} />}
      {ioOpen && <ImportExportModal mode={ioOpen} onClose={() => setIoOpen(false)} onDone={async () => { setIoOpen(false); await reloadOwners(); load(); }} ui={ui} />}
    </div>
  );
}

function OwnerModal({ onClose, onSaved, ui }: { onClose: () => void; onSaved: (id: string) => void; ui: ReturnType<typeof useUI> }) {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!email.trim()) return ui.notify({ title: 'Thiếu email', message: 'Nhập email owner.', kind: 'warning' });
    setSaving(true);
    try {
      const o = await api.post<{ id: string }>('/owners', { email });
      ui.notify({ title: 'Đã tạo owner', message: email, kind: 'success' });
      onSaved(o.id);
    } catch (e: any) {
      ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Tạo emailOwner" onClose={onClose} footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Hủy" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.save({})} tooltip="Lưu owner mới" loading={saving} onClick={save}>Lưu</Button>
    </>}>
      <Field label="Email owner"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" /></Field>
    </Modal>
  );
}

function AddCredModal({ ownerId, onClose, onSaved, ui }: { ownerId: string; onClose: () => void; onSaved: () => void; ui: ReturnType<typeof useUI> }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [service, setService] = useState('github.com');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!key.trim() || !value.trim()) return ui.notify({ title: 'Thiếu dữ liệu', message: 'Nhập key và value.', kind: 'warning' });
    setSaving(true);
    try {
      await api.post(`/owners/${ownerId}/credentials`, { key, value, service, label });
      ui.notify({ title: 'Đã thêm', message: `Đã lưu ${key} (đã mã hoá).`, kind: 'success' });
      onSaved();
    } catch (e: any) {
      ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Thêm credential" onClose={onClose} footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Hủy" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.save({})} tooltip="Server sẽ mã hoá AES-256-GCM rồi lưu" loading={saving} onClick={save}>Lưu</Button>
    </>}>
      <div className="form-scroll">
        <Field label="Key (VD github.token)"><Input value={key} onChange={(e) => setKey(e.target.value)} className="input mono" /></Field>
        <Field label="Giá trị (sẽ được mã hoá)"><Input value={value} onChange={(e) => setValue(e.target.value)} /></Field>
        <Field label="Service"><Input value={service} onChange={(e) => setService(e.target.value)} /></Field>
        <Field label="Label (tùy chọn)"><Input value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ImportExportModal({ mode, onClose, onDone, ui }: { mode: 'import' | 'export'; onClose: () => void; onDone: () => void; ui: ReturnType<typeof useUI> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (mode === 'export') {
      api.get('/export').then((d) => setText(JSON.stringify(d, null, 2))).catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const doImport = async () => {
    const okc = await ui.confirm({ title: 'Import ghi đè?', message: 'Import sẽ thêm owner + credential từ JSON. Tiếp tục?', confirmLabel: 'Import', danger: true });
    if (!okc) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(text);
      const r = await api.post<{ ownersCreated: number; credsCreated: number }>('/import', parsed);
      ui.notify({ title: 'Import xong', message: `${r.ownersCreated} owner, ${r.credsCreated} credential.`, kind: 'success' });
      onDone();
    } catch (e: any) {
      ui.notify({ title: 'Lỗi import', message: e.message, kind: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const copy = () => { navigator.clipboard.writeText(text); ui.notify({ title: 'Đã copy', message: 'Dữ liệu export đã copy vào clipboard.', kind: 'success' }); };

  return (
    <Modal title={mode === 'import' ? 'Import dữ liệu' : 'Export dữ liệu'} onClose={onClose} wide footer={
      mode === 'import' ? (
        <>
          <Button variant="ghost" icon={Icon.x({})} tooltip="Hủy" onClick={onClose}>Hủy</Button>
          <Button variant="primary" icon={Icon.upload({})} tooltip="Import dữ liệu JSON vào hệ thống" loading={busy} onClick={doImport}>Import</Button>
        </>
      ) : (
        <>
          <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Đóng</Button>
          <Button variant="primary" icon={Icon.copy({})} tooltip="Copy JSON export vào clipboard" onClick={copy}>Copy</Button>
        </>
      )
    }>
      <textarea className="textarea" style={{ minHeight: '50vh' }} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === 'import' ? 'Dán JSON export vào đây...' : ''} readOnly={mode === 'export'} />
    </Modal>
  );
}
