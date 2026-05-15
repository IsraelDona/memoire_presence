function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1.2" />
      <rect x="15" y="3" width="6" height="6" rx="1.2" />
      <rect x="3" y="15" width="6" height="6" rx="1.2" />
      <rect x="15" y="15" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6.01" />
      <path d="M3.5 4v4h4" />
      <path d="M12 7v5l3.5 2.1" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 2.9 4.3 6.1 4.3 9s-1.5 6.1-4.3 9c-2.8-2.9-4.3-6.1-4.3-9S9.2 5.9 12 3Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4 10-10" />
      <path d="M4 4h16v16H4z" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3.5h10l4 4V20a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 20V5A1.5 1.5 0 0 1 5 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M8 13.5h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M8 13.5h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="3.5" />
    </svg>
  );
}

const ICONS = {
  grid: <GridIcon />,
  history: <HistoryIcon />,
  globe: <GlobeIcon />,
  check: <CheckIcon />,
  report: <ReportIcon />,
  document: <DocumentIcon />,
  profile: <ProfileIcon />,
};

function Sidebar({ activePage, onChangePage, items = [] }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">DGB</div>
        <div className="sidebar-brand-subtitle">e-presence</div>
      </div>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activePage === item.key ? 'sidebar-button active' : 'sidebar-button'}
            onClick={() => onChangePage(item.key)}
          >
            <span className="sidebar-icon" aria-hidden="true">
              {ICONS[item.icon] ?? <GridIcon />}
            </span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
