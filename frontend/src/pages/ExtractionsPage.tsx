import React, { useEffect, useState } from 'react';
import { api, type ExtractionRecord } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Input } from '../components/Field';
import { Icon } from '../components/Icon';

export function ExtractionsPage() {
  const { ownerId } = useApp();
  const ui = useUI();
  const [rows, setRows] = useState<ExtractionRecord[]>([]);
  const [service, setService] = useState('');

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

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Extracted Data</h1>
        <span className="page-desc">Giá trị trích xuất từ các lần fetch · kèm template nguồn &amp; thời điểm</span>
      </div>
      <div className="toolbar">
        <Input placeholder="lọc service" value={service} onChange={(e) => setService(e.target.value)} style={{ width: 150 }} />
        <Button icon={Icon.zap({})} tooltip="Áp dụng lọc" onClick={load}>Lọc</Button>
      </div>
      {rows.length === 0 ? <div className="empty">Chưa có dữ liệu trích xuất. Execute 1 flow có extract để tạo.</div> : (
        <table className="table">
          <thead><tr><th>Field</th><th>Value</th><th>Template</th><th>JSONPath</th><th>Thời điểm</th><th style={{ width: 60 }}></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.field}</td>
                <td className="mono" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{JSON.stringify(r.value)}</td>
                <td>{r.templateName}</td>
                <td className="mono">{r.jsonPath}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td><Button iconOnly icon={Icon.pin({})} variant="ghost" tooltip="Pin giá trị này thành biến tái sử dụng (cần xác nhận)" onClick={() => pin(r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
