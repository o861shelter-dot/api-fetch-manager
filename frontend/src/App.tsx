import React, { useState } from 'react';
import { AppProvider, useApp } from './lib/appStore';
import { UIProvider, useUI } from './components/ui';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { Field, Input } from './components/Field';
import { Icon } from './components/Icon';
import { InspectMode } from './features/inspect/InspectMode';
import { CredentialsPage } from './pages/CredentialsPage';
import { FetchBuilderPage } from './pages/FetchBuilderPage';
import { HistoryPage } from './pages/HistoryPage';
import { IssuesPage } from './pages/IssuesPage';
import { ExtractionsPage } from './pages/ExtractionsPage';
import { VariablesPage } from './pages/VariablesPage';
import { api, getAdminToken } from './api/api';

type Page = 'credentials' | 'builder' | 'history' | 'issues' | 'extractions' | 'variables';

const NAV: { id: Page; label: string; icon: React.ReactNode; tip: string }[] = [
 { id: 'credentials', label: 'Credentials', icon: Icon.key({}), tip: 'Quản lý key theo owner' },
 { id: 'builder', label: 'Fetch Builder', icon: Icon.zap({}), tip: 'Tạo & chạy flow API' },
 { id: 'history', label: 'History & Logs', icon: Icon.history({}), tip: 'Lịch sử gọi & log' },
 { id: 'extractions', label: 'Extracted Data', icon: Icon.db({}), tip: 'Dữ liệu trích xuất từ các lần fetch' },
 { id: 'variables', label: 'Variables', icon: Icon.vars({}), tip: 'Kho biến tái sử dụng' },
 { id: 'issues', label: 'Issues', icon: Icon.bug({}), tip: 'Quản lý bug/issue' },
];

function Shell() {
 const { theme, toggleTheme, owners, ownerId, setOwnerId, inspect, setInspect, inspectHotkey } = useApp();
 const ui = useUI();
 const [page, setPage] = useState<Page>('credentials');
 const [drawer, setDrawer] = useState(false);
 const [tokenOpen, setTokenOpen] = useState(false);
 const [tokenDraft, setTokenDraft] = useState(() => getAdminToken() ?? '');

 const saveToken = () => {
 const trimmed = tokenDraft.trim();
 if (!trimmed) {
 api.clearAdminToken();
 setTokenDraft('');
 ui.notify({ kind: 'warning', title: 'Đã xoá token', message: 'Frontend sẽ không gửi Authorization header cho các API cần bảo vệ.' });
 } else {
 api.setAdminToken(trimmed);
 setTokenDraft(trimmed);
 ui.notify({ kind: 'success', title: 'Đã lưu token', message: 'Các request API tiếp theo sẽ gửi Authorization: Bearer.' });
 }
 setTokenOpen(false);
 };

 return (
 <div className="app">
 <div className="topbar">
 <button className="btn btn--ghost btn--icon menu-toggle" data-tooltip="Mở menu" onClick={() => setDrawer((d) => !d)}>{Icon.menu({})}</button>
 <span className="topbar__logo">🍌 API Fetch Manager</span>
 <div className="topbar__spacer" />
 <select
 className="select"
 style={{ maxWidth: 220 }}
 value={ownerId ?? ''}
 onChange={(e) => setOwnerId(e.target.value)}
 data-tooltip="Chọn emailOwner đang thao tác (áp dụng cho credential, execute, history...)"
 >
 {owners.length === 0 && <option value="">(chưa có owner)</option>}
 {owners.map((o) => <option key={o.id} value={o.id}>{o.email}</option>)}
 </select>
 <Button iconOnly icon={Icon.key({})} tooltip="Cấu hình Admin API token (bắt buộc khi backend bật auth)" onClick={() => { setTokenDraft(getAdminToken() ?? ''); setTokenOpen(true); }} />
 <Button iconOnly icon={Icon.target({})} tooltip={`Bật/tắt chế độ inspect tạo issue (phím tắt ${inspectHotkey})`} variant={inspect ? 'primary' : 'default'} onClick={() => setInspect(!inspect)} />
 <Button iconOnly icon={theme === 'dark' ? Icon.sun({}) : Icon.moon({})} tooltip="Đổi giao diện sáng/tối" onClick={toggleTheme} />
 </div>

 <div className="body">
 <div className={'sidebar' + (drawer ? ' open' : '')}>
 <div className="sidebar__group-title">Điều hướng</div>
 {NAV.map((n) => (
 <button key={n.id} className={'nav-item' + (page === n.id ? ' active' : '')} data-tooltip={n.tip} onClick={() => { setPage(n.id); setDrawer(false); }}>
 {n.icon} <span>{n.label}</span>
 </button>
 ))}
 </div>

 <div className="content">
 <div className="content__inner">
 {page === 'credentials' && <CredentialsPage />}
 {page === 'builder' && <FetchBuilderPage />}
 {page === 'history' && <HistoryPage />}
 {page === 'issues' && <IssuesPage />}
 {page === 'extractions' && <ExtractionsPage />}
 {page === 'variables' && <VariablesPage />}
 </div>
 </div>
 </div>

 {tokenOpen && (
 <Modal
 title="Admin API token"
 onClose={() => setTokenOpen(false)}
 variant="info"
 footer={
 <>
 <Button variant="ghost" tooltip="Xoá token khỏi trình duyệt" onClick={() => { setTokenDraft(''); api.clearAdminToken(); setTokenOpen(false); }}>Xoá</Button>
 <Button variant="primary" icon={Icon.save({})} tooltip="Lưu token vào localStorage của trình duyệt" onClick={saveToken}>Lưu token</Button>
 </>
 }
 >
 <p className="page-desc" style={{ textAlign: 'center', marginBottom: 'var(--sp-3)' }}>
 Nhập giá trị <code>API_FETCH_MANAGER_ADMIN_TOKEN</code>. Token chỉ lưu trong localStorage của trình duyệt này; có thể cấu hình sẵn bằng <code>VITE_API_FETCH_MANAGER_ADMIN_TOKEN</code> khi build.
 </p>
 <div className="field field--center">
 <label>Admin API token</label>
 <Input value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} placeholder="Bearer token..." autoComplete="off" />
 </div>
 </Modal>
 )}

 <InspectMode />
 </div>
 );
}

export default function App() {
 return (
 <AppProvider>
 <UIProvider>
 <Shell />
 </UIProvider>
 </AppProvider>
 );
}
