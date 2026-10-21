import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from './layouts/AppLayout';
import { AdminRoute, RoleRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Month } from './pages/Scale/Month';
import { Suggestion } from './pages/Scale/Suggestion';
import { All as UsersAll } from './pages/Users/All';
import { Details } from './pages/Users/Details';
import { Reports } from './pages/Reports';
import { Duty } from './pages/Duty';
import { Edit } from './pages/Users/Edit';
import { Create } from './pages/Users/Create';
import { ModeloComunicacao } from './pages/ModeloComunicacao';
import { Cadastro } from './pages/Cadastro';
import { Permissions } from './pages/Users/Permissions';
import { DutyHistory } from './pages/Users/DutyHistory';
import { ReportPrint } from './pages/ReportPrint';
import { Convites } from './pages/Convites';
import { Financeiro } from './pages/Financeiro';
import { Perfil } from './pages/Perfil';
import { CargosSetores } from './pages/CargosSetores';
import { ConfigEmail } from './pages/ConfigEmail';

export function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      {/* Telas sem Sidebar/Header padrão */}
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/home" element={<Home />} />
      <Route path="/reports/print" element={<ReportPrint />} />

      {/* Telas com AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/scale/month" element={<AdminRoute><Month /></AdminRoute>} />
        <Route path="/scale/suggestion" element={<AdminRoute><Suggestion /></AdminRoute>} />
        <Route path="/users" element={<RoleRoute allowedRoles={['admin', 'gerente', 'financeiro']}><UsersAll /></RoleRoute>} />
        <Route path="/users/permissions" element={<AdminRoute><Permissions /></AdminRoute>} />
        <Route path="/users/details/:id" element={<AdminRoute><Details /></AdminRoute>} />
        <Route path="/users/edit/:id" element={<AdminRoute><Edit /></AdminRoute>} />
        <Route path="/users/duty-history/:id" element={<AdminRoute><DutyHistory /></AdminRoute>} />
        <Route path="/users/create" element={<AdminRoute><Create /></AdminRoute>} />
        <Route path="/convites" element={<AdminRoute><Convites /></AdminRoute>} />
        <Route path="/financeiro" element={<RoleRoute allowedRoles={['admin', 'financeiro']}><Financeiro /></RoleRoute>} />
        <Route path="/cargos-setores" element={<AdminRoute><CargosSetores /></AdminRoute>} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/modelo-comunicacao" element={<AdminRoute><ModeloComunicacao /></AdminRoute>} />
        <Route path="/reports" element={<RoleRoute allowedRoles={['admin', 'gerente', 'financeiro']}><Reports /></RoleRoute>} />
        <Route path="/duty" element={<AdminRoute><Duty /></AdminRoute>} />
        <Route path="/config/email" element={<AdminRoute><ConfigEmail /></AdminRoute>} />
      </Route>

      {/* Rota de erro 404 */}
      <Route path="*" element={<div className="p-10 font-bold">Página não encontrada</div>} />
    </Routes>
    </AnimatePresence>
  );
}
