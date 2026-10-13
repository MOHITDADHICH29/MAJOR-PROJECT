/**
 * NeuroFusion AI — Route Guard
 * Prevents unauthenticated access to protected pages.
 * Enforces role-based page access — doctors cannot reach developer-only pages and vice versa.
 */
import React from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_ALLOWED_PAGES } from '../../services/mockData';

interface RouteGuardProps {
  currentUser: UserProfile | null;
  activePage: string;
  onRequestLogin: (role?: UserRole) => void;
  children: React.ReactNode;
}

const PUBLIC_PAGES = ['landing'];

export const RouteGuard: React.FC<RouteGuardProps> = ({
  currentUser,
  activePage,
  onRequestLogin,
  children
}) => {
  // Public pages always accessible
  if (PUBLIC_PAGES.includes(activePage)) return <>{children}</>;

  // Not authenticated
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-warning-light border border-warning/40 flex items-center justify-center">
          <Lock className="w-8 h-8 text-warning" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-forest">Authentication Required</h2>
          <p className="text-sm text-body-light font-sans max-w-sm mx-auto">
            You must be signed in to access this page. Please authenticate with your role credentials.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onRequestLogin('doctor')}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-forest text-white hover:bg-forest/90 transition-colors shadow-sm"
          >
            Sign In as Doctor
          </button>
          <button
            onClick={() => onRequestLogin('developer')}
            className="px-5 py-2.5 rounded-full text-sm font-medium border border-forest text-forest hover:bg-forest/5 transition-colors"
          >
            Sign In as Developer
          </button>
        </div>
      </div>
    );
  }

  const role = currentUser.role;
  const allowedPages: readonly string[] = ROLE_ALLOWED_PAGES[role] || [];

  // Deny access if this page is not in the allowed list for this role
  if (!allowedPages.includes(activePage)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-risk-light border border-risk/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-risk" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-forest">Access Restricted</h2>
          <p className="text-sm text-body-light font-sans max-w-sm mx-auto">
            Your <strong>{role}</strong> account does not have permission to access this section.
          </p>
          <p className="text-xs text-muted font-mono mt-1">
            Authorized pages: {allowedPages.join(', ')}
          </p>
        </div>
        <div className="p-3 rounded-card bg-panel-light border border-border flex items-center gap-2 text-xs font-mono text-muted">
          <Shield className="w-4 h-4 text-forest flex-shrink-0" />
          <span>Role-based access control enforced — {role} workspace</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;
