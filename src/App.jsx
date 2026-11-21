import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { LoginPage } from './pages/LoginPage';
import { MyLettersPage } from './pages/MyLettersPage';
import { FamilyPage } from './pages/FamilyPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { ProfilePage } from './pages/ProfilePage';

function AppRoutes() {
  const { authUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-sm text-slate-text-muted">
        Zapalujeme vánoční svíčku...
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage />;
  }

  if (!profile) {
    return <ProfileSetupModal />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MyLettersPage />} />
        <Route path="/rodina" element={<FamilyPage />} />
        <Route path="/nakupni-seznam" element={<ShoppingListPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
