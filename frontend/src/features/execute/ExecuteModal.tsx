import React, { useState } from 'react';
import { api, type FetchTemplate } from '../../api/api';
import { useUI } from '../../components/ui';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Field, Input } from '../../components/Field';
import { Icon } from '../../components/Icon';

interface StepResult {
  stepId: string;
  status: number;
  success: boolean;
  durationMs: number;
  extracted?: Record<string, unknown>;
  error?: string;
}
interface ExecResult {
  ok: boolean;
  steps: StepResult[];
  error?: string;
}

/**
 * Execute Modal ([UI] 10.3): hỏi input runtime → confirm (side-effect) → stepper progress.
 */
export function ExecuteModal({ template, ownerId, onClose, ui }: { template: FetchTemplate; ownerId: string; onClose: () => void; ui: ReturnType<typeof useUI> }) {
  const runtimeInputs = (template.inputs ?? []).filter((i) => i.source === 'runtime');
  const [values, setValues] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'input' | 'running' | 'done'>('input');
  const [result, setResult] = useState<ExecResult | null>(null);
  const [runningStep, setRunningStep] = useState(-1);

  const run = async () => {
    // confirm vì flow có side-effect (chức năng quan trọng)
    const okc = await ui.confirm({
      title: 'Chạy flow?',
      message: <>Flow <b>{template.name}</b> sẽ gọi API thật ({template.steps.length} step) và có thể tạo dữ liệu (repo, DNS...). Tiếp tục?</>,
      confirmLabel: 'Chạy',
    });
    if (!okc) return;
    setPhase('running');
    setRunningStep(0);
    try {
      const r = await api.post<ExecResult>('/fetch/execute', { ownerId, templateId: template.id, params: values });
      setResult(r);
      setRunningStep(-1);
      setPhase('done');
      if (r.ok) ui.notify({ title: 'Flow chạy xong', message: `${r.steps.length} step thành công.`, kind: 'success' });
      else ui.notify({ title: 'Flow lỗi', message: r.error ?? 'Có step thất bại.', kind: 'error' });
    } catch (e: any) {
      setPhase('done');
      ui.notify({ title: 'Lỗi execute', message: e.message, kind: 'error' });
    }
  };

  const stepClass = (i: number, s?: StepResult) => {
    if (phase === 'running' && i === runningStep) return 'running';
    if (s) return s.success ? 'success' : 'error';
    return '';
  };

  return (
    <Modal title={`Execute: ${template.name}`} onClose={onClose} wide footer={
      phase === 'input' ? (
        <>
          <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng, không chạy" onClick={onClose}>Hủy</Button>
          <Button variant="primary" icon={Icon.play({})} tooltip="Bắt đầu chạy flow (sẽ xác nhận vì có side-effect)" onClick={run}>Chạy</Button>
        </>
      ) : (
        <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng cửa sổ execute" onClick={onClose}>Đóng</Button>
      )
    }>
      {phase === 'input' && (
        <div className="form-scroll">
          {runtimeInputs.length === 0 ? (
            <div className="empty">Flow không có input runtime. Bấm "Chạy" để thực thi.</div>
          ) : (
            runtimeInputs.map((inp) => (
              <Field key={inp.name} label={`${inp.name}${inp.required ? ' *' : ''}`}>
                <Input value={values[inp.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [inp.name]: e.target.value }))} />
              </Field>
            ))
          )}
        </div>
      )}

      {phase !== 'input' && (
        <div className="stepper">
          {template.steps.map((s, i) => {
            const res = result?.steps[i];
            return (
              <div key={s.id} className={`step-item ${stepClass(i, res)}`}>
                <span className="step-dot" />
                <span className="badge badge--primary">{s.method}</span>
                <span style={{ flex: 1 }}>{s.id}</span>
                {res && <span className={`badge ${res.success ? 'badge--success' : 'badge--danger'}`}>{res.status || 'ERR'}</span>}
                {res && <span style={{ color: 'var(--text-muted)' }}>{res.durationMs}ms</span>}
                {res?.error && (
                  <Button iconOnly icon={Icon.info({})} variant="ghost" tooltip={`Xem lỗi: ${res.error}`} onClick={() => ui.notify({ title: `Log step ${s.id}`, message: res.error, kind: 'error' })} />
                )}
              </div>
            );
          })}
          {result && (
            <div style={{ marginTop: 'var(--sp-3)' }}>
              <div className="sidebar__group-title">Dữ liệu trích xuất</div>
              {result.steps.filter((s) => s.extracted).map((s) => (
                <div key={s.stepId} className="card">
                  <div className="card-row"><span className="k">Step</span><span className="mono">{s.stepId}</span></div>
                  {Object.entries(s.extracted ?? {}).map(([k, v]) => (
                    <div className="card-row" key={k}><span className="k mono">{k}</span><span className="mono">{JSON.stringify(v)}</span></div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
