import React, { useEffect, useState } from 'react';
import { api, type HistoryEntry, type LogEntry } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Field';
import { Icon } from '../components/Icon';

export function HistoryPage() {
  const { ownerId } = useApp();
  const ui = useUI();
  const [tab, setTab] = useState<'history' | 'logs'>('history');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [service, setService] = useState('');
  const [business, setBusiness] = useState('');
  const [level, setLevel] = useState('');
  const [success, setSuccess] = useState('');

  const loadHistory = async () => {
    if (!ownerId) return setHistory([]);
    const q = new URLSearchParams({ ownerId });
    if (service) q.set('service', service);
    if (success) q.set('success', success);
    setHistory(await api.get<HistoryEntry[]>(`/history?${q}`));
  };
  const loadLogs = async () => {
    const q = new URLSearchParams();
    if (service) q.set('service', service);
    if (business) q.set('business', business);
    if (level) q.set('level', level);
    setLogs(await api.get<LogEntry[]>(`/logs?${q}`));
  };
  const load = () => (tab === 'history' ? loadHistory() : loadLogs()).catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab, ownerId]);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">History &amp; Logs</h1>
        <span className="page-desc">Lịch sử gọi API &amp; log chi tiết để debug</span>
      </div>
      <div className="toolbar">
        <Button variant={tab === 'history' ? 'primary' : 'default'} icon={Icon.history({})} tooltip="Xem lịch sử request/response theo owner" onClick={() => setTab('history')}>Lịch sử</Button>
        <Button variant={tab === 'logs' ? 'primary' : 'default'} icon={Icon.list({})} tooltip="Xem log chi tiết (lọc theo service/business/level)" onClick={() => setTab('logs')}>Logs</Button>
        <div className="toolbar__spacer" />
        <Input placeholder="service" value={service} onChange={(e) => setService(e.target.value)} style={{ width: 120 }} />
        {tab === 'history' ? (
          <Select value={success} onChange={(e) => setSuccess(e.target.value)} style={{ width: 110 }}>
            <option value="">tất cả</option><option value="true">thành công</option><option value="false">lỗi</option>
          </Select>
        ) : (
          <>
            <Input placeholder="business" value={business} onChange={(e) => setBusiness(e.target.value)} style={{ width: 120 }} />
            <Select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: 100 }}>
              <option value="">mọi level</option><option value="error">error</option><option value="warn">warn</option><option value="info">info</option>
            </Select>
          </>
        )}
        <Button icon={Icon.zap({})} tooltip="Áp dụng bộ lọc và tải lại" onClick={load}>Lọc</Button>
      </div>

      {tab === 'history' ? (
        history.length === 0 ? <div className="empty">Chưa có lịch sử. Execute 1 flow để tạo.</div> : (
          <table className="table">
            <thead><tr><th>Thời điểm</th><th>Method</th><th>URL</th><th>Status</th><th>ms</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.calledAt).toLocaleString()}</td>
                  <td><span className="badge badge--primary">{h.method}</span></td>
                  <td className="mono" style={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.url}</td>
                  <td><span className={`badge ${h.success ? 'badge--success' : 'badge--danger'}`}>{h.responseStatus}</span></td>
                  <td>{h.durationMs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : logs.length === 0 ? <div className="empty">Chưa có log.</div> : (
        <table className="table">
          <thead><tr><th>Thời điểm</th><th>Level</th><th>Service</th><th>Business</th><th>Message</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td><span className={`badge ${l.level === 'error' ? 'badge--danger' : l.level === 'warn' ? 'badge--warning' : 'badge--primary'}`}>{l.level}</span></td>
                <td>{l.service}</td>
                <td>{l.business}</td>
                <td>{l.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
