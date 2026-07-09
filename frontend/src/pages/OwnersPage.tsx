import React, { useState } from 'react';
import { api, type Owner } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { DataList, type DataListColumn } from '../components/DataList';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Field, Input } from '../components/Field';
import { Icon } from '../components/Icon';

/**
 * OwnersPage (B1 — theo Stitch api_fetch_manager_layout_frame/code.html "System Owners").
 * DataList: Email · isSaveRtdbEmail · Created At · Services (badge).
 * 4 action/dòng: Toggle Active · Create Fetch · View Credentials · Go to Service.
 * CRUD owner qua modal; xoá có confirm.
 */
export function OwnersPage({
  onGoCredentials,
  onGoBuilder,
  onGoService,
}: {
  onGoCredentials: () => void;
  onGoBuilder: () => void;
  onGoService: () => void;
}) {
  const { owners, ownerId, setOwnerId, reloadOwners } = useApp();
  const ui = useUI();
  const [editing, setEditing] = useState<Owner | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [saveRtdb, setSaveRtdb] = useState(true);
  const [busy, setBusy] = useState(false);

  const fmtDate = (ms: number) => (ms ? new Date(ms).toLocaleString() : '—');

  const openCreate = () => {
    setEditing(null);
    setEmail('');
    setSaveRtdb(true);
    setCreateOpen(true);
  };

  const openEdit = (o: Owner) => {
    setEditing(o);
    setEmail(o.email);
    setSaveRtdb(o.isSaveRtdbEmail);
    setCreateOpen(true);
  };

  const save = async () => {
    const e = email.trim();
    if (!e) return ui.notify({ title: 'Thiếu email', message: 'Nhập email owner.', kind: 'warning' });
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/owners/${editing.id}`, { email: e, isSaveRtdbEmail: saveRtdb });
        ui.notify({ title: 'Đã cập nhật', message: `Owner ${e} đã được cập nhật.`, kind: 'success' });
      } else {
        await api.post('/owners', { email: e, isSaveRtdbEmail: saveRtdb });
        ui.notify({ title: 'Đã tạo owner', message: `Owner ${e} đã được tạo.`, kind: 'success' });
      }
      await reloadOwners();
      setCreateOpen(false);
    } catch (err: any) {
      ui.notify({ title: 'Lỗi', message: err.message, kind: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (o: Owner) => {
    const okDel = await ui.confirm({
      title: 'Xoá owner',
      message: `Xoá owner "${o.email}" và toàn bộ credential của owner này? Hành động không thể hoàn tác.`,
      danger: true,
      confirmLabel: 'Xoá',
    });
    if (!okDel) return;
    try {
      await api.del(`/owners/${o.id}`);
      ui.notify({ title: 'Đã xoá', message: `Owner ${o.email} đã bị xoá.`, kind: 'success' });
      await reloadOwners();
    } catch (err: any) {
      ui.notify({ title: 'Lỗi', message: err.message, kind: 'error' });
    }
  };

  /** Chuyển owner active + điều hướng (đổi active owner → mọi trang cập nhật). */
  const activate = (o: Owner) => {
    setOwnerId(o.id);
    ui.notify({ title: 'Owner active', message: `Đã đặt ${o.email} làm owner đang thao tác.`, kind: 'success' });
  };
  const goCredentials = (o: Owner) => { setOwnerId(o.id); onGoCredentials(); };
  const goBuilder = (o: Owner) => { setOwnerId(o.id); onGoBuilder(); };
  const goService = (o: Owner) => { setOwnerId(o.id); onGoService(); };

  const columns: DataListColumn<Owner>[] = [
    {
      key: 'email',
      header: 'Email',
      value: (o) => o.email,
      render: (o) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="mono" style={{ color: 'var(--primary)', fontSize: 'var(--fs-sm)' }}>
            {o.email}
            {o.id === ownerId && <span className="badge badge--primary" style={{ marginLeft: 8 }}>active</span>}
          </span>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(o.services ?? []).length === 0 ? (
              <span className="muted" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>chưa có service</span>
            ) : (
              (o.services ?? []).map((s) => (
                <span key={s} className="badge badge--primary" style={{ fontSize: 'var(--fs-xs)' }}>{s}</span>
              ))
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'isSaveRtdbEmail',
      header: 'isSaveRtdbEmail',
      align: 'center',
      value: (o) => o.isSaveRtdbEmail,
      render: (o) => (
        <span className={o.isSaveRtdbEmail ? 'badge badge--success' : 'badge'}>
          {o.isSaveRtdbEmail ? 'true' : 'false'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      value: (o) => o.createdAt,
      render: (o) => <span className="mono" style={{ color: 'var(--text-muted)' }}>{fmtDate(o.createdAt)}</span>,
    },
    {
      key: 'services',
      header: 'Services',
      value: (o) => (o.services ?? []).join(', '),
      render: (o) => <span className="muted">{(o.services ?? []).length} dịch vụ</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      noExport: true,
      sortable: false,
      value: () => '',
      render: (o) => (
        <div className="row-actions">
          <Button iconOnly variant="ghost" icon={Icon.toggle({})} tooltip="Toggle Active — đặt owner này làm owner đang thao tác (mọi trang cập nhật theo)" onClick={() => activate(o)} />
          <Button iconOnly variant="ghost" icon={Icon.zap({})} tooltip="Create Fetch — mở Fetch Builder cho owner này" onClick={() => goBuilder(o)} />
          <Button iconOnly variant="ghost" icon={Icon.eye({})} tooltip="View Credentials — xem credential của owner" onClick={() => goCredentials(o)} />
          <Button iconOnly variant="ghost" icon={Icon.external({})} tooltip="Go to Service — mở Services & Resources của owner" onClick={() => goService(o)} />
          <Button iconOnly variant="ghost" icon={Icon.edit({})} tooltip="Sửa owner (email / isSaveRtdbEmail)" onClick={() => openEdit(o)} />
          <Button iconOnly variant="ghost" icon={Icon.trash({})} tooltip="Xoá owner (có xác nhận)" onClick={() => remove(o)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-head">
        <div style={{ flex: 1 }}>
          <h1 className="page-title">System Owners</h1>
          <div className="page-desc">Quản lý tài khoản entity và các môi trường dịch vụ kết nối.</div>
        </div>
        <Button icon={Icon.refresh({})} tooltip="Tải lại danh sách owner" onClick={() => reloadOwners()}>Refresh</Button>
        <Button variant="primary" icon={Icon.plus({})} tooltip="Thêm owner mới" onClick={openCreate}>Add Owner</Button>
      </div>

      <DataList<Owner>
        title="Owners"
        columns={columns}
        rows={owners}
        rowKey={(o) => o.id}
        emptyText="Chưa có owner nào. Bấm Add Owner để tạo."
        ownerContext={owners.find((o) => o.id === ownerId)?.email}
        initialSort={{ key: 'createdAt', dir: 'desc' }}
      />

      {createOpen && (
        <Modal
          title={editing ? 'Sửa owner' : 'Thêm owner'}
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <Button variant="ghost" tooltip="Đóng" onClick={() => setCreateOpen(false)}>Đóng</Button>
              <Button variant="primary" icon={Icon.save({})} tooltip="Lưu owner" loading={busy} onClick={save}>
                {editing ? 'Lưu' : 'Tạo owner'}
              </Button>
            </>
          }
        >
          <Field label="Email owner">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" autoComplete="off" />
          </Field>
          <label className="row" style={{ cursor: 'pointer', gap: 'var(--sp-2)' }}>
            <input
              type="checkbox"
              checked={saveRtdb}
              onChange={(e) => setSaveRtdb(e.target.checked)}
              style={{ flex: '0 0 auto', width: 16, height: 16 }}
            />
            <span style={{ flex: 1 }}>isSaveRtdbEmail — lưu email vào RTDB khi tạo credential</span>
          </label>
        </Modal>
      )}
    </div>
  );
}
