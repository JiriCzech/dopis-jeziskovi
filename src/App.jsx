import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppDataProvider } from './hooks/useAppData';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { MyLettersPage } from './pages/MyLettersPage';
import { FamilyPage } from './pages/FamilyPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { SharingPage } from './pages/SharingPage';
import { ProfilePage } from './pages/ProfilePage';

function AppRoutes() {
  const { authUser, profile, loading } = useAuth();

  if (loading || (authUser && !profile)) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-base text-slate-text-muted">
        Připravuji tvůj dopisní papír...
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage />;
  }

  return (
    <AppDataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<MyLettersPage />} />
          <Route path="/rodina" element={<FamilyPage />} />
          <Route path="/nakupni-seznam" element={<ShoppingListPage />} />
          <Route path="/sdileni" element={<SharingPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AppDataProvider>
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
