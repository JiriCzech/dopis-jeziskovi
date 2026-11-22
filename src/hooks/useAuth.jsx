import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { AVATAR_BG_COLORS, AVATAR_OPTIONS } from '../assets/avatars';
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
export const PENDING_INVITE_STORAGE_KEY = 'dopis_jeziskovi_pending_invite';
const WELCOME_STRIP_PREFIX = 'dopis_jeziskovi_welcome_seen_';

function readInitialInviteCode() {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('invite');
      if (fromUrl && fromUrl.trim()) {
        let cleaned = fromUrl.trim();
        let consumedHash = false;
        // Pokud aplikace zpráv rozbila %23 na #, tag #1234 skončil v window.location.hash
        if (!cleaned.includes('#') && /^#\d{4}$/.test(window.location.hash || '')) {
          cleaned = `${cleaned}${window.location.hash}`;
          consumedHash = true;
        }
        sessionStorage.setItem(PENDING_INVITE_STORAGE_KEY, cleaned);
        params.delete('invite');
        const nextSearch = params.toString();
        const nextHash = consumedHash ? '' : window.location.hash;
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${nextHash}`;
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

function pickDefaultAvatarForUid(uid = '') {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return {
    avatarId: AVATAR_OPTIONS[hash % AVATAR_OPTIONS.length].id,
    avatarBg: AVATAR_BG_COLORS[hash % AVATAR_BG_COLORS.length].hex,
  };
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(() => isDemoModeActive());
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unboughtShoppingCount, setUnboughtShoppingCount] = useState(0);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [pendingInviteCode, setPendingInviteCodeState] = useState(() => readInitialInviteCode());
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [toast, setToast] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const undoTimerRef = useRef(null);
  const authRunIdRef = useRef(0);

  const consumeJustSignedIn = useCallback(() => {
    setJustSignedIn(false);
  }, []);

  const clearPendingInviteCode = useCallback(() => {
    setPendingInviteCodeState('');
    try {
      sessionStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const dismissOnboardingBanner = useCallback(() => {
    setShowOnboardingBanner(false);
    try {
      if (authUser?.uid) {
        localStorage.setItem(`${WELCOME_STRIP_PREFIX}${authUser.uid}`, '1');
      }
    } catch {
      // ignore
    }
  }, [authUser?.uid]);

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

  const refreshShoppingCount = useCallback(
    async (uid) => {
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
    },
    [authUser?.uid]
  );

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
    let demoUser = state.users[state.activeUid];
    if (!demoUser) {
      const defaults = pickDefaultAvatarForUid(state.activeUid);
      demoUser = await createUserProfile({
        uid: state.activeUid,
        displayName: 'Nový pisatel',
        avatarId: defaults.avatarId,
        avatarBg: defaults.avatarBg,
        onboardingCompleted: false,
      });
    }
    setAuthUser({ uid: state.activeUid, isDemo: true });
    setProfile(demoUser);
    await Promise.all([
      refreshPendingCount(state.activeUid),
      refreshShoppingCount(state.activeUid),
    ]);
    setLoading(false);
  }, [refreshPendingCount, refreshShoppingCount]);

  const loadOrCreateUserProfile = useCallback(
    async (user, runId) => {
      if (!user) return;
      setProfileError(null);
      setLoading(true);
      try {
        let userProf = null;
        try {
          userProf = await getUserProfile(user.uid);
        } catch (readErr) {
          console.error(
            `[Firestore] Chyba čtení profilu v kolekci users/${user.uid}:`,
            readErr?.code || 'unknown',
            readErr?.message || readErr
          );
          throw readErr;
        }

        if (runId !== undefined && authRunIdRef.current !== runId) return;

        if (!userProf) {
          // První založení účtu po přihlášení přes Google (onboardingCompleted: false)
          const rawName = (
            user.displayName ||
            user.email?.split('@')[0] ||
            'Pisatel'
          )
            .trim()
            .slice(0, 50);
          const defaults = pickDefaultAvatarForUid(user.uid);
          try {
            userProf = await createUserProfile({
              uid: user.uid,
              displayName: rawName || 'Pisatel',
              avatarId: defaults.avatarId,
              avatarBg: defaults.avatarBg,
              onboardingCompleted: false,
            });
          } catch (createErr) {
            console.error(
              `[Firestore] Chyba zakládání profilu v kolekci users/${user.uid}:`,
              createErr?.code || 'unknown',
              createErr?.message || createErr
            );
            throw createErr;
          }
        }

        if (runId !== undefined && authRunIdRef.current !== runId) return;

        setProfile(userProf);
        await Promise.all([
          refreshPendingCount(user.uid),
          refreshShoppingCount(user.uid),
        ]);
      } catch (err) {
        if (runId !== undefined && authRunIdRef.current !== runId) return;
        const code = err?.code || 'unknown';
        console.error(
          `[Auth] Načtení nebo vytvoření profilu selhalo (users/${user.uid}, code=${code}):`,
          err
        );
        setProfileError({
          code,
          path: `users/${user.uid}`,
          message:
            code === 'permission-denied'
              ? 'Chybí oprávnění pro zápis do databáze (firestore.rules).'
              : err?.message || 'Nepodařilo se načíst nebo založit tvůj profil.',
        });
      } finally {
        if (runId === undefined || authRunIdRef.current === runId) {
          setLoading(false);
        }
      }
    },
    [refreshPendingCount, refreshShoppingCount]
  );

  const retryProfileLoad = useCallback(async () => {
    if (!authUser) return;
    if (demoMode) {
      await hydrateDemoSession();
      return;
    }
    const runId = ++authRunIdRef.current;
    await loadOrCreateUserProfile(authUser, runId);
  }, [authUser, demoMode, hydrateDemoSession, loadOrCreateUserProfile]);

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
      const runId = ++authRunIdRef.current;
      if (!user) {
        setAuthUser(null);
        setProfile(null);
        setProfileError(null);
        setPendingRequestsCount(0);
        setUnboughtShoppingCount(0);
        setLoading(false);
        return;
      }
      setAuthUser(user);
      setProfile(null);
      await loadOrCreateUserProfile(user, runId);
    });

    return () => {
      authRunIdRef.current += 1;
      unsubscribe();
    };
  }, [demoMode, hydrateDemoSession, loadOrCreateUserProfile]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase není v souboru .env nakonfigurován.');
    }
    setDemoModeActive(false);
    setDemoMode(false);
    setJustSignedIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setJustSignedIn(false);
      throw err;
    }
  };

  const enterDemoMode = async (asFreshUser = false) => {
    setDemoModeActive(true);
    setDemoMode(true);
    setJustSignedIn(true);
    if (asFreshUser) {
      const fresh = createDemoSessionUser();
      const defaults = pickDefaultAvatarForUid(fresh.uid);
      const created = await createUserProfile({
        uid: fresh.uid,
        displayName: fresh.displayName,
        avatarId: defaults.avatarId,
        avatarBg: defaults.avatarBg,
        onboardingCompleted: false,
      });
      setAuthUser({ uid: fresh.uid, isDemo: true });
      setProfile(created);
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

  const completeProfileSetup = async ({
    displayName,
    avatarId,
    avatarBg,
    onboardingCompleted = true,
  }) => {
    if (!authUser) throw new Error('Uživatel není přihlášen.');
    const created = await createUserProfile({
      uid: authUser.uid,
      displayName,
      avatarId,
      avatarBg,
      onboardingCompleted,
    });
    setProfile(created);
    await Promise.all([
      refreshPendingCount(authUser.uid),
      refreshShoppingCount(authUser.uid),
    ]);
    return created;
  };

  const saveProfileUpdates = async (updates, options = {}) => {
    if (!authUser) throw new Error('Uživatel není přihlášen.');
    const updated = await updateUserProfile(authUser.uid, updates);
    setProfile(updated);
    if (!options.silent) {
      notify('Změny uloženy ✓');
    }
    return updated;
  };

  const signOut = async () => {
    dismissUndoToast();
    setJustSignedIn(false);
    setProfileError(null);
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
    setJustSignedIn(false);
    setProfileError(null);
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
    profileError,
    retryProfileLoad,
    loading,
    demoMode,
    isFirebaseConfigured,
    pendingRequestsCount,
    unboughtShoppingCount,
    showOnboardingBanner,
    dismissOnboardingBanner,
    pendingInviteCode,
    clearPendingInviteCode,
    justSignedIn,
    consumeJustSignedIn,
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
