import React, { useEffect, useMemo, useState } from 'react';
import { api, type ExtractionRecord } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Field, Input, Textarea } from '../components/Field';
import { Icon } from '../components/Icon';
import { DataList, type DataListColumn } from '../components/DataList';

/**
 * ExtractionsPage — Extracted Data ([SYS] 10.5 + B5).
 * DataList giá trị trích xuất. Item-level: Pin thành biến · Sửa · Xóa (confirm).
 * Cho phép tạo record thủ công.
 */
export function ExtractionsPage() {
  const { ownerId, owners } = useApp();
  const ui = useUI();
  const [rows, setRows] = useState<ExtractionRecord[]>([]);
  const [service, setService] = useState('');
  const [editing, setEditing] = useState<ExtractionRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const ownerEmail = owners.find((o) => o.id === ownerId)?.email;

  const load = async () => {
    const q = new URLSearchParams();
    if (ownerId) q.set('ownerId', ownerId);
    if (service) q.set('service', service);
    setRows(await api.get<ExtractionRecord[]>(`/extractions?${q}`));
  };
  useEffect(() => { load().catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' })); /* eslint-disable-next-line */ }, [ownerId]);

  const pin = async (r: ExtractionRecord) => {
    const okc = await ui.confirm({ title: 'Pin thành biến?', message: <>Ghi <b>{r.field}</b> vào kho biến (owner scope) để tái sử dụng?</>, confirmLabel: 'Pin' });
    if (!okc) return;
    await api.post('/variables', { scope: ownerId, key: r.field, value: r.value, source: 'extracted' });
    ui.notify({ title: 'Đã pin', message: `${r.field} → {{var.${r.field}}}`, kind: 'success' });
  };

  const remove = async (r: ExtractionRecord) => {
    const okc = await ui.confirm({ title: 'Xóa extraction', message: <>Xóa record <b>{r.field}</b> ({r.templateName})?</>, danger: true, confirmLabel: 'Xóa' });
    if (!okc) return;
    try {
      await api.del(`/extractions/${r.id}`);
      ui.notify({ title: 'Đã xóa', message: r.field, kind: 'success' });
      load();
    } catch (e: any) { ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }); }
  };

  const columns: DataListColumn<ExtractionRecord>[] = useMemo(() => [
    { key: 'field', header: 'Field', value: (r) => r.field, render: (r) => <span className="mono">{r.field}</span>, width: 150 },
    { key: 'value', header: 'Value', value: (r) => JSON.stringify(r.value), render: (r) => <span className="mono" style={{ display: 'inline-block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>{JSON.stringify(r.value)}</span> },
    { key: 'templateName', header: 'Template', value: (r) => r.templateName },
    { key: 'service', header: 'Service', value: (r) => r.service, width: 130 },
    { key: 'jsonPath', header: 'JSONPath', value: (r) => r.jsonPath, render: (r) => <span className="mono">{r.jsonPath}</span> },
    { key: 'createdAt', header: 'Thời điểm', value: (r) => r.createdAt, render: (r) => new Date(r.createdAt).toLocaleString(), width: 170 },
    {
      key: 'actions', header: '', value: () => '', noExport: true, sortable: false, align: 'right', width: 110,
      render: (r) => (
        <div className="item-actions">
          <Button iconOnly icon={Icon.pin({})} variant="ghost" tooltip="Pin giá trị này thành biến tái sử dụng (cần xác nhận)" onClick={() => pin(r)} />
          <Button iconOnly icon={Icon.edit({})} variant="ghost" tooltip="Sửa record trích xuất" onClick={() => setEditing(r)} />
          <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Xóa record trích xuất (cần xác nhận)" onClick={() => remove(r)} />
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ownerId]);

  return (
    <div>
      <div className="page-head">
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Extracted Data</h1>
          <span className="page-desc">Giá trị trích xuất từ các lần fetch · pin / sửa / xóa</span>
        </div>
        <Button variant="primary" icon={Icon.plus({})} tooltip="Thêm record trích xuất thủ công" disabled={!ownerId} onClick={() => setCreateOpen(true)}>Thêm</Button>
      </div>
      <DataList
        title="extracted-data"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        ownerContext={ownerEmail}
        initialSort={{ key: 'createdAt', dir: 'desc' }}
        emptyText="Chưa có dữ liệu trích xuất. Execute 1 flow có extract để tạo."
        toolbarExtra={
          <>
            <Input placeholder="lọc service (server)" value={service} onChange={(e) => setService(e.target.value)} style={{ width: 150 }} />
            <Button icon={Icon.zap({})} tooltip="Áp dụng lọc phía server" onClick={() => load().catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }))}>Lọc</Button>
          </>
        }
      />

      {(editing || createOpen) && ownerId && (
        <ExtractionModal
          ownerId={ownerId}
          record={editing}
          onClose={() => { setEditing(null); setCreateOpen(false); }}
          onSaved={() => { setEditing(null); setCreateOpen(false); load(); }}
          ui={ui}
        />
      )}
    </div>
  );
}

function ExtractionModal({ ownerId, record, onClose, onSaved, ui }: {
  ownerId: string;
  record: ExtractionRecord | null;
  onClose: () => void;
  onSaved: () => void;
  ui: ReturnType<typeof useUI>;
}) {
  const [field, setField] = useState(record?.field ?? '');
  const [valueText, setValueText] = useState(record ? JSON.stringify(record.value) : '""');
  const [service, setService] = useState(record?.service ?? '');
  const [jsonPath, setJsonPath] = useState(record?.jsonPath ?? '');
  const [templateName, setTemplateName] = useState(record?.templateName ?? '(manual)');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!field.trim()) return ui.notify({ title: 'Thiếu field', message: 'Nhập tên field.', kind: 'warning' });
    let value: unknown;
    try { value = valueText.trim() ? JSON.parse(valueText) : ''; }
    catch { value = valueText; } // cho phép chuỗi thô
    setSaving(true);
    try {
      if (record) {
        await api.put(`/extractions/${record.id}`, { field: field.trim(), value, service: service.trim(), jsonPath: jsonPath.trim(), templateName: templateName.trim() });
        ui.notify({ title: 'Đã cập nhật', message: field, kind: 'success' });
      } else {
        await api.post('/extractions', { ownerId, field: field.trim(), value, service: service.trim(), jsonPath: jsonPath.trim(), templateName: templateName.trim() });
        ui.notify({ title: 'Đã thêm', message: field, kind: 'success' });
      }
      onSaved();
    } catch (e: any) { ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={record ? 'Sửa extraction' : 'Thêm extraction'} onClose={onClose} footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.save({})} tooltip="Lưu record" loading={saving} onClick={save}>Lưu</Button>
    </>}>
      <Field label="Field"><Input className="input mono" value={field} onChange={(e) => setField(e.target.value)} placeholder="github.lastRepoUrl" /></Field>
      <Field label="Value (JSON hoặc chuỗi)"><Textarea rows={3} value={valueText} onChange={(e) => setValueText(e.target.value)} /></Field>
      <div className="row">
        <Field label="Service"><Input className="input mono" value={service} onChange={(e) => setService(e.target.value)} placeholder="github.com" /></Field>
        <Field label="JSONPath"><Input className="input mono" value={jsonPath} onChange={(e) => setJsonPath(e.target.value)} placeholder="$.html_url" /></Field>
      </div>
      <Field label="Template nguồn"><Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="(manual)" /></Field>
    </Modal>
  );
}
