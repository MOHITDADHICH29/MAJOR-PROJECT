import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  Eye,
  Share2,
  LineChart,
  GitCompare,
  AlertTriangle,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type NavigationPage =
  | 'overview'
  | 'data-input'
  | 'prediction'
  | 'explainability'
  | 'connectivity'
  | 'evaluation'
  | 'comparison'
  | 'severity'
  | 'report';

interface SidebarProps {
  activePage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  systemReady: boolean;
}

const navItems = [
  { id: 'overview' as NavigationPage, label: 'Overview', icon: LayoutDashboard },
  { id: 'data-input' as NavigationPage, label: 'Data Input', icon: UploadCloud },
  { id: 'prediction' as NavigationPage, label: 'Prediction', icon: Cpu },
  { id: 'explainability' as NavigationPage, label: 'Explainable AI', icon: Eye },
  { id: 'connectivity' as NavigationPage, label: 'Brain Connectivity', icon: Share2 },
  { id: 'evaluation' as NavigationPage, label: 'Evaluation', icon: LineChart },
  { id: 'comparison' as NavigationPage, label: 'Model Comparison', icon: GitCompare },
  { id: 'severity' as NavigationPage, label: 'Severity Estimation', icon: AlertTriangle, badge: 'N/A' },
  { id: 'report' as NavigationPage, label: 'Research Report', icon: FileText },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  systemReady,
}) => {
  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between border-r border-slate-800/80 bg-dark-900/95 backdrop-blur-xl transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-violet-500 flex items-center justify-center shadow-glow-cyan flex-shrink-0">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-wide text-slate-100 uppercase">
                  NeuroFusion <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight truncate">
                  Multimodal SZ Detection
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800/60 bg-dark-800/30">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${systemReady ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${systemReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                {systemReady ? 'SYSTEM READY' : 'CALIBRATING'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">v1.0-RES</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${systemReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
        )}
      </div>
    </aside>
  );
};
