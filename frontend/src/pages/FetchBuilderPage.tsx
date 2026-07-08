import React, { useEffect, useRef, useState } from 'react';
import { api, type FetchTemplate, type FlowStep, type FlowInput } from '../api/api';
import { useApp } from '../lib/appStore';
import { useUI } from '../components/ui';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Field, Input, Textarea } from '../components/Field';
import { Icon } from '../components/Icon';
import { Combobox } from '../components/Combobox';
import { KeyPicker } from '../components/KeyPicker';
import { ExecuteModal } from '../features/execute/ExecuteModal';

interface FlowPreset extends Omit<FetchTemplate, 'updatedAt'> {
 description?: string;
 isPreset: true;
}

function newStep(): FlowStep {
 return { id: 'step_' + Math.random().toString(36).slice(2, 8), method: 'GET', urlTemplate: '', headers: {}, bodyTemplate: '', extract: [] };
}

function blankTemplate(): FetchTemplate {
 return { id: '', name: '', service: '', business: '', stopOnError: true, inputs: [], credentialRefs: [], steps: [newStep()], createdAt: 0, updatedAt: 0 };
}

export function FetchBuilderPage() {
 const { ownerId } = useApp();
 const ui = useUI();
 const [templates, setTemplates] = useState<FetchTemplate[]>([]);
 const [editing, setEditing] = useState<FetchTemplate | null>(null);
 const [executing, setExecuting] = useState<FetchTemplate | null>(null);
 const [presetOpen, setPresetOpen] = useState(false);

 const load = async () => setTemplates(await api.get<FetchTemplate[]>('/templates'));
 useEffect(() => {
 load().catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const del = async (t: FetchTemplate) => {
 const okc = await ui.confirm({ title: 'Xóa template', message: <>Xóa <b>{t.name}</b>? Không thể hoàn tác.</>, danger: true, confirmLabel: 'Xóa' });
 if (!okc) return;
 await api.del(`/templates/${t.id}`);
 ui.notify({ title: 'Đã xóa', message: t.name, kind: 'success' });
 load();
 };

 const execute = (t: FetchTemplate) => {
 if (!ownerId) return ui.notify({ title: 'Chưa chọn owner', message: 'Chọn emailOwner ở thanh trên trước khi execute.', kind: 'warning' });
 setExecuting(t);
 };

 return (
 <div className="page">
 <div className="page-head">
 <div>
 <h1 className="page-title">Fetch Builder</h1>
 <p className="page-desc">Tạo API tái sử dụng từ curl · flow nhiều step · trích xuất dữ liệu</p>
 </div>
 </div>

 <div className="toolbar">
 <Button icon={Icon.plus({})} tooltip="Tạo flow mới từ đầu" variant="primary" onClick={() => setEditing(blankTemplate())}>Flow mới</Button>
 <Button icon={Icon.copy({})} tooltip="Tạo flow từ mẫu có sẵn (lưu trong database)" onClick={() => setPresetOpen(true)}>Tạo từ mẫu</Button>
 </div>

 {templates.length === 0 ? (
 <p className="empty">Chưa có template. Bấm "Flow mới" hoặc "Tạo từ mẫu".</p>
 ) : (
 <table className="table">
 <thead><tr><th>Tên</th><th>Service</th><th>Business</th><th>Steps</th><th></th></tr></thead>
 <tbody>
 {templates.map((t) => (
 <tr key={t.id}>
 <td>{t.name}</td>
 <td>{t.service}</td>
 <td>{t.business}</td>
 <td>{t.steps?.length ?? 0}</td>
 <td className="row-actions">
 <Button iconOnly icon={Icon.play({})} tooltip="Execute flow này" onClick={() => execute(t)} />
 <Button iconOnly icon={Icon.edit({})} tooltip="Sửa flow" onClick={() => setEditing(t)} />
 <Button iconOnly icon={Icon.trash({})} tooltip="Xóa flow" variant="danger" onClick={() => del(t)} />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}

 {editing && <BuilderModal initial={editing} ownerId={ownerId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} ui={ui} />}
 {executing && ownerId && <ExecuteModal ownerId={ownerId} template={executing} onClose={() => setExecuting(null)} ui={ui} />}
 {presetOpen && <PresetPicker onClose={() => setPresetOpen(false)} onPick={(tpl) => { setPresetOpen(false); setEditing(tpl); }} ui={ui} />}
 </div>
 );
}

/* -------------------- Preset picker (Tạo từ mẫu) -------------------- */
function PresetPicker({ onClose, onPick, ui }: { onClose: () => void; onPick: (t: FetchTemplate) => void; ui: ReturnType<typeof useUI> }) {
 const [presets, setPresets] = useState<FlowPreset[]>([]);
 useEffect(() => {
 api.get<FlowPreset[]>('/flow-presets').then(setPresets).catch((e) => ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' }));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
 const use = (p: FlowPreset) => {
 const tpl: FetchTemplate = {
 id: '', name: p.name, service: p.service, business: p.business, stopOnError: p.stopOnError ?? true,
 inputs: p.inputs ?? [], credentialRefs: p.credentialRefs ?? [], steps: p.steps ?? [newStep()], createdAt: 0, updatedAt: 0,
 };
 onPick(tpl);
 };
 return (
 <Modal title="Tạo từ mẫu" onClose={onClose} footer={<Button variant="ghost" tooltip="Đóng" onClick={onClose}>Đóng</Button>}>
 {presets.length === 0 ? (
 <p className="empty">Chưa có mẫu nào. Chạy seed hoặc lưu 1 flow thành mẫu.</p>
 ) : (
 <div className="sel-list">
 {presets.map((p) => (
 <div className="kv-row" key={p.id}>
 <span className="k">{p.name}<br /><small className="muted">{p.description}</small></span>
 <span className="v"><Button icon={Icon.copy({})} tooltip="Dùng mẫu này" onClick={() => use(p)}>Dùng</Button></span>
 </div>
 ))}
 </div>
 )}
 </Modal>
 );
}

/* -------------------- Builder Modal -------------------- */
function BuilderModal({ initial, ownerId, onClose, onSaved, ui }: { initial: FetchTemplate; ownerId: string | null; onClose: () => void; onSaved: () => void; ui: ReturnType<typeof useUI> }) {
 const [tpl, setTpl] = useState<FetchTemplate>(structuredClone(initial));
 const [activeStep, setActiveStep] = useState(0);
 const [curlOpen, setCurlOpen] = useState(false);
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

 const saveAsPreset = async () => {
 if (!tpl.name.trim() || tpl.steps.length === 0) return ui.notify({ title: 'Thiếu dữ liệu', message: 'Cần tên flow và ít nhất 1 step.', kind: 'warning' });
 try {
 await api.post('/flow-presets', { name: tpl.name, description: `${tpl.service} · ${tpl.business}`, service: tpl.service, business: tpl.business, stopOnError: tpl.stopOnError, inputs: tpl.inputs, credentialRefs: tpl.credentialRefs, steps: tpl.steps });
 ui.notify({ title: 'Đã lưu thành mẫu', message: `Mẫu "${tpl.name}" dùng được cho owner khác.`, kind: 'success' });
 } catch (e: any) {
 ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' });
 }
 };

 return (
 <Modal title={tpl.id ? 'Sửa flow' : 'Flow mới'} onClose={onClose} wide footer={
 <>
 <Button variant="ghost" icon={Icon.upload({})} tooltip="Tạo step từ lệnh curl" onClick={() => setCurlOpen(true)}>Từ curl</Button>
 <Button variant="ghost" icon={Icon.copy({})} tooltip="Lưu flow này thành mẫu (dùng cho owner khác)" onClick={saveAsPreset}>Lưu thành mẫu</Button>
 <Button variant="ghost" tooltip="Hủy" onClick={onClose}>Hủy</Button>
 <Button variant="primary" icon={Icon.save({})} tooltip="Lưu flow" loading={saving} onClick={save}>Lưu flow</Button>
 </>
 }>
 <div className="form-scroll">
 <Field label="Tên flow"><Combobox field="flowName" value={tpl.name} onChange={(v) => patch({ name: v })} placeholder="vd: GitHub - Tạo repo" /></Field>
 <Field label="Service"><Combobox field="service" value={tpl.service} onChange={(v) => patch({ service: v })} placeholder="github.com" /></Field>
 <Field label="Business"><Combobox field="business" value={tpl.business} onChange={(v) => patch({ business: v })} placeholder="create-repo" /></Field>

 <InputsEditor inputs={tpl.inputs ?? []} onChange={(inputs) => patch({ inputs })} />

 <div className="row" style={{ alignItems: 'flex-start' }}>
 <div style={{ flex: '0 0 200px' }}>
 <label className="muted">Steps</label>
 {tpl.steps.map((s, i) => (
 <div key={s.id} className={`step-item ${i === activeStep ? 'success' : ''}`} onClick={() => setActiveStep(i)} style={{ cursor: 'pointer' }}>
 <span className="badge badge--primary">{s.method}</span>
 <span>{i + 1}. {s.id}</span>
 <span data-tooltip="Xóa step này" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); delStep(i); }}>{Icon.trash({})}</span>
 </div>
 ))}
 <Button icon={Icon.plus({})} tooltip="Thêm step" onClick={addStep}>Thêm step</Button>
 </div>
 <div style={{ flex: 1 }}>
 {step ? <StepEditor step={step} ownerId={ownerId} onChange={(p) => patchStep(activeStep, p)} /> : <p className="muted">Chọn hoặc thêm step.</p>}
 </div>
 </div>
 </div>

 {curlOpen && <CurlModal onClose={() => setCurlOpen(false)} onParsed={(s, refs) => {
 setTpl((t) => ({ ...t, steps: [...t.steps, s], credentialRefs: [...(t.credentialRefs ?? []), ...refs] }));
 setCurlOpen(false);
 }} ui={ui} />}
 </Modal>
 );
}

function InputsEditor({ inputs, onChange }: { inputs: FlowInput[]; onChange: (v: FlowInput[]) => void }) {
 const add = () => onChange([...inputs, { name: '', source: 'runtime', required: false }]);
 const patch = (i: number, p: Partial<FlowInput>) => { const c = [...inputs]; c[i] = { ...c[i], ...p }; onChange(c); };
 return (
 <div className="field">
 <label>Inputs</label>
 {inputs.map((inp, i) => (
 <div className="row" key={i}>
 <input className="input" placeholder="tên input" value={inp.name} onChange={(e) => patch(i, { name: e.target.value })} />
 <select className="select" value={inp.source} data-tooltip="runtime=hỏi khi chạy; store=lấy từ kho biến; context=từ step trước" onChange={(e) => patch(i, { source: e.target.value as any })}>
 <option value="runtime">runtime</option>
 <option value="store">store</option>
 <option value="context">context</option>
 </select>
 {inp.source === 'store' && <input className="input" placeholder="varKey" value={inp.varKey ?? ''} onChange={(e) => patch(i, { varKey: e.target.value })} />}
 {inp.source === 'context' && <input className="input" placeholder="stepId.field" value={inp.ref ?? ''} onChange={(e) => patch(i, { ref: e.target.value })} />}
 <Button iconOnly icon={Icon.trash({})} tooltip="Xóa input" variant="danger" onClick={() => onChange(inputs.filter((_, x) => x !== i))} />
 </div>
 ))}
 <Button icon={Icon.plus({})} tooltip="Thêm input" onClick={add}>Thêm input</Button>
 </div>
 );
}

const BODY_PRESETS: Record<string, string> = {
 json: '{\n  \n}',
 raw: '',
 form: 'key=value',
};

function StepEditor({ step, ownerId, onChange }: { step: FlowStep; ownerId: string | null; onChange: (p: Partial<FlowStep>) => void }) {
 const headers = step.headers ?? {};
 const hEntries = Object.entries(headers);
 const bodyRef = useRef<HTMLTextAreaElement>(null);
 const [bodyFormat, setBodyFormat] = useState<'json' | 'raw' | 'form'>('json');

 const setHeader = (idx: number, k: string, v: string) => {
 const e = hEntries.map((x) => [...x] as [string, string]);
 e[idx] = [k, v];
 onChange({ headers: Object.fromEntries(e.filter(([kk]) => kk)) });
 };
 const addHeader = () => onChange({ headers: { ...headers, '': '' } });
 const addPresetHeader = (k: string, v: string) => onChange({ headers: { ...headers, [k]: v } });
 const extract = step.extract ?? [];

 const beautify = () => {
 try {
 onChange({ bodyTemplate: JSON.stringify(JSON.parse(step.bodyTemplate || '{}'), null, 2) });
 } catch {
 /* body có placeholder → không parse được, bỏ qua */
 }
 };

 const insertIntoBody = (ph: string) => {
 const ta = bodyRef.current;
 const cur = step.bodyTemplate ?? '';
 if (!ta) return onChange({ bodyTemplate: cur + ph });
 const start = ta.selectionStart ?? cur.length;
 const end = ta.selectionEnd ?? cur.length;
 onChange({ bodyTemplate: cur.slice(0, start) + ph + cur.slice(end) });
 };

 return (
 <div>
 <div className="row">
 <Field label="Method">
 <select className="select" value={step.method} onChange={(e) => onChange({ method: e.target.value })}>
 {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
 </select>
 </Field>
 <Field label="URL template"><Input value={step.urlTemplate} onChange={(e) => onChange({ urlTemplate: e.target.value })} placeholder="https://api.github.com/user/repos" /></Field>
 </div>

 <label className="muted">Headers</label>
 {hEntries.map(([k, v], i) => (
 <div className="row" key={i}>
 <input className="input" placeholder="header" value={k} onChange={(e) => setHeader(i, e.target.value, v)} />
 <input className="input" placeholder="value" value={v} onChange={(e) => setHeader(i, k, e.target.value)} />
 </div>
 ))}
 <div className="row">
 <Button icon={Icon.plus({})} tooltip="Thêm header trống" onClick={addHeader}>Header</Button>
 <Button tooltip="Thêm header Authorization: Bearer {{...}}" onClick={() => addPresetHeader('Authorization', 'Bearer {{github.token}}')}>+ Auth</Button>
 <Button tooltip="Thêm header Content-Type: application/json" onClick={() => addPresetHeader('Content-Type', 'application/json')}>+ JSON</Button>
 <KeyPicker ownerId={ownerId} onInsert={(ph) => addPresetHeader('Authorization', `Bearer ${ph}`)} />
 </div>

 <div className="row" style={{ marginTop: 'var(--sp-3)' }}>
 <Field label="Body định dạng">
 <select className="select" value={bodyFormat} onChange={(e) => { const f = e.target.value as any; setBodyFormat(f); if (!step.bodyTemplate) onChange({ bodyTemplate: BODY_PRESETS[f] }); }}>
 <option value="json">JSON</option>
 <option value="raw">raw</option>
 <option value="form">form</option>
 </select>
 </Field>
 <div style={{ display: 'flex', gap: 'var(--sp-1)', alignItems: 'flex-end' }}>
 <Button icon={Icon.zap({})} tooltip="Beautify JSON cho dễ đọc" onClick={beautify}>Beautify</Button>
 <KeyPicker ownerId={ownerId} onInsert={insertIntoBody} />
 </div>
 </div>
 <Textarea ref={bodyRef as any} rows={5} value={step.bodyTemplate} onChange={(e) => onChange({ bodyTemplate: e.target.value })} placeholder={'{ "name": "{{repoName | lower}}" }'} />
 <p className="ph-hint">Placeholder: {'{{credential}}'} · {'{{var.x}}'} · {'{{ctx.step.field}}'} · {'{{input.x | upper}}'}</p>

 <label className="muted">Extract (JSONPath)</label>
 {extract.map((ex, i) => (
 <div className="row" key={i}>
 <input className="input" placeholder="field" value={ex.field} onChange={(e) => { const c = [...extract]; c[i] = { ...c[i], field: e.target.value }; onChange({ extract: c }); }} />
 <input className="input" placeholder="$.path" value={ex.jsonPath} onChange={(e) => { const c = [...extract]; c[i] = { ...c[i], jsonPath: e.target.value }; onChange({ extract: c }); }} />
 <input className="input" placeholder="pin var (tuỳ chọn)" value={ex.pinToVar ?? ''} onChange={(e) => { const c = [...extract]; c[i] = { ...c[i], pinToVar: e.target.value || undefined }; onChange({ extract: c }); }} />
 <Button iconOnly icon={Icon.trash({})} tooltip="Xóa dòng extract" variant="danger" onClick={() => onChange({ extract: extract.filter((_, x) => x !== i) })} />
 </div>
 ))}
 <Button icon={Icon.plus({})} tooltip="Thêm dòng extract" onClick={() => onChange({ extract: [...extract, { field: '', jsonPath: '' }] })}>Thêm extract</Button>
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
 <Modal title="Tạo step từ curl" onClose={onClose} wide footer={
 <>
 <Button variant="ghost" tooltip="Hủy" onClick={onClose}>Hủy</Button>
 <Button variant="primary" icon={Icon.zap({})} tooltip="Parse curl thành step" loading={busy} onClick={parse}>Parse</Button>
 </>
 }>
 <Textarea rows={6} value={curl} onChange={(e) => setCurl(e.target.value)} placeholder={`curl -X POST https://api.github.com/user/repos -H "Authorization: Bearer TOKEN" -d '{"name":"demo"}'`} />
 </Modal>
 );
}
