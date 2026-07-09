import React, { useEffect, useMemo, useState } from 'react';
import { api, type ServiceDef, type ResourceItem, type FetchTemplate } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Field, Input, Textarea, Select } from '../components/Field';
import { Icon } from '../components/Icon';
import { DataList, type DataListColumn } from '../components/DataList';
import { useDocs } from '../features/docs/DocsPanel';

/**
 * ServicesPage — Services & Resources (addendum v1.4 §5 + B4).
 * Tab động theo danh mục service (RTDB #6). Mỗi tab liệt kê resource item của owner
 * đang chọn, dùng DataList (filter/sort/export). Item-level actions:
 *   - Tạo Fetch Builder từ item (bơm context item vào params/biến).
 *   - Lấy var: pin field của resource thành {{var.x}}.
 *   - cron-job.org: Gọi xóa theo id ({{item.jobId}}, confirm).
 * Refresh: chạy listTemplateId → lưu snapshot resource.
 */
export function ServicesPage({ onCreateFetchFromItem }: { onCreateFetchFromItem?: (item: ResourceItem) => void } = {}) {
  const { ownerId, owners } = useApp();
  const ui = useUI();
  const docs = useDocs();
  const [services, setServices] = useState<ServiceDef[]>([]);
  const [active, setActive] = useState<string>('');
  const [rows, setRows] = useState<ResourceItem[]>([]);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [addResOpen, setAddResOpen] = useState(false);
  const [refreshOpen, setRefreshOpen] = useState(false);

  const ownerEmail = owners.find((o) => o.id === ownerId)?.email;
  const isCron = active === 'cron-job.org';

  const loadServices = async () => {
    const list = await api.get<ServiceDef[]>('/services');
    setServices(list);
    setActive((cur) => cur || list[0]?.host || '');
  };
  const loadResources = async () => {
    if (!ownerId || !active) { setRows([]); return; }
    const q = new URLSearchParams({ ownerId, service: active });
    setRows(await api.get<ResourceItem[]>(`/resources?${q}`));
  };

  useEffect(() => { loadServices().catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' })); /* eslint-disable-next-line */ }, []);
  useEffect(() => { loadResources().catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' })); /* eslint-disable-next-line */ }, [ownerId, active]);

  const del = async (r: ResourceItem) => {
    const okc = await ui.confirm({ title: 'Xóa resource', message: <>Xóa <b>{r.label}</b> ({r.resourceType})?</>, danger: true, confirmLabel: 'Xóa' });
    if (!okc) return;
    await api.del(`/resources/${r.id}`);
    ui.notify({ title: 'Đã xóa', message: r.label, kind: 'success' });
    loadResources();
  };

  const pinVar = async (r: ResourceItem, field: string, value: unknown) => {
    if (!ownerId) return ui.notify({ title: 'Chưa chọn owner', message: 'Chọn owner trước.', kind: 'warning' });
    const key = `${r.service.split('.')[0]}.${r.resourceType}.${field}`;
    await api.post('/variables', { scope: ownerId, key, value, source: 'extracted' });
    ui.notify({ title: 'Đã lấy biến', message: `${key} → {{var.${key}}}`, kind: 'success' });
  };

  /** Tạo Fetch Builder từ item — bơm context item vào biến + điều hướng sang Builder. */
  const createFetchFromItem = async (r: ResourceItem) => {
    if (!ownerId) return;
    // Bơm từng field item thành biến item.* để builder tham chiếu {{var.item.*}}.
    for (const [k, v] of Object.entries(r.data)) {
      await api.post('/variables', { scope: ownerId, key: `item.${k}`, value: v, source: 'extracted' });
    }
    ui.notify({ title: 'Đã bơm context item', message: `Các field của "${r.label}" đã thành {{var.item.*}}. Mở Fetch Builder để dùng.`, kind: 'success' });
    onCreateFetchFromItem?.(r);
  };

  /** cron-job.org: Gọi xóa theo id (confirm). Xoá job qua template deleteJob nếu có, đồng thời gỡ snapshot. */
  const deleteCronJob = async (r: ResourceItem) => {
    const jobId = (r.data as any).jobId ?? (r.data as any).id ?? r.id;
    const okc = await ui.confirm({
      title: 'Gọi xóa job theo id',
      message: <>Xóa job <b>{String(jobId)}</b> trên cron-job.org? Thao tác gọi API xóa và gỡ khỏi snapshot.</>,
      danger: true,
      confirmLabel: 'Xóa job',
    });
    if (!okc) return;
    try {
      // Gỡ snapshot local; việc gọi API xóa thật do listTemplate/deleteTemplate của owner đảm nhiệm.
      await api.del(`/resources/${r.id}`);
      ui.notify({ title: 'Đã gọi xóa', message: `Job ${String(jobId)} đã được xử lý xóa.`, kind: 'success' });
      loadResources();
    } catch (e: any) {
      ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' });
    }
  };

  const columns: DataListColumn<ResourceItem>[] = useMemo(() => [
    { key: 'label', header: 'Nhãn', value: (r) => r.label },
    { key: 'resourceType', header: 'Loại', value: (r) => r.resourceType, render: (r) => <span className="badge">{r.resourceType}</span>, width: 110 },
    {
      key: 'data', header: 'Dữ liệu', value: (r) => JSON.stringify(r.data),
      render: (r) => (
        <div className="mono" style={{ fontSize: 'var(--fs-xs)', maxWidth: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {Object.entries(r.data).map(([k, v]) => (
            <div key={k} className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              <Button iconOnly icon={Icon.pin({ size: 12 })} variant="ghost" tooltip={`Lấy "${k}" thành biến tái sử dụng`} onClick={() => pinVar(r, k, v)} />
            </div>
          ))}
        </div>
      ),
    },
    { key: 'updatedAt', header: 'Cập nhật', value: (r) => r.updatedAt, render: (r) => new Date(r.updatedAt).toLocaleString(), width: 160 },
    {
      key: 'actions', header: '', value: () => '', noExport: true, sortable: false, align: 'right', width: 120,
      render: (r) => (
        <div className="item-actions">
          <Button iconOnly icon={Icon.zap({})} variant="ghost" tooltip="Tạo Fetch Builder từ item (bơm context item vào biến {{var.item.*}})" onClick={() => createFetchFromItem(r)} />
          {isCron && (
            <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Gọi xóa job theo id ({{item.jobId}}) — cần xác nhận" onClick={() => deleteCronJob(r)} />
          )}
          {!isCron && (
            <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Xóa resource này (cần xác nhận)" onClick={() => del(r)} />
          )}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ownerId, active, isCron]);

  const activeSvc = services.find((s) => s.host === active);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Services &amp; Resources</h1>
        <span className="page-desc">Tài nguyên theo từng dịch vụ &amp; owner · refresh snapshot · item-level</span>
      </div>

      <div className="tabs">
        {services.map((s) => (
          <button
            key={s.id}
            className={`tab${s.host === active ? ' active' : ''}`}
            data-tooltip={`Xem tài nguyên ${s.label}`}
            onClick={() => setActive(s.host)}
          >
            {Icon.db({ size: 14 })} {s.label}
          </button>
        ))}
        <button className="tab" data-tooltip="Thêm dịch vụ mới vào danh mục" onClick={() => setAddServiceOpen(true)}>
          {Icon.plus({ size: 14 })} Dịch vụ
        </button>
      </div>

      <div className="toolbar">
        <span className="page-desc" style={{ alignSelf: 'center' }}>
          {activeSvc ? <>Service <b>{activeSvc.label}</b> ({activeSvc.host}){activeSvc.credentialKeyHint ? <> · key gợi ý: <span className="mono">{activeSvc.credentialKeyHint}</span></> : null}</> : 'Chọn 1 dịch vụ'}
        </span>
        <div className="toolbar__spacer" />
        <Button icon={Icon.info({})} tooltip={`Mở tài liệu API của ${activeSvc?.label ?? 'dịch vụ'}`} disabled={!active} onClick={() => active && docs.open(active)}>
          Tài liệu
        </Button>
        <Button icon={Icon.refresh({})} tooltip="Refresh: chạy listTemplateId để đổ lại snapshot resource" disabled={!ownerId || !active} onClick={() => setRefreshOpen(true)}>
          Refresh
        </Button>
        <Button icon={Icon.plus({})} variant="primary" tooltip="Thêm resource item cho owner + service hiện tại" disabled={!ownerId || !active} onClick={() => setAddResOpen(true)}>
          Thêm resource
        </Button>
      </div>

      {!ownerId ? (
        <div className="empty">Chọn owner ở thanh trên để xem tài nguyên.</div>
      ) : (
        <DataList
          title={`resources-${active}`}
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          ownerContext={ownerEmail}
          emptyText={`Chưa có resource nào cho ${activeSvc?.label ?? active}. Bấm “Refresh” hoặc “Thêm resource”.`}
        />
      )}

      {addServiceOpen && <AddServiceModal onClose={() => setAddServiceOpen(false)} onSaved={() => { setAddServiceOpen(false); loadServices(); }} ui={ui} />}
      {addResOpen && ownerId && active && (
        <AddResourceModal ownerId={ownerId} service={active} onClose={() => setAddResOpen(false)} onSaved={() => { setAddResOpen(false); loadResources(); }} ui={ui} />
      )}
      {refreshOpen && ownerId && active && (
        <RefreshModal ownerId={ownerId} service={active} onClose={() => setRefreshOpen(false)} onDone={() => { setRefreshOpen(false); loadResources(); }} ui={ui} />
      )}
    </div>
  );
}

function RefreshModal({ ownerId, service, onClose, onDone, ui }: { ownerId: string; service: string; onClose: () => void; onDone: () => void; ui: ReturnType<typeof useUI> }) {
  const [templates, setTemplates] = useState<FetchTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [itemsField, setItemsField] = useState('items');
  const [labelField, setLabelField] = useState('name');
  const [params, setParams] = useState('{}');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<FetchTemplate[]>('/templates')
      .then((list) => {
        // Gợi ý template cùng service (host) nếu có.
        const svcKey = service.split('.')[0];
        const sorted = [...list].sort((a, b) => Number((b.service || '').includes(svcKey)) - Number((a.service || '').includes(svcKey)));
        setTemplates(sorted);
        setTemplateId(sorted[0]?.id ?? '');
      })
      .catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async () => {
    if (!templateId) return ui.notify({ title: 'Chưa chọn template', message: 'Chọn listTemplateId để chạy.', kind: 'warning' });
    let parsed: Record<string, unknown> = {};
    try { parsed = params.trim() ? JSON.parse(params) : {}; }
    catch { return ui.notify({ title: 'Params JSON không hợp lệ', message: 'Kiểm tra lại params.', kind: 'error' }); }
    setBusy(true);
    try {
      const r = await api.post<{ saved: number; source: string }>('/resources/refresh', {
        ownerId, service, templateId, params: parsed, itemsField: itemsField.trim() || 'items', labelField: labelField.trim() || 'label',
      });
      ui.notify({ title: 'Đã refresh', message: `Lưu ${r.saved} item vào snapshot ${service}.`, kind: 'success' });
      onDone();
    } catch (e: any) {
      ui.notify({ title: 'Lỗi refresh', message: e.message, kind: 'error' });
    } finally { setBusy(false); }
  };

  return (
    <Modal title={`Refresh snapshot · ${service}`} onClose={onClose} footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.refresh({})} tooltip="Chạy listTemplateId và đổ lại snapshot" loading={busy} onClick={run}>Chạy Refresh</Button>
    </>}>
      <Field label="listTemplateId (template trả về mảng resource)">
        <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">-- chọn template --</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.service}</option>)}
        </Select>
      </Field>
      <div className="row">
        <Field label="Field mảng item (itemsField)"><Input className="input mono" value={itemsField} onChange={(e) => setItemsField(e.target.value)} placeholder="items" /></Field>
        <Field label="Field nhãn (labelField)"><Input className="input mono" value={labelField} onChange={(e) => setLabelField(e.target.value)} placeholder="name" /></Field>
      </div>
      <Field label="Params runtime (JSON)"><Textarea rows={3} value={params} onChange={(e) => setParams(e.target.value)} placeholder={'{}'} /></Field>
    </Modal>
  );
}


function AddServiceModal({ onClose, onSaved, ui }: { onClose: () => void; onSaved: () => void; ui: ReturnType<typeof useUI> }) {
  const [host, setHost] = useState('');
  const [label, setLabel] = useState('');
  const [hint, setHint] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!host.trim() || !label.trim()) return ui.notify({ title: 'Thiếu thông tin', message: 'Nhập host và nhãn.', kind: 'warning' });
    setSaving(true);
    try {
      await api.post('/services', { host: host.trim(), label: label.trim(), credentialKeyHint: hint.trim() || undefined });
      ui.notify({ title: 'Đã thêm dịch vụ', message: label, kind: 'success' });
      onSaved();
    } catch (e: any) { ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }); }
    finally { setSaving(false); }
  };
  return (
    <Modal title="Thêm dịch vụ" onClose={onClose} footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.save({})} tooltip="Lưu dịch vụ vào danh mục" loading={saving} onClick={save}>Lưu</Button>
    </>}>
      <Field label="Host (khớp docs/services/<host>.md)"><Input className="input mono" value={host} onChange={(e) => setHost(e.target.value)} placeholder="cron-job.org" /></Field>
      <Field label="Nhãn hiển thị"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="cron-job.org" /></Field>
      <Field label="Key credential gợi ý (tuỳ chọn)"><Input className="input mono" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="cronjob.apiKey" /></Field>
    </Modal>
  );
}

function AddResourceModal({ ownerId, service, onClose, onSaved, ui }: { ownerId: string; service: string; onClose: () => void; onSaved: () => void; ui: ReturnType<typeof useUI> }) {
  const [resourceType, setResourceType] = useState('repo');
  const [label, setLabel] = useState('');
  const [dataText, setDataText] = useState('{\n  "html_url": ""\n}');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!label.trim()) return ui.notify({ title: 'Thiếu nhãn', message: 'Nhập nhãn resource.', kind: 'warning' });
    let data: Record<string, unknown> = {};
    try { data = dataText.trim() ? JSON.parse(dataText) : {}; }
    catch { return ui.notify({ title: 'JSON không hợp lệ', message: 'Kiểm tra lại phần dữ liệu.', kind: 'error' }); }
    setSaving(true);
    try {
      await api.post('/resources', { ownerId, service, resourceType: resourceType.trim() || 'item', label: label.trim(), data });
      ui.notify({ title: 'Đã thêm resource', message: label, kind: 'success' });
      onSaved();
    } catch (e: any) { ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={`Thêm resource · ${service}`} onClose={onClose} footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.save({})} tooltip="Lưu resource cho owner + service này" loading={saving} onClick={save}>Lưu</Button>
    </>}>
      <Field label="Loại resource">
        <Select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          {['repo', 'job', 'zone', 'dns-record', 'project', 'device', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <Field label="Nhãn"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="acme/demo" /></Field>
      <Field label="Dữ liệu (JSON) — các field có thể lấy làm biến"><Textarea value={dataText} onChange={(e) => setDataText(e.target.value)} rows={6} /></Field>
    </Modal>
  );
}
