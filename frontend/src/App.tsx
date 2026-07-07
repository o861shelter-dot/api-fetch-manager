import React, { useState } from 'react';
import { AppProvider, useApp } from './lib/appStore';
import { UIProvider } from './components/ui';
import { Button } from './components/Button';
import { Icon } from './components/Icon';
import { InspectMode } from './features/inspect/InspectMode';
import { CredentialsPage } from './pages/CredentialsPage';
import { FetchBuilderPage } from './pages/FetchBuilderPage';
import { HistoryPage } from './pages/HistoryPage';
import { IssuesPage } from './pages/IssuesPage';
import { ExtractionsPage } from './pages/ExtractionsPage';
import { VariablesPage } from './pages/VariablesPage';

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
  const { theme, toggleTheme, owners, ownerId, setOwnerId, inspect, setInspect } = useApp();
  const [page, setPage] = useState<Page>('credentials');
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="app">
      <header className="topbar">
        <button className="btn btn--ghost btn--icon menu-toggle" data-tooltip="Mở/đóng menu điều hướng" onClick={() => setDrawer((d) => !d)}>{Icon.menu({})}</button>
        <span className="topbar__logo">🍌 <span>API Fetch Manager</span></span>
        <div className="topbar__spacer" />
        <select
          className="select"
          style={{ width: 200 }}
          value={ownerId ?? ''}
          onChange={(e) => setOwnerId(e.target.value)}
          data-tooltip="Chọn emailOwner đang thao tác (áp dụng cho credential, execute, history...)"
        >
          {owners.length === 0 && <option value="">(chưa có owner)</option>}
          {owners.map((o) => <option key={o.id} value={o.id}>{o.email}</option>)}
        </select>
        <Button
          iconOnly
          variant={inspect ? 'primary' : 'ghost'}
          icon={Icon.target({})}
          tooltip="Bật/tắt chế độ tạo bug/issue từ giao diện (chọn element → tạo issue)"
          onClick={() => setInspect(!inspect)}
        />
        <Button
          iconOnly
          variant="ghost"
          icon={theme === 'light' ? Icon.moon({}) : Icon.sun({})}
          tooltip={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
          onClick={toggleTheme}
        />
      </header>

      <div className="body">
        <nav className={`sidebar ${drawer ? 'open' : ''}`}>
          <div className="sidebar__group-title">Điều hướng</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              data-tooltip={n.tip}
              onClick={() => { setPage(n.id); setDrawer(false); }}
            >
              {n.icon}<span>{n.label}</span>
            </button>
          ))}
        </nav>

        <main className="content">
          <div className="content__inner">
            {page === 'credentials' && <CredentialsPage />}
            {page === 'builder' && <FetchBuilderPage />}
            {page === 'history' && <HistoryPage />}
            {page === 'issues' && <IssuesPage />}
            {page === 'extractions' && <ExtractionsPage />}
            {page === 'variables' && <VariablesPage />}
          </div>
        </main>
      </div>

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
