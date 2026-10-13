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
  ChevronRight,
  Stethoscope,
  Terminal,
  Database,
  Layers,
  History,
  Play,
  TrendingUp,
  GitBranch,
  Brain,
  Globe,
  LogOut,
  PlusCircle
} from 'lucide-react';
import { UserRole } from '../types';
import { DoctorSubPage } from '../views/DoctorWorkspaceView';
import { DeveloperTab } from '../views/DeveloperConsoleView';

export type NavigationPage =
  | 'landing'
  | 'doctor-workspace'
  | 'developer-console'
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
  doctorSubPage?: DoctorSubPage;
  onSelectDoctorSubPage?: (subPage: DoctorSubPage) => void;
  developerSubPage?: DeveloperTab;
  onSelectDeveloperSubPage?: (tab: DeveloperTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  systemReady: boolean;
  userRole?: UserRole;
  onLogout?: () => void;
  onReturnLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  doctorSubPage = 'overview',
  onSelectDoctorSubPage,
  developerSubPage = 'overview',
  onSelectDeveloperSubPage,
  collapsed,
  onToggleCollapse,
  systemReady,
  userRole = 'doctor',
  onLogout,
  onReturnLanding
}) => {
  // Doctor Navigation Items
  const doctorNavItems: { id: DoctorSubPage; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'new-analysis', label: 'New Analysis', icon: PlusCircle },
    { id: 'current-data', label: 'Data Input', icon: UploadCloud },
    { id: 'eeg', label: 'EEG Analysis', icon: Activity },
    { id: 'neuroimaging', label: 'Neuroimaging', icon: Layers },
    { id: 'brain-map', label: 'Brain Map', icon: Brain },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Cpu },
    { id: 'severity', label: 'Severity', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'history', label: 'Analysis History', icon: History }
  ];

  // Developer Navigation Items
  const developerNavItems: { id: DeveloperTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'experiments', label: 'Experiments', icon: Layers },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'training', label: 'Training Runs', icon: Play },
    { id: 'metrics', label: 'Metrics', icon: TrendingUp },
    { id: 'evaluation', label: 'Evaluation', icon: LineChart },
    { id: 'comparison', label: 'Model Comparison', icon: GitCompare },
    { id: 'explainability', label: 'Explainability', icon: Eye },
    { id: 'errors', label: 'Error Analysis', icon: AlertTriangle },
    { id: 'versions', label: 'Model Versions', icon: GitBranch }
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between border-r border-border bg-white transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-panel-light border border-border flex items-center justify-center text-forest flex-shrink-0">
              {userRole === 'doctor' ? (
                <Stethoscope className="w-4 h-4" />
              ) : (
                <Terminal className="w-4 h-4" />
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-serif text-base tracking-tight text-forest font-semibold leading-tight">
                  NEUROFUSION <span className="font-sans font-light text-muted text-[10px]">AI</span>
                </span>
                <span className="text-[10px] text-muted font-mono tracking-tight truncate">
                  {userRole === 'doctor' ? 'DOCTOR WORKSPACE' : 'RESEARCH LAB'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-full text-muted hover:text-forest hover:bg-panel-light transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-190px)]">
          <div className="space-y-1">
            {!collapsed && (
              <span className="text-[10px] font-mono text-muted font-semibold uppercase tracking-wider px-3 block mb-2">
                {userRole === 'doctor' ? 'CLINICAL ANALYSIS' : 'RESEARCH MODULES'}
              </span>
            )}

            {userRole === 'doctor' &&
              doctorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === 'doctor-workspace' && doctorSubPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPage('doctor-workspace');
                      if (onSelectDoctorSubPage) onSelectDoctorSubPage(item.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-sans transition-all rounded-card ${
                      isActive
                        ? 'bg-panel-light text-forest font-semibold border-l-[3px] border-forest'
                        : 'text-muted hover:text-forest hover:bg-page'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-forest' : 'text-muted'}`} />
                    {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  </button>
                );
              })}

            {userRole === 'developer' &&
              developerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === 'developer-console' && developerSubPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPage('developer-console');
                      if (onSelectDeveloperSubPage) onSelectDeveloperSubPage(item.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-sans transition-all rounded-card ${
                      isActive
                        ? 'bg-panel-light text-forest font-semibold border-l-[3px] border-forest'
                        : 'text-muted hover:text-forest hover:bg-page'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-forest' : 'text-muted'}`} />
                    {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  </button>
                );
              })}
          </div>

          {/* Quick Return to Public Website */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => {
                if (onReturnLanding) onReturnLanding();
                else onSelectPage('landing');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-sans text-muted hover:text-forest hover:bg-panel-light rounded-card transition-colors"
              title="Return to Public Website"
            >
              <Globe className="w-4 h-4 text-forest flex-shrink-0" />
              {!collapsed && <span className="truncate flex-1 text-left">Public Website</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* System Status & Logout Footer */}
      <div className="p-3 border-t border-border bg-page space-y-2">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-card bg-white border border-border">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${systemReady ? 'bg-healthy' : 'bg-warning animate-pulse'}`} />
              <span className="text-[11px] font-mono text-forest font-medium">
                {systemReady ? 'READY' : 'CALIBRATING'}
              </span>
            </div>
            <span className="text-[10px] text-muted font-mono">v1.0-RES</span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className={`w-2 h-2 rounded-full ${systemReady ? 'bg-healthy' : 'bg-warning'}`} />
          </div>
        )}

        {onLogout && !collapsed && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs font-sans text-muted hover:text-risk hover:bg-risk-light transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
