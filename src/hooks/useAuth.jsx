import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase.js';
import {
  createDemoSessionUser,
  createUserProfile,
  deleteUserAccountCompletely,
  getConnectionsAndGroups,
  getDemoState,
  getShoppingList,
  getUserProfile,
  isDemoModeActive,
  resetDemoState,
  setDemoModeActive,
  switchDemoUser,
  updateUserProfile,
} from '../lib/db.js';

const AuthContext = createContext(null);
const PENDING_INVITE_STORAGE_KEY = 'dopis_jeziskovi_pending_invite';

function readInitialInviteCode() {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('invite');
      if (fromUrl && fromUrl.trim()) {
        const cleaned = fromUrl.trim();
        sessionStorage.setItem(PENDING_INVITE_STORAGE_KEY, cleaned);
        params.delete('invite');
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', nextUrl);
        return cleaned;
      }
      return sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY) || '';
    }
  } catch {
    // ignore URL/sessionStorage errors
  }
  return '';
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(() => isDemoModeActive());
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unboughtShoppingCount, setUnboughtShoppingCount] = useState(0);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [pendingInviteCode, setPendingInviteCodeState] = useState(() => readInitialInviteCode());
  const [toast, setToast] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const undoTimerRef = useRef(null);

  const clearPendingInviteCode = useCallback(() => {
    setPendingInviteCodeState('');
    try {
      sessionStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const showUndoToast = useCallback(({ message, onUndo }) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setUndoToast({ id: Date.now(), message, onUndo });
    undoTimerRef.current = setTimeout(() => {
      setUndoToast(null);
      undoTimerRef.current = null;
    }, 8000);
  }, []);

  const dismissUndoToast = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshPendingCount = useCallback(async (uid) => {
    if (!uid) {
      setPendingRequestsCount(0);
      return;
    }
    try {
      const { connections } = await getConnectionsAndGroups(uid);
      const incoming = connections.filter(
        (c) => c.status === 'pending' && c.requestedBy !== uid
      );
      setPendingRequestsCount(incoming.length);
    } catch {
      // ignore background count errors
    }
  }, []);

  const refreshShoppingCount = useCallback(async (uid) => {
    const targetUid = uid || authUser?.uid;
    if (!targetUid) {
      setUnboughtShoppingCount(0);
      return;
    }
    try {
      const { claims, privateIdeas } = await getShoppingList(targetUid);
      const unboughtClaims = claims.filter((c) => !c.isBought).length;
      const unboughtIdeas = privateIdeas.filter((p) => !p.isBought).length;
      setUnboughtShoppingCount(unboughtClaims + unboughtIdeas);
    } catch {
      // ignore background count errors
    }
  }, [authUser?.uid]);

  const hydrateDemoSession = useCallback(async () => {
    const state = getDemoState();
    if (!state.activeUid) {
      setAuthUser(null);
      setProfile(null);
      setPendingRequestsCount(0);
      setUnboughtShoppingCount(0);
      setLoading(false);
      return;
    }
    const demoUser = state.users[state.activeUid];
    setAuthUser({ uid: state.activeUid, isDemo: true });
    setProfile(demoUser || null);
    await Promise.all([
      refreshPendingCount(state.activeUid),
      refreshShoppingCount(state.activeUid),
    ]);
    setLoading(false);
  }, [refreshPendingCount, refreshShoppingCount]);

  useEffect(() => {
    if (!isFirebaseConfigured || demoMode) {
      if (demoMode) {
        hydrateDemoSession();
      } else {
        setLoading(false);
      }
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUser(null);
        setProfile(null);
        setPendingRequestsCount(0);
        setUnboughtShoppingCount(0);
        setLoading(false);
        return;
      }
      setAuthUser(user);
      try {
        const userProf = await getUserProfile(user.uid);
        setProfile(userProf);
        if (userProf) {
          await Promise.all([
            refreshPendingCount(user.uid),
            refreshShoppingCount(user.uid),
          ]);
        }
      } catch (err) {
        console.error('Chyba načtení profilu:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [demoMode, hydrateDemoSession, refreshPendingCount, refreshShoppingCount]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase není v souboru .env nakonfigurován.');
    }
    setDemoModeActive(false);
    setDemoMode(false);
    await signInWithPopup(auth, googleProvider);
  };

  const enterDemoMode = async (asFreshUser = false) => {
    setDemoModeActive(true);
    setDemoMode(true);
    if (asFreshUser) {
      const fresh = createDemoSessionUser();
      setAuthUser({ uid: fresh.uid, isDemo: true });
      setProfile(null);
      setPendingRequestsCount(0);
      setUnboughtShoppingCount(0);
      setLoading(false);
      return;
    }
    await hydrateDemoSession();
  };

  const changeDemoPersona = async (uid) => {
    dismissUndoToast();
    switchDemoUser(uid);
    await hydrateDemoSession();
    notify('Přepnuto na jiného člena rodiny.');
  };

  const resetDemo = async () => {
    dismissUndoToast();
    resetDemoState();
    await hydrateDemoSession();
    notify('Ukázková data byla obnovena do výchozího stavu.');
  };

  const completeProfileSetup = async ({ displayName, avatarId, avatarBg }) => {
    if (!authUser) throw new Error('Uživatel není přihlášen.');
    const created = await createUserProfile({
      uid: authUser.uid,
      displayName,
      avatarId,
      avatarBg,
    });
    setProfile(created);
    setShowOnboardingBanner(true);
    await Promise.all([
      refreshPendingCount(authUser.uid),
      refreshShoppingCount(authUser.uid),
    ]);
    return created;
  };

  const saveProfileUpdates = async (updates) => {
    if (!authUser) throw new Error('Uživatel není přihlášen.');
    const updated = await updateUserProfile(authUser.uid, updates);
    setProfile(updated);
    notify('Profil byl úspěšně upraven.');
    return updated;
  };

  const signOut = async () => {
    dismissUndoToast();
    if (demoMode) {
      setDemoModeActive(false);
      setDemoMode(false);
      setAuthUser(null);
      setProfile(null);
      setPendingRequestsCount(0);
      setUnboughtShoppingCount(0);
      return;
    }
    if (auth) {
      await firebaseSignOut(auth);
    }
    setAuthUser(null);
    setProfile(null);
    setPendingRequestsCount(0);
    setUnboughtShoppingCount(0);
  };

  const deleteAccount = async () => {
    if (!authUser) return;
    dismissUndoToast();
    await deleteUserAccountCompletely(authUser.uid, demoMode ? null : auth.currentUser);
    if (demoMode) {
      await hydrateDemoSession();
    } else {
      setAuthUser(null);
      setProfile(null);
      setPendingRequestsCount(0);
      setUnboughtShoppingCount(0);
    }
    notify('Profil i všechny dopisy byly nenávratně smazány.');
  };

  const value = {
    authUser,
    profile,
    loading,
    demoMode,
    isFirebaseConfigured,
    pendingRequestsCount,
    unboughtShoppingCount,
    showOnboardingBanner,
    dismissOnboardingBanner: () => setShowOnboardingBanner(false),
    pendingInviteCode,
    clearPendingInviteCode,
    toast,
    dismissToast: () => setToast(null),
    undoToast,
    showUndoToast,
    dismissUndoToast,
    notify,
    refreshPendingCount: () => refreshPendingCount(authUser?.uid),
    refreshShoppingCount: () => refreshShoppingCount(authUser?.uid),
    signInWithGoogle,
    enterDemoMode,
    changeDemoPersona,
    resetDemo,
    completeProfileSetup,
    saveProfileUpdates,
    signOut,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth musí být použit uvnitř AuthProvider');
  return ctx;
}
