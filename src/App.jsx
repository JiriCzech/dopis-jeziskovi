import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
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
  const {
    authUser,
    profile,
    profileError,
    retryProfileLoad,
    signOut,
    loading,
    justSignedIn,
    consumeJustSignedIn,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!authUser) {
      if (window.location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      return;
    }
    if (!profile) return;
    if (justSignedIn) {
      consumeJustSignedIn();
      navigate('/', { replace: true });
    }
  }, [loading, authUser, profile, justSignedIn, consumeJustSignedIn, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-base text-slate-text-muted">
        Připravuji tvůj dopisní papír...
      </div>
    );
  }

  if (authUser && !profile) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-8">
        <div className="stationery-sheet rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 relative">
          <div className="stationery-inner-frame" aria-hidden="true" />
          <div className="relative z-10 space-y-4">
            <h1 className="font-fairytale font-bold text-3xl text-fir">
              Nepodařilo se otevřít profil
            </h1>
            <p className="text-base text-slate-text-muted leading-relaxed">
              {profileError?.message ||
                'Při načítání nebo zakládání tvého účtu došlo k neočekávané chybě.'}
            </p>
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={retryProfileLoad}
                className="min-h-[50px] w-full px-6 py-3 rounded-2xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition"
              >
                Zkusit znovu
              </button>
              <button
                type="button"
                onClick={signOut}
                className="text-sm font-semibold text-slate-text-muted hover:text-slate-text underline underline-offset-4 transition"
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </div>
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
          <Route path="/dopis" element={<MyLettersPage />} />
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
