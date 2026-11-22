import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '../lib/firebase.js';
import {
  addPrivateIdea,
  claimWish,
  deleteLetter,
  deletePrivateIdea,
  getDemoState,
  getUsersByUidsBatch,
  isDemoModeActive,
  saveLetter,
  toggleClaimBought,
  togglePrivateIdeaBought,
  unclaimWish,
  updatePrivateIdea,
} from '../lib/db.js';
import { useAuth } from './useAuth.jsx';

const AppDataContext = createContext(null);

function chunkArray(arr, size = 30) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function AppDataProvider({ children }) {
  const { authUser, profile, demoMode } = useAuth();
  const uid = authUser?.uid || null;

  const [ownedLettersMap, setOwnedLettersMap] = useState({});
  const [coParentLettersMap, setCoParentLettersMap] = useState({});
  const [connections, setConnections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [myClaimsMap, setMyClaimsMap] = useState({});
  const [privateIdeasMap, setPrivateIdeasMap] = useState({});
  const [familyLettersMap, setFamilyLettersMap] = useState({});
  const [familyClaimsMap, setFamilyClaimsMap] = useState({});
  const [usersById, setUsersById] = useState({});
  const [initialReady, setInitialReady] = useState(false);

  const usersByIdRef = useRef({});
  const fetchingUidsRef = useRef(new Set());

  useEffect(() => {
    usersByIdRef.current = usersById;
  }, [usersById]);

  useEffect(() => {
    if (profile && profile.uid) {
      setUsersById((prev) =>
        prev[profile.uid] === profile ? prev : { ...prev, [profile.uid]: profile }
      );
    }
  }, [profile]);

  // Dávkové dotažení chybějících profilů uživatelů (where('uid', 'in', batchIds) po max. 30)
  const ensureUsersLoaded = useCallback(async (uidsToEnsure) => {
    const missing = Array.from(new Set((uidsToEnsure || []).filter(Boolean))).filter(
      (id) => !usersByIdRef.current[id] && !fetchingUidsRef.current.has(id)
    );
    if (missing.length === 0) return;

    missing.forEach((id) => fetchingUidsRef.current.add(id));
    try {
      const fetchedMap = await getUsersByUidsBatch(missing);
      setUsersById((prev) => {
        const next = { ...prev };
        missing.forEach((id) => {
          if (fetchedMap[id]) {
            next[id] = fetchedMap[id];
          } else {
            // Заpíšeme sentinel null, abychom smazaný účet nedotazovali dokola
            next[id] = null;
          }
        });
        return next;
      });
    } catch {
      // ignore background batch error
    } finally {
      missing.forEach((id) => fetchingUidsRef.current.delete(id));
    }
  }, []);

  // Synchronizace v ukázkovém režimu (?demo=1)
  const syncFromDemoState = useCallback(() => {
    if (!uid) return;
    const state = getDemoState();
    const allLetters = Object.values(state.letters || {});
    const nextOwned = {};
    const nextCoParent = {};
    allLetters.forEach((l) => {
      if (l.ownerUid === uid) nextOwned[l.id] = l;
      if (Array.isArray(l.coParentUids) && l.coParentUids.includes(uid)) {
        nextCoParent[l.id] = l;
      }
    });

    const nextConns = Object.values(state.connections || {}).filter(
      (c) => Array.isArray(c.users) && c.users.includes(uid)
    );
    const nextGroups = Object.values(state.groups || {}).filter(
      (g) => Array.isArray(g.memberUids) && g.memberUids.includes(uid)
    );

    const visibleUids = new Set();
    nextConns.forEach((c) => {
      if (c.status === 'accepted') {
        (c.users || []).forEach((u) => u !== uid && visibleUids.add(u));
      }
    });
    nextGroups.forEach((g) => {
      (g.memberUids || []).forEach((u) => u !== uid && visibleUids.add(u));
    });

    const nextFamLetters = {};
    allLetters.forEach((l) => {
      if (visibleUids.has(l.ownerUid)) {
        nextFamLetters[l.id] = l;
      }
    });

    const allClaims = Object.values(state.claims || {});
    const nextMyClaims = {};
    const nextFamClaims = {};
    allClaims.forEach((c) => {
      if (c.claimedByUid === uid && c.letterOwnerUid !== uid) {
        nextMyClaims[c.id] = c;
      }
      if (visibleUids.has(c.letterOwnerUid)) {
        nextFamClaims[c.id] = c;
      }
    });

    const nextIdeas = {};
    Object.values(state.privateIdeas || {}).forEach((p) => {
      if (p.ownerUid === uid) nextIdeas[p.id] = p;
    });

    setOwnedLettersMap(nextOwned);
    setCoParentLettersMap(nextCoParent);
    setConnections(nextConns);
    setGroups(nextGroups);
    setFamilyLettersMap(nextFamLetters);
    setMyClaimsMap(nextMyClaims);
    setFamilyClaimsMap(nextFamClaims);
    setPrivateIdeasMap(nextIdeas);
    setUsersById({ ...(state.users || {}) });
    setInitialReady(true);
  }, [uid]);

  // 1. Hlavní odběry (onSnapshot) pro přihlášeného uživatele
  useEffect(() => {
    if (!uid) {
      setOwnedLettersMap({});
      setCoParentLettersMap({});
      setConnections([]);
      setGroups([]);
      setMyClaimsMap({});
      setPrivateIdeasMap({});
      setFamilyLettersMap({});
      setFamilyClaimsMap({});
      setInitialReady(false);
      return undefined;
    }

    if (demoMode || isDemoModeActive() || !isFirebaseConfigured) {
      syncFromDemoState();
      const handler = () => syncFromDemoState();
      window.addEventListener('dopis-demo-state-changed', handler);
      return () => window.removeEventListener('dopis-demo-state-changed', handler);
    }

    let fallbackClaimsUnsub = null;

    const unsubOwnedLetters = onSnapshot(
      query(collection(firestoreDb, 'letters'), where('ownerUid', '==', uid)),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setOwnedLettersMap(map);
        setInitialReady(true);
      },
      (err) => {
        console.error('[Firestore] Chyba odběru letters (ownerUid):', err?.code, err?.message);
        setInitialReady(true);
      }
    );

    const unsubCoParentLetters = onSnapshot(
      query(collection(firestoreDb, 'letters'), where('coParentUids', 'array-contains', uid)),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setCoParentLettersMap(map);
      },
      (err) => {
        console.error('[Firestore] Chyba odběru letters (coParentUids):', err?.code, err?.message);
      }
    );

    const unsubConnections = onSnapshot(
      query(collection(firestoreDb, 'connections'), where('users', 'array-contains', uid)),
      (snap) => {
        setConnections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('[Firestore] Chyba odběru connections:', err?.code, err?.message);
      }
    );

    const unsubGroups = onSnapshot(
      query(collection(firestoreDb, 'groups'), where('memberUids', 'array-contains', uid)),
      (snap) => {
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('[Firestore] Chyba odběru groups:', err?.code, err?.message);
      }
    );

    const unsubIdeas = onSnapshot(
      query(collection(firestoreDb, 'privateIdeas'), where('ownerUid', '==', uid)),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setPrivateIdeasMap(map);
      },
      (err) => {
        console.error('[Firestore] Chyba odběru privateIdeas:', err?.code, err?.message);
      }
    );

    const unsubMyClaims = onSnapshot(
      query(
        collection(firestoreDb, 'claims'),
        where('claimedByUid', '==', uid),
        where('letterOwnerUid', '!=', uid)
      ),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setMyClaimsMap(map);
      },
      (err) => {
        if (err?.code === 'failed-precondition' && !fallbackClaimsUnsub) {
          fallbackClaimsUnsub = onSnapshot(
            query(
              collection(firestoreDb, 'claims'),
              where('letterOwnerUid', '!=', uid)
            ),
            (snap) => {
              const map = {};
              snap.docs.forEach((d) => {
                const data = d.data();
                if (data.claimedByUid === uid) {
                  map[d.id] = { id: d.id, ...data };
                }
              });
              setMyClaimsMap(map);
            },
            (fallbackErr) => {
              console.error('[Firestore] Chyba záložního odběru claims:', fallbackErr?.code, fallbackErr?.message);
            }
          );
        } else {
          console.error('[Firestore] Chyba odběru claims:', err?.code, err?.message);
        }
      }
    );

    return () => {
      unsubOwnedLetters();
      unsubCoParentLetters();
      unsubConnections();
      unsubGroups();
      unsubIdeas();
      unsubMyClaims();
      if (fallbackClaimsUnsub) fallbackClaimsUnsub();
    };
  }, [uid, demoMode, syncFromDemoState]);

  // Deduplikovaná množina UID všech viditelných členů rodiny a skupin
  const visibleMemberUids = useMemo(() => {
    if (!uid) return [];
    const set = new Set();
    connections.forEach((c) => {
      if (c.status === 'accepted' && Array.isArray(c.users)) {
        c.users.forEach((u) => {
          if (u && u !== uid) set.add(u);
        });
      }
    });
    groups.forEach((g) => {
      (g.memberUids || []).forEach((u) => {
        if (u && u !== uid) set.add(u);
      });
    });
    return Array.from(set).sort();
  }, [uid, connections, groups]);

  const visibleMemberUidsKey = visibleMemberUids.join(',');

  // 2. Dávkové načtení všech potřebných profilů uživatelů do sdílené keše usersById
  useEffect(() => {
    if (!uid) return;
    const needed = new Set(visibleMemberUids);
    connections.forEach((c) => {
      (c.users || []).forEach((u) => u && u !== uid && needed.add(u));
    });
    groups.forEach((g) => {
      (g.memberUids || []).forEach((u) => u && u !== uid && needed.add(u));
    });
    Object.values(ownedLettersMap).forEach((l) => {
      (l.coParentUids || []).forEach((u) => u && u !== uid && needed.add(u));
    });
    Object.values(coParentLettersMap).forEach((l) => {
      if (l.ownerUid && l.ownerUid !== uid) needed.add(l.ownerUid);
      (l.coParentUids || []).forEach((u) => u && u !== uid && needed.add(u));
    });
    Object.values(myClaimsMap).forEach((c) => {
      if (c.letterOwnerUid && c.letterOwnerUid !== uid) needed.add(c.letterOwnerUid);
    });

    ensureUsersLoaded(Array.from(needed));
  }, [
    uid,
    visibleMemberUids,
    connections,
    groups,
    ownedLettersMap,
    coParentLettersMap,
    myClaimsMap,
    ensureUsersLoaded,
  ]);

  // 3. Živé odběry dopisů a rezervací všech propojených členů rodiny a skupin (po blocích max. 30 UID)
  useEffect(() => {
    if (!uid || demoMode || isDemoModeActive() || !isFirebaseConfigured) {
      return undefined;
    }

    const memberIds = visibleMemberUidsKey ? visibleMemberUidsKey.split(',').filter(Boolean) : [];
    if (memberIds.length === 0) {
      setFamilyLettersMap({});
      setFamilyClaimsMap({});
      return undefined;
    }

    const chunks = chunkArray(memberIds, 30);
    const lettersPerChunk = chunks.map(() => ({}));
    const claimsPerChunk = chunks.map(() => ({}));

    const mergeChunks = (arrOfMaps, setter) => {
      const merged = {};
      arrOfMaps.forEach((m) => Object.assign(merged, m));
      setter(merged);
    };

    const unsubs = [];
    chunks.forEach((chunk, idx) => {
      unsubs.push(
        onSnapshot(
          query(collection(firestoreDb, 'letters'), where('ownerUid', 'in', chunk)),
          (snap) => {
            const m = {};
            snap.docs.forEach((d) => {
              m[d.id] = { id: d.id, ...d.data() };
            });
            lettersPerChunk[idx] = m;
            mergeChunks(lettersPerChunk, setFamilyLettersMap);
          },
          (err) => {
            console.error('[Firestore] Chyba odběru rodinných letters:', err?.code, err?.message);
          }
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(firestoreDb, 'claims'), where('letterOwnerUid', 'in', chunk)),
          (snap) => {
            const m = {};
            snap.docs.forEach((d) => {
              m[d.id] = { id: d.id, ...d.data() };
            });
            claimsPerChunk[idx] = m;
            mergeChunks(claimsPerChunk, setFamilyClaimsMap);
          },
          (err) => {
            console.error('[Firestore] Chyba odběru rodinných claims:', err?.code, err?.message);
          }
        )
      );
    });

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [uid, demoMode, visibleMemberUidsKey]);

  // Memoizované vlastní + spolurodičovské dopisy pro „Napsat dopis“
  const myLetters = useMemo(() => {
    const merged = { ...ownedLettersMap, ...coParentLettersMap };
    return Object.values(merged).sort((a, b) => {
      if (a.isChildLetter !== b.isChildLetter) return a.isChildLetter ? 1 : -1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [ownedLettersMap, coParentLettersMap]);

  // Memoizované potvrzené kontakty pro „Sdílení a skupiny“
  const acceptedContacts = useMemo(() => {
    if (!uid) return [];
    return connections
      .filter((c) => c.status === 'accepted' && Array.isArray(c.users) && c.users.includes(uid))
      .map((c) => {
        const otherUid = c.users.find((u) => u !== uid);
        if (!otherUid) return null;
        const userProf = usersById[otherUid] || {
          uid: otherUid,
          displayName: 'Propojený kontakt',
          tag: '0000',
          avatarId: 'star',
          avatarBg: '#F5E6D3',
        };
        return {
          connectionId: c.id,
          uid: otherUid,
          user: userProf,
        };
      })
      .filter(Boolean);
  }, [uid, connections, usersById]);

  // Memoizované karty jmenovek pro „Komu koupit dárek“ (0 ms přepnutí záložky)
  const familyCards = useMemo(() => {
    if (!uid || visibleMemberUids.length === 0) return [];

    const claimedSet = new Set(
      Object.values(familyClaimsMap).map((c) => `${c.letterId}::${c.wishId}`)
    );

    const lettersByOwner = {};
    Object.values(familyLettersMap).forEach((l) => {
      // Vynecháme dětské dopisy, kde je aktuální uživatel druhým rodičem (ty spravuje v „Napsat dopis“)
      if (Array.isArray(l.coParentUids) && l.coParentUids.includes(uid)) return;
      if (!lettersByOwner[l.ownerUid]) lettersByOwner[l.ownerUid] = [];
      lettersByOwner[l.ownerUid].push(l);
    });

    const cards = [];
    visibleMemberUids.forEach((memberUid) => {
      const ownerProfile = usersById[memberUid];
      if (!ownerProfile) return;

      const sharedGroups = groups.filter((g) => (g.memberUids || []).includes(memberUid));
      const allSharedGroupIds = sharedGroups.map((g) => g.id);
      const allSharedGroupNames = sharedGroups.map((g) => g.name);
      const childAllowedGroups = sharedGroups.filter((g) => g.showChildLetters !== false);
      const canSeeChildLetters =
        sharedGroups.length === 0 ? true : childAllowedGroups.length > 0;

      const memberLetters = (lettersByOwner[memberUid] || [])
        .filter((l) => !l.isChildLetter || canSeeChildLetters)
        .sort((a, b) => {
          if (a.isChildLetter !== b.isChildLetter) return a.isChildLetter ? 1 : -1;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });

      if (memberLetters.length === 0) {
        cards.push({
          cardId: `empty-${memberUid}`,
          letter: null,
          ownerProfile,
          recipientName: ownerProfile.displayName,
          isChildLetter: false,
          parentName: null,
          availableWishes: [],
          groupIds: allSharedGroupIds,
          groupNames: allSharedGroupNames,
        });
        return;
      }

      memberLetters.forEach((letter) => {
        const isChild = Boolean(letter.isChildLetter);
        const availableWishes = (letter.wishes || []).filter(
          (w) => !claimedSet.has(`${letter.id}::${w.id}`)
        );
        cards.push({
          cardId: letter.id,
          letter,
          ownerProfile,
          recipientName: letter.recipientName || ownerProfile.displayName,
          isChildLetter: isChild,
          parentName: isChild ? ownerProfile.displayName : null,
          availableWishes,
          groupIds: isChild
            ? childAllowedGroups.map((g) => g.id)
            : allSharedGroupIds,
          groupNames: isChild
            ? childAllowedGroups.map((g) => g.name)
            : allSharedGroupNames,
        });
      });
    });

    return cards;
  }, [uid, visibleMemberUids, familyClaimsMap, familyLettersMap, usersById, groups]);

  // Memoizovaný nákupní seznam s živou kontrolou smazaných přání / smazaných účtů
  const shoppingClaims = useMemo(() => {
    return Object.values(myClaimsMap)
      .map((claim) => {
        const ownerProfile = usersById[claim.letterOwnerUid];
        let orphanStatus = claim.orphanStatus || 'active';
        let recipientName = claim.recipientNameSnapshot;

        if (ownerProfile === null) {
          orphanStatus = 'account_deleted';
        } else if (ownerProfile) {
          const letter = familyLettersMap[claim.letterId];
          if (letter) {
            recipientName = letter.recipientName || recipientName;
            const stillInLetter = (letter.wishes || []).some((w) => w.id === claim.wishId);
            orphanStatus = stillInLetter ? 'active' : 'wish_deleted';
          }
        }

        return {
          ...claim,
          recipientName,
          orphanStatus,
        };
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [myClaimsMap, usersById, familyLettersMap]);

  const privateIdeas = useMemo(() => {
    return Object.values(privateIdeasMap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [privateIdeasMap]);

  // Živé počty pro odznaky v navigaci
  const pendingRequestsCount = useMemo(() => {
    if (!uid) return 0;
    return connections.filter((c) => c.status === 'pending' && c.requestedBy !== uid).length;
  }, [uid, connections]);

  const unboughtShoppingCount = useMemo(() => {
    const unboughtClaims = shoppingClaims.filter((c) => !c.isBought).length;
    const unboughtIdeas = privateIdeas.filter((p) => !p.isBought).length;
    return unboughtClaims + unboughtIdeas;
  }, [shoppingClaims, privateIdeas]);

  // Optimistické akce (0 ms odezva v UI + zápis do Firestore na pozadí)
  const optimisticSaveMyLetter = useCallback(async (letterData) => {
    const saved = await saveLetter(letterData);
    setOwnedLettersMap((prev) =>
      saved.ownerUid === uid ? { ...prev, [saved.id]: saved } : prev
    );
    setCoParentLettersMap((prev) =>
      (saved.coParentUids || []).includes(uid) ? { ...prev, [saved.id]: saved } : prev
    );
    return saved;
  }, [uid]);

  const optimisticDeleteMyLetter = useCallback(async (letterId) => {
    setOwnedLettersMap((prev) => {
      const next = { ...prev };
      delete next[letterId];
      return next;
    });
    await deleteLetter(letterId);
  }, []);

  const optimisticClaimWish = useCallback(
    async (letter, wish) => {
      if (!uid) return null;
      const claimId = `${letter.id}_${wish.id}`;
      const optimisticDoc = {
        id: claimId,
        letterId: letter.id,
        letterOwnerUid: letter.ownerUid,
        letterCoParentUids: Array.isArray(letter.coParentUids) ? letter.coParentUids : [],
        wishId: wish.id,
        wishTitleSnapshot: wish.title,
        wishUrlSnapshot: wish.url || '',
        wishNoteSnapshot: wish.note || '',
        recipientNameSnapshot: letter.recipientName,
        claimedByUid: uid,
        isBought: false,
        orphanStatus: 'active',
        createdAt: Date.now(),
      };

      setFamilyClaimsMap((prev) => ({ ...prev, [claimId]: optimisticDoc }));
      setMyClaimsMap((prev) => ({ ...prev, [claimId]: optimisticDoc }));

      try {
        return await claimWish(uid, letter, wish);
      } catch (err) {
        setFamilyClaimsMap((prev) => {
          const next = { ...prev };
          delete next[claimId];
          return next;
        });
        setMyClaimsMap((prev) => {
          const next = { ...prev };
          delete next[claimId];
          return next;
        });
        throw err;
      }
    },
    [uid]
  );

  const optimisticUnclaimWish = useCallback(async (claimId) => {
    let removedMy = null;
    let removedFam = null;
    setMyClaimsMap((prev) => {
      removedMy = prev[claimId];
      const next = { ...prev };
      delete next[claimId];
      return next;
    });
    setFamilyClaimsMap((prev) => {
      removedFam = prev[claimId];
      const next = { ...prev };
      delete next[claimId];
      return next;
    });

    try {
      await unclaimWish(claimId);
    } catch (err) {
      if (removedMy) setMyClaimsMap((prev) => ({ ...prev, [claimId]: removedMy }));
      if (removedFam) setFamilyClaimsMap((prev) => ({ ...prev, [claimId]: removedFam }));
      throw err;
    }
  }, []);

  const optimisticToggleClaimBought = useCallback(async (claimId, nextVal) => {
    setMyClaimsMap((prev) =>
      prev[claimId]
        ? { ...prev, [claimId]: { ...prev[claimId], isBought: Boolean(nextVal) } }
        : prev
    );
    try {
      await toggleClaimBought(claimId, nextVal);
    } catch (err) {
      setMyClaimsMap((prev) =>
        prev[claimId]
          ? { ...prev, [claimId]: { ...prev[claimId], isBought: !nextVal } }
          : prev
      );
      throw err;
    }
  }, []);

  const optimisticToggleIdeaBought = useCallback(async (ideaId, nextVal) => {
    setPrivateIdeasMap((prev) =>
      prev[ideaId]
        ? { ...prev, [ideaId]: { ...prev[ideaId], isBought: Boolean(nextVal) } }
        : prev
    );
    try {
      await togglePrivateIdeaBought(ideaId, nextVal);
    } catch (err) {
      setPrivateIdeasMap((prev) =>
        prev[ideaId]
          ? { ...prev, [ideaId]: { ...prev[ideaId], isBought: !nextVal } }
          : prev
      );
      throw err;
    }
  }, []);

  const optimisticAddIdea = useCallback(async (payload) => {
    const created = await addPrivateIdea(payload);
    setPrivateIdeasMap((prev) => ({ ...prev, [created.id]: created }));
    return created;
  }, []);

  const optimisticUpdateIdea = useCallback(async (ideaId, updates) => {
    setPrivateIdeasMap((prev) =>
      prev[ideaId] ? { ...prev, [ideaId]: { ...prev[ideaId], ...updates } } : prev
    );
    const saved = await updatePrivateIdea(ideaId, updates);
    setPrivateIdeasMap((prev) => ({
      ...prev,
      [ideaId]: { ...(prev[ideaId] || {}), ...saved },
    }));
    return saved;
  }, []);

  const optimisticDeleteIdea = useCallback(async (ideaId) => {
    let backup = null;
    setPrivateIdeasMap((prev) => {
      backup = prev[ideaId];
      const next = { ...prev };
      delete next[ideaId];
      return next;
    });
    try {
      await deletePrivateIdea(ideaId);
    } catch (err) {
      if (backup) setPrivateIdeasMap((prev) => ({ ...prev, [ideaId]: backup }));
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      initialReady,
      myLetters,
      connections,
      groups,
      usersById,
      acceptedContacts,
      familyCards,
      shoppingClaims,
      privateIdeas,
      pendingRequestsCount,
      unboughtShoppingCount,
      ensureUsersLoaded,
      optimisticSaveMyLetter,
      optimisticDeleteMyLetter,
      optimisticClaimWish,
      optimisticUnclaimWish,
      optimisticToggleClaimBought,
      optimisticToggleIdeaBought,
      optimisticAddIdea,
      optimisticUpdateIdea,
      optimisticDeleteIdea,
    }),
    [
      initialReady,
      myLetters,
      connections,
      groups,
      usersById,
      acceptedContacts,
      familyCards,
      shoppingClaims,
      privateIdeas,
      pendingRequestsCount,
      unboughtShoppingCount,
      ensureUsersLoaded,
      optimisticSaveMyLetter,
      optimisticDeleteMyLetter,
      optimisticClaimWish,
      optimisticUnclaimWish,
      optimisticToggleClaimBought,
      optimisticToggleIdeaBought,
      optimisticAddIdea,
      optimisticUpdateIdea,
      optimisticDeleteIdea,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData musí být použit uvnitř AppDataProvider');
  }
  return ctx;
}
