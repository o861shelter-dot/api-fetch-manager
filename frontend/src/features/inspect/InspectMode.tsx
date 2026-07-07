import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../lib/appStore';
import { useUI } from '../../components/ui';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Field, Input, Textarea } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { api, type Issue } from '../../api/api';

interface SelEl {
  el: HTMLElement;
  selector: string;
  outerHTML: string;
  rect: DOMRect;
}

function cssPath(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  const parts: string[] = [];
  let cur: HTMLElement | null = el;
  let depth = 0;
  while (cur && cur.nodeType === 1 && depth < 4) {
    let sel = cur.tagName.toLowerCase();
    if (cur.className && typeof cur.className === 'string') {
      const cls = cur.className.split(/\s+/).filter((c) => c && !c.startsWith('inspect-')).slice(0, 2);
      if (cls.length) sel += '.' + cls.join('.');
    }
    parts.unshift(sel);
    cur = cur.parentElement;
    depth++;
  }
  return parts.join(' > ');
}

/**
 * Inspect Element Mode ([UI] 6, [SYS] 3.4): bật → hover highlight, click chọn nhiều element,
 * tạo issue kèm info element. FAB hiện số element đã chọn.
 */
export function InspectMode({ onCreated }: { onCreated?: () => void }) {
  const { inspect } = useApp();
  const ui = useUI();
  const [selected, setSelected] = useState<SelEl[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const hoverRef = useRef<HTMLElement | null>(null);
  const selectedRef = useRef<SelEl[]>([]);
  selectedRef.current = selected;

  useEffect(() => {
    if (!inspect) {
      // dọn dẹp
      document.body.classList.remove('inspecting');
      document.querySelectorAll('.inspect-hover,.inspect-selected').forEach((n) => n.classList.remove('inspect-hover', 'inspect-selected'));
      setSelected([]);
      setFormOpen(false);
      return;
    }
    document.body.classList.add('inspecting');

    const isUi = (t: HTMLElement) => t.closest('.overlay, .inspect-fab, .topbar');

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (isUi(t)) return;
      if (hoverRef.current) hoverRef.current.classList.remove('inspect-hover');
      hoverRef.current = t;
      if (!t.classList.contains('inspect-selected')) t.classList.add('inspect-hover');
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (isUi(t)) return;
      e.preventDefault();
      e.stopPropagation();
      t.classList.remove('inspect-hover');
      const exists = selectedRef.current.find((s) => s.el === t);
      if (exists) {
        t.classList.remove('inspect-selected');
        setSelected((s) => s.filter((x) => x.el !== t));
      } else {
        t.classList.add('inspect-selected');
        setSelected((s) => [
          ...s,
          { el: t, selector: cssPath(t), outerHTML: t.outerHTML.slice(0, 500), rect: t.getBoundingClientRect() },
        ]);
      }
    };

    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [inspect]);

  if (!inspect) return null;

  return (
    <>
      {selected.length > 0 && (
        <div className="inspect-fab">
          <Button variant="primary" icon={Icon.bug({})} tooltip="Tạo issue từ các element đã chọn (mở form nhập tiêu đề/mô tả)" onClick={() => setFormOpen(true)}>
            Tạo issue ({selected.length})
          </Button>
        </div>
      )}
      {formOpen && <IssueForm elements={selected} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); onCreated?.(); }} ui={ui} />}
    </>
  );
}

function IssueForm({
  elements,
  onClose,
  onSaved,
  ui,
}: {
  elements: SelEl[];
  onClose: () => void;
  onSaved: () => void;
  ui: ReturnType<typeof useUI>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      ui.notify({ title: 'Thiếu tiêu đề', message: 'Vui lòng nhập tiêu đề issue.', kind: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await api.post<Issue>('/issues', {
        type: 'bug',
        title,
        description,
        expectedResult,
        elements: elements.map((e) => ({
          selector: e.selector,
          outerHTML: e.outerHTML,
          boundingRect: { x: Math.round(e.rect.x), y: Math.round(e.rect.y), w: Math.round(e.rect.width), h: Math.round(e.rect.height) },
        })),
      });
      ui.notify({ title: 'Đã tạo issue', message: 'Issue đã được lưu vào hệ thống.', kind: 'success' });
      onSaved();
    } catch (e: any) {
      ui.notify({ title: 'Lỗi', message: e.message, kind: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Tạo issue từ ${elements.length} element`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" icon={Icon.x({})} tooltip="Đóng, không tạo issue" onClick={onClose}>Hủy</Button>
          <Button variant="primary" icon={Icon.save({})} tooltip="Lưu issue kèm thông tin element đã chọn" loading={saving} onClick={save}>Lưu issue</Button>
        </>
      }
    >
      <div className="form-scroll">
        <Field label="Tiêu đề *"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Button lưu không phản hồi" /></Field>
        <Field label="Mô tả"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="Kết quả mong muốn"><Textarea value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} /></Field>
        <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Element đã chọn:</label>
        {elements.map((e, i) => (
          <div key={i} className="mono" style={{ padding: '2px 0', color: 'var(--text-muted)' }}>{e.selector}</div>
        ))}
      </div>
    </Modal>
  );
}
