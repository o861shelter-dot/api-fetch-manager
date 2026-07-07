import React, { useEffect, useState } from 'react';
import { api, type FetchTemplate, type FlowStep, type FlowInput } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Field, Input, Textarea, Select } from '../components/Field';
import { Icon } from '../components/Icon';
import { ExecuteModal } from '../features/execute/ExecuteModal';

function newStep(): FlowStep {
  return { id: 'step_' + Math.random().toString(36).slice(2, 8), method: 'GET', urlTemplate: '', headers: {}, bodyTemplate: '', extract: [] };
}

export function FetchBuilderPage() {
  const { ownerId } = useApp();
  const ui = useUI();
  const [templates, setTemplates] = useState<FetchTemplate[]>([]);
  const [editing, setEditing] = useState<FetchTemplate | null>(null);
  const [executing, setExecuting] = useState<FetchTemplate | null>(null);

  const load = async () => setTemplates(await api.get<FetchTemplate[]>('/templates'));
  useEffect(() => { load().catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' })); }, []);

  const blank = (): FetchTemplate => ({
    id: '', name: '', service: '', business: '', stopOnError: true, inputs: [], credentialRefs: [], steps: [newStep()], createdAt: 0, updatedAt: 0,
  });

  const del = async (t: FetchTemplate) => {
    const okc = await ui.confirm({ title: 'Xóa template', message: <>Xóa <b>{t.name}</b>? Không thể hoàn tác.</>, danger: true, confirmLabel: 'Xóa' });
    if (!okc) return;
    await api.del(`/templates/${t.id}`);
    ui.notify({ title: 'Đã xóa', message: t.name, kind: 'success' });
    load();
  };

  const execute = async (t: FetchTemplate) => {
    if (!ownerId) return ui.notify({ title: 'Chưa chọn owner', message: 'Chọn emailOwner ở thanh trên trước khi execute.', kind: 'warning' });
    setExecuting(t);
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Fetch Builder</h1>
        <span className="page-desc">Tạo API tái sử dụng từ curl · flow nhiều step · trích xuất dữ liệu</span>
      </div>
      <div className="toolbar">
        <Button icon={Icon.plus({})} variant="primary" tooltip="Tạo flow mới (nhiều step tuần tự)" onClick={() => setEditing(blank())}>Flow mới</Button>
      </div>

      {templates.length === 0 ? (
        <div className="empty">Chưa có template. Bấm "Flow mới" để tạo.</div>
      ) : (
        <table className="table">
          <thead><tr><th>Tên</th><th>Service</th><th>Business</th><th>Steps</th><th style={{ width: 130 }}></th></tr></thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.service}</td>
                <td>{t.business}</td>
                <td>{t.steps?.length ?? 0}</td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <Button iconOnly icon={Icon.play({})} variant="ghost" tooltip="Execute flow này (gọi API thật, có thể có side-effect)" onClick={() => execute(t)} />
                    <Button iconOnly icon={Icon.edit({})} variant="ghost" tooltip="Sửa flow" onClick={() => setEditing(t)} />
                    <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Xóa flow (cần xác nhận)" onClick={() => del(t)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && <BuilderModal initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} ui={ui} />}
      {executing && ownerId && <ExecuteModal template={executing} ownerId={ownerId} onClose={() => setExecuting(null)} ui={ui} />}
    </div>
  );
}

/* -------------------- Builder Modal (2 pane) -------------------- */
function BuilderModal({ initial, onClose, onSaved, ui }: { initial: FetchTemplate; onClose: () => void; onSaved: () => void; ui: ReturnType<typeof useUI> }) {
  const [tpl, setTpl] = useState<FetchTemplate>(structuredClone(initial));
  const [activeStep, setActiveStep] = useState(0);
  const [curlOpen, setCurlOpen] = useState(false);
  const [jsOpen, setJsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<FetchTemplate>) => setTpl((t) => ({ ...t, ...p }));
  const patchStep = (i: number, p: Partial<FlowStep>) => setTpl((t) => { const s = [...t.steps]; s[i] = { ...s[i], ...p }; return { ...t, steps: s }; });

  const addStep = () => { setTpl((t) => ({ ...t, steps: [...t.steps, newStep()] })); setActiveStep(tpl.steps.length); };
  const delStep = (i: number) => setTpl((t) => ({ ...t, steps: t.steps.filter((_, x) => x !== i) }));

  const step = tpl.steps[activeStep];

  const save = async () => {
    if (!tpl.name.trim() || tpl.steps.length === 0) return ui.notify({ title: 'Thiếu dữ liệu', message: 'Cần tên flow và ít nhất 1 step.', kind: 'warning' });
    setSaving(true);
    try {
      const payload = { name: tpl.name, service: tpl.service, business: tpl.business, stopOnError: tpl.stopOnError, inputs: tpl.inputs, credentialRefs: tpl.credentialRefs, steps: tpl.steps };
      if (tpl.id) await api.put(`/templates/${tpl.id}`, payload);
      else await api.post('/templates', payload);
      ui.notify({ title: 'Đã lưu flow', message: tpl.name, kind: 'success' });
      onSaved();
    } catch (e: any) {
      ui.notify({ title: 'Lỗi lưu', message: e.message, kind: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Modal title={tpl.id ? 'Sửa Fetch Flow' : 'Fetch Flow Builder'} onClose={onClose} wide footer={<>
      <Button variant="ghost" icon={Icon.upload({})} tooltip="Dán curl để tự sinh 1 step (method/url/header/body)" onClick={() => setCurlOpen(true)}>Từ curl</Button>
      <div style={{ flex: 1 }} />
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng, không lưu" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.save({})} tooltip="Lưu toàn bộ flow" loading={saving} onClick={save}>Lưu flow</Button>
    </>}>
      <div className="form-scroll">
        <div className="row">
          <Field label="Tên flow"><Input value={tpl.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
          <Field label="Service"><Input value={tpl.service} onChange={(e) => patch({ service: e.target.value })} placeholder="github.com" /></Field>
          <Field label="Business"><Input value={tpl.business} onChange={(e) => patch({ business: e.target.value })} placeholder="create-repo" /></Field>
        </div>

        <InputsEditor inputs={tpl.inputs ?? []} onChange={(inputs) => patch({ inputs })} />

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
          {/* Pane trái: steps */}
          <div style={{ width: 180, flex: '0 0 180px' }}>
            <div className="sidebar__group-title">Steps</div>
            {tpl.steps.map((s, i) => (
              <div key={s.id} className={`nav-item ${i === activeStep ? 'active' : ''}`} onClick={() => setActiveStep(i)}>
                <span className="badge badge--primary">{s.method}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{i + 1}. {s.id}</span>
                <span onClick={(e) => { e.stopPropagation(); delStep(i); }} data-tooltip="Xóa step này" style={{ cursor: 'pointer' }}>{Icon.trash({})}</span>
              </div>
            ))}
            <Button icon={Icon.plus({})} variant="ghost" tooltip="Thêm 1 step vào flow" onClick={addStep}>Thêm step</Button>
          </div>

          {/* Pane phải: step editor */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {step ? (
              <StepEditor step={step} onChange={(p) => patchStep(activeStep, p)} onOpenJs={() => setJsOpen(true)} />
            ) : <div className="empty">Chọn hoặc thêm step.</div>}
          </div>
        </div>
      </div>

      {curlOpen && <CurlModal onClose={() => setCurlOpen(false)} onParsed={(s, refs) => {
        setTpl((t) => ({ ...t, steps: [...t.steps, s], credentialRefs: [...(t.credentialRefs ?? []), ...refs] }));
        setCurlOpen(false);
      }} ui={ui} />}
      {jsOpen && <SandboxModal onClose={() => setJsOpen(false)} ui={ui} />}
    </Modal>
  );
}

function InputsEditor({ inputs, onChange }: { inputs: FlowInput[]; onChange: (v: FlowInput[]) => void }) {
  const add = () => onChange([...inputs, { name: '', source: 'runtime', required: false }]);
  const patch = (i: number, p: Partial<FlowInput>) => { const c = [...inputs]; c[i] = { ...c[i], ...p }; onChange(c); };
  return (
    <div>
      <div className="sidebar__group-title">Inputs</div>
      {inputs.map((inp, i) => (
        <div className="row" key={i} style={{ marginBottom: 6 }}>
          <Input placeholder="tên input" value={inp.name} onChange={(e) => patch(i, { name: e.target.value })} />
          <Select value={inp.source} onChange={(e) => patch(i, { source: e.target.value as any })} data-tooltip="runtime=hỏi khi chạy; store=lấy từ kho biến; context=từ step trước">
            <option value="runtime">runtime</option>
            <option value="store">store</option>
            <option value="context">context</option>
          </Select>
          {inp.source === 'store' && <Input placeholder="varKey" value={inp.varKey ?? ''} onChange={(e) => patch(i, { varKey: e.target.value })} />}
          {inp.source === 'context' && <Input placeholder="stepId.field" value={inp.ref ?? ''} onChange={(e) => patch(i, { ref: e.target.value })} />}
          <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Xóa input" onClick={() => onChange(inputs.filter((_, x) => x !== i))} />
        </div>
      ))}
      <Button icon={Icon.plus({})} variant="ghost" tooltip="Thêm input cho flow (runtime/store/context)" onClick={add}>Thêm input</Button>
    </div>
  );
}

function StepEditor({ step, onChange, onOpenJs }: { step: FlowStep; onChange: (p: Partial<FlowStep>) => void; onOpenJs: () => void }) {
  const headers = step.headers ?? {};
  const hEntries = Object.entries(headers);
  const setHeader = (idx: number, k: string, v: string) => {
    const e = hEntries.map((x) => [...x] as [string, string]);
    e[idx] = [k, v];
    onChange({ headers: Object.fromEntries(e.filter(([kk]) => kk)) });
  };
  const addHeader = () => onChange({ headers: { ...headers, '': '' } });
  const extract = step.extract ?? [];

  return (
    <div>
      <div className="row">
        <Field label="Method">
          <Select value={step.method} onChange={(e) => onChange({ method: e.target.value })}>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <div style={{ flex: 3 }}>
          <Field label="URL template (hỗ trợ {{...}})"><Input className="input mono" value={step.urlTemplate} onChange={(e) => onChange({ urlTemplate: e.target.value })} placeholder="https://api.github.com/user/repos" /></Field>
        </div>
      </div>

      <div className="sidebar__group-title">Headers</div>
      {hEntries.map(([k, v], i) => (
        <div className="row" key={i} style={{ marginBottom: 6 }}>
          <Input placeholder="Header" value={k} onChange={(e) => setHeader(i, e.target.value, v)} />
          <Input className="input mono" placeholder="Giá trị (VD Bearer {{github.token}})" value={v} onChange={(e) => setHeader(i, k, e.target.value)} />
        </div>
      ))}
      <Button icon={Icon.plus({})} variant="ghost" tooltip="Thêm 1 dòng header" onClick={addHeader}>Thêm header</Button>

      <Field label="Body template"><Textarea value={step.bodyTemplate ?? ''} onChange={(e) => onChange({ bodyTemplate: e.target.value })} placeholder={'{ "name": "{{repoName | lower}}" }'} /></Field>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>
        Placeholder: <span className="ph-hint">{'{{credential}}'}</span> <span className="ph-hint">{'{{var.x}}'}</span> <span className="ph-hint">{'{{ctx.step.field}}'}</span> <span className="ph-hint">{'{{input.x | upper}}'}</span> · <a onClick={onOpenJs} style={{ cursor: 'pointer' }}>Test JS sandbox</a>
      </div>

      <div className="sidebar__group-title">Extract (JSONPath)</div>
      {extract.map((ex, i) => (
        <div className="row" key={i} style={{ marginBottom: 6 }}>
          <Input placeholder="field" value={ex.field} onChange={(e) => { const c = [...extract]; c[i] = { ...c[i], field: e.target.value }; onChange({ extract: c }); }} />
          <Input className="input mono" placeholder="$.html_url" value={ex.jsonPath} onChange={(e) => { const c = [...extract]; c[i] = { ...c[i], jsonPath: e.target.value }; onChange({ extract: c }); }} />
          <Input className="input mono" placeholder="pin → var (tùy chọn)" value={ex.pinToVar ?? ''} onChange={(e) => { const c = [...extract]; c[i] = { ...c[i], pinToVar: e.target.value || undefined }; onChange({ extract: c }); }} />
          <Button iconOnly icon={Icon.trash({})} variant="ghost" tooltip="Xóa dòng extract" onClick={() => onChange({ extract: extract.filter((_, x) => x !== i) })} />
        </div>
      ))}
      <Button icon={Icon.plus({})} variant="ghost" tooltip="Thêm dòng trích xuất (JSONPath) từ response" onClick={() => onChange({ extract: [...extract, { field: '', jsonPath: '' }] })}>Thêm extract</Button>
    </div>
  );
}

function CurlModal({ onClose, onParsed, ui }: { onClose: () => void; onParsed: (s: FlowStep, refs: { placeholder: string; key: string }[]) => void; ui: ReturnType<typeof useUI> }) {
  const [curl, setCurl] = useState('');
  const [busy, setBusy] = useState(false);
  const parse = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ step: FlowStep; credentialRefs: { placeholder: string; key: string }[] }>('/templates/parse-curl', { curl });
      ui.notify({ title: 'Parse thành công', message: `${r.step.method} ${r.step.urlTemplate}`, kind: 'success' });
      onParsed(r.step, r.credentialRefs);
    } catch (e: any) { ui.notify({ title: 'Lỗi parse', message: e.message, kind: 'error' }); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Tạo step từ curl" onClose={onClose} wide footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Hủy</Button>
      <Button variant="primary" icon={Icon.zap({})} tooltip="Phân tích curl thành 1 step" loading={busy} onClick={parse}>Parse</Button>
    </>}>
      <Textarea style={{ minHeight: 160 }} value={curl} onChange={(e) => setCurl(e.target.value)} placeholder={`curl -X POST https://api.github.com/user/repos -H "Authorization: Bearer TOKEN" -d '{"name":"demo"}'`} />
    </Modal>
  );
}

function SandboxModal({ onClose, ui }: { onClose: () => void; ui: ReturnType<typeof useUI> }) {
  const [code, setCode] = useState("return (inputs.repoName || 'repo').replace(/\\s+/g,'-').toLowerCase();");
  const [result, setResult] = useState('');
  const test = async () => {
    try {
      const r = await api.post<{ result?: string; error?: string }>('/engine/sandbox-test', { code, inputs: { repoName: 'My Repo' } });
      if (r.error) { setResult(''); ui.notify({ title: 'Sandbox lỗi', message: r.error, kind: 'error' }); }
      else setResult(r.result ?? '');
    } catch (e: any) { ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }); }
  };
  return (
    <Modal title="Advanced JS sandbox" onClose={onClose} wide footer={<>
      <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng" onClick={onClose}>Đóng</Button>
      <Button variant="primary" icon={Icon.play({})} tooltip="Chạy thử với input mẫu {repoName:'My Repo'}" onClick={test}>Test</Button>
    </>}>
      <span className="sandbox-badge">Chạy trong sandbox: cấm network/fs, timeout 200ms</span>
      <Textarea style={{ minHeight: 140 }} value={code} onChange={(e) => setCode(e.target.value)} />
      {result !== '' && <div style={{ marginTop: 8 }}>Kết quả: <span className="mono ph-hint">{result}</span></div>}
    </Modal>
  );
}
