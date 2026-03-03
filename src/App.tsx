import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './src/pages/LoginPage';
import { AppsPage } from './src/pages/AppsPage';
import { NewAppPage } from './src/pages/NewAppPage';
import { AppDetailPage } from './src/pages/AppDetailPage';
import { EditAppPage } from './src/pages/EditAppPage';
import { NewScreenPage } from './src/pages/NewScreenPage';
import { ScreensPage } from './src/pages/ScreensPage';
import { ScreenDetailPage } from './src/pages/ScreenDetailPage';
import { CategoriesPage } from './src/pages/CategoriesPage';
import { UIElementsPage } from './src/pages/UIElementsPage';
import { PatternsPage } from './src/pages/PatternsPage';
import { AppCategoriesPage } from './src/pages/AppCategoriesPage';
import { ScreenCategoriesPage } from './src/pages/ScreenCategoriesPage';
import { ScenarioCategoriesPage } from './src/pages/ScenarioCategoriesPage';
import { UsersPage } from './src/pages/UsersPage';
import { AdminsPage } from './src/pages/AdminsPage';
import { SettingsPage } from './src/pages/SettingsPage';
import { DashboardLayout } from './src/components/DashboardLayout';
import { ProtectedRoute } from './src/components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/apps" replace />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/apps/new" element={<NewAppPage />} />
          <Route path="/apps/:id" element={<AppDetailPage />} />
          <Route path="/apps/:id/edit" element={<EditAppPage />} />
          <Route path="/apps/:id/screens/new" element={<NewScreenPage />} />
          
          <Route path="/screens" element={<ScreensPage />} />
          <Route path="/screens/:id" element={<ScreenDetailPage />} />
          
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/ui" element={<UIElementsPage />} />
          <Route path="/categories/patterns" element={<PatternsPage />} />
          <Route path="/categories/app" element={<AppCategoriesPage />} />
          <Route path="/categories/screens" element={<ScreenCategoriesPage />} />
          <Route path="/categories/scenarios" element={<ScenarioCategoriesPage />} />
          
          <Route path="/users" element={<UsersPage />} />
          <Route path="/admins" element={<AdminsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
