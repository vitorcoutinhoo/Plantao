import { Navigate } from 'react-router-dom';
import { getRole } from '../utils/accessControl';

export function RoleRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const role = getRole();
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute allowedRoles={['admin', 'gerente']}>{children}</RoleRoute>;
}
