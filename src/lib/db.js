import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteUser, reauthenticateWithPopup } from 'firebase/auth';
import { db, googleProvider, isFirebaseConfigured } from './firebase.js';
import { createInitialDemoState, DEMO_STORAGE_KEY } from './demoSeed.js';

const DEMO_MODE_FLAG_KEY = 'dopis_jeziskovi_demo_session';
let memoryDemoFlag = false;

export function isDemoModeActive() {
  if (memoryDemoFlag) return true;
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1') {
        sessionStorage.setItem(DEMO_MODE_FLAG_KEY, '1');
        return true;
      }
      if (params.get('demo') === '0') {
        sessionStorage.removeItem(DEMO_MODE_FLAG_KEY);
        localStorage.removeItem('dopis_jeziskovi_use_demo');
        return false;
      }
      if (sessionStorage.getItem(DEMO_MODE_FLAG_KEY) === '1') return true;
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

export function setDemoModeActive(enabled) {
  memoryDemoFlag = Boolean(enabled);
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (enabled) {
        sessionStorage.setItem(DEMO_MODE_FLAG_KEY, '1');
      } else {
        sessionStorage.removeItem(DEMO_MODE_FLAG_KEY);
      }
    }
    if (typeof localStorage !== 'undefined' && !enabled) {
      localStorage.removeItem('dopis_jeziskovi_use_demo');
    }
  } catch {
    // ignore storage errors
  }
}

function loadDemoState() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fall through
  }
  const initial = createInitialDemoState();
  saveDemoState(initial);
  return initial;
}

function saveDemoState(state) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dopis-demo-state-changed'));
  }
}

export function resetDemoState() {
  const fresh = createInitialDemoState();
  saveDemoState(fresh);
  return fresh;
}

export function getDemoState() {
  return loadDemoState();
}

export function switchDemoUser(uid) {
  const state = loadDemoState();
  if (state.users[uid]) {
    state.activeUid = uid;
    saveDemoState(state);
  }
  return state;
}

export function createDemoSessionUser(displayName = 'Nový uživatel') {
  const state = loadDemoState();
  const uid = `demo-user-${Date.now()}`;
  state.activeUid = uid;
  saveDemoState(state);
  return { uid, displayName };
}

function generateRandomId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 12)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeUrl(rawUrl) {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function extractInviteCodeFromInput(rawInput) {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return '';
  try {
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?invite=')) {
      const urlObj = new URL(trimmed, 'https://dopis-jeziskovi.local');
      const inviteParam = urlObj.searchParams.get('invite');
      if (inviteParam) return inviteParam.trim();
    }
  } catch {
    // fallback to raw string
  }
  return trimmed;
}

function parseTagSearch(input) {
  const trimmed = extractInviteCodeFromInput(input);
  if (!trimmed) return null;
  if (trimmed.includes('#')) {
    const hashIdx = trimmed.lastIndexOf('#');
    const namePart = trimmed.slice(0, hashIdx).trim();
    const tagPart = trimmed.slice(hashIdx + 1).replace(/\D/g, '').slice(0, 4);
    if (tagPart.length !== 4) return null;
    return { namePart, tagPart };
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 4 && digitsOnly === trimmed) {
    return { namePart: '', tagPart: digitsOnly };
  }
  return null;
}

/**
 * Generování unikátního 4místného tagu
 */
export async function generateUniqueTag() {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    if (isDemoModeActive()) {
      const state = loadDemoState();
      const exists = Object.values(state.users).some((u) => u.tag === candidate);
      if (!exists) return candidate;
    } else {
      const q = query(collection(db, 'users'), where('tag', '==', candidate), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return candidate;
    }
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Uživatelské profily (jednotlivě i dávkově po max. 30 UID bez N+1 dotazů)
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  if (isDemoModeActive()) {
    const state = loadDemoState();
    return state.users[uid] || null;
  }
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

export async function getUsersByUidsBatch(uids = []) {
  const uniqueUids = Array.from(new Set((uids || []).filter(Boolean)));
  if (uniqueUids.length === 0) return {};

  if (isDemoModeActive()) {
    const state = loadDemoState();
    const result = {};
    uniqueUids.forEach((id) => {
      if (state.users[id]) result[id] = state.users[id];
    });
    return result;
  }

  const chunks = [];
  for (let i = 0; i < uniqueUids.length; i += 30) {
    chunks.push(uniqueUids.slice(i, i + 30));
  }

  const result = {};
  await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(collection(db, 'users'), where('uid', 'in', chunk), limit(30));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        result[d.id] = { uid: d.id, ...d.data() };
      });
    })
  );
  return result;
}

export async function createUserProfile({ uid, displayName, avatarId, avatarBg }) {
  const tag = await generateUniqueTag();
  const profile = {
    uid,
    displayName: displayName.trim(),
    tag,
    avatarId,
    avatarBg,
    createdAt: Date.now(),
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    state.users[uid] = profile;
    state.activeUid = uid;
    saveDemoState(state);
    return profile;
  }

  await setDoc(doc(db, 'users', uid), profile);
  return profile;
}

export async function updateUserProfile(uid, updates) {
  const payload = {
    displayName: updates.displayName.trim(),
    avatarId: updates.avatarId,
    avatarBg: updates.avatarBg,
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (!state.users[uid]) throw new Error('Profil nenalezen.');
    state.users[uid] = { ...state.users[uid], ...payload };
    saveDemoState(state);
    return state.users[uid];
  }

  await updateDoc(doc(db, 'users', uid), payload);
  return getUserProfile(uid);
}

export async function findUserByTag(searchText, currentUid) {
  const parsed = parseTagSearch(searchText);
  if (!parsed) {
    throw new Error('Zadej prosím tag ve tvaru Jméno#1234 nebo čtyřmístný kód #1234.');
  }

  let matches = [];
  if (isDemoModeActive()) {
    const state = loadDemoState();
    matches = Object.values(state.users).filter((u) => u.tag === parsed.tagPart);
  } else {
    const q = query(collection(db, 'users'), where('tag', '==', parsed.tagPart), limit(5));
    const snap = await getDocs(q);
    matches = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  }

  if (parsed.namePart) {
    const lowerName = parsed.namePart.toLowerCase();
    matches = matches.filter((u) => (u.displayName || '').trim().toLowerCase() === lowerName);
  }

  const found = matches.find((u) => u.uid !== currentUid) || matches[0] || null;
  if (!found) {
    throw new Error('Nikoho s tímto tagem jsme nenašli. Zkontroluj prosím jméno i čtyřmístný kód.');
  }
  if (found.uid === currentUid) {
    throw new Error('Tohle je tvůj vlastní tag.');
  }
  return found;
}

/**
 * Dopisy (vlastní + dětské + volitelně sdílené dětské dopisy druhého rodiče)
 */
export async function getUserLetters(uid, options = {}) {
  if (!uid) return [];
  const includeCoParented = Boolean(options.includeCoParented);
  let list = [];

  if (isDemoModeActive()) {
    const state = loadDemoState();
    list = Object.values(state.letters).filter(
      (l) =>
        l.ownerUid === uid ||
        (includeCoParented && Array.isArray(l.coParentUids) && l.coParentUids.includes(uid))
    );
  } else {
    const ownedQuery = query(collection(db, 'letters'), where('ownerUid', '==', uid));
    if (!includeCoParented) {
      const snap = await getDocs(ownedQuery);
      list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      const coParentQuery = query(
        collection(db, 'letters'),
        where('coParentUids', 'array-contains', uid)
      );
      const [ownedSnap, coParentSnap] = await Promise.all([
        getDocs(ownedQuery),
        getDocs(coParentQuery),
      ]);
      const byId = new Map();
      ownedSnap.docs.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() }));
      coParentSnap.docs.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() }));
      list = Array.from(byId.values());
    }
  }

  return list.sort((a, b) => {
    if (a.isChildLetter !== b.isChildLetter) return a.isChildLetter ? 1 : -1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

export async function saveLetter(letterData) {
  const id = letterData.id || generateRandomId('letter');
  const coParentUids = Array.isArray(letterData.coParentUids)
    ? Array.from(
        new Set(
          letterData.coParentUids.filter((u) => typeof u === 'string' && u && u !== letterData.ownerUid)
        )
      )
    : [];

  const payload = {
    ownerUid: letterData.ownerUid,
    coParentUids,
    recipientName: (letterData.recipientName || '').trim(),
    isChildLetter: Boolean(letterData.isChildLetter),
    introText: letterData.introText || '',
    outroText: letterData.outroText || '',
    handwrittenPhotoUrl:
      typeof letterData.handwrittenPhotoUrl === 'string'
        ? letterData.handwrittenPhotoUrl
        : '',
    sealedAt: letterData.sealedAt || null,
    printTheme: ['handwritten', 'fairytale', 'minimal'].includes(letterData.printTheme)
      ? letterData.printTheme
      : 'handwritten',
    wishes: (letterData.wishes || []).map((w) => ({
      id: w.id || generateRandomId('wish'),
      title: (w.title || '').trim(),
      url: normalizeUrl(w.url),
      note: (w.note || '').trim(),
      createdAt: w.createdAt || Date.now(),
    })),
    createdAt: letterData.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    state.letters[id] = { id, ...payload };
    saveDemoState(state);
    return state.letters[id];
  }

  await setDoc(doc(db, 'letters', id), payload, { merge: true });
  return { id, ...payload };
}

export async function deleteLetter(letterId) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    delete state.letters[letterId];
    saveDemoState(state);
    return;
  }
  await deleteDoc(doc(db, 'letters', letterId));
}

/**
 * Propojení přes tagy a rodinné skupiny
 */
export async function getConnectionsAndGroups(uid) {
  let connections = [];
  let groups = [];

  if (isDemoModeActive()) {
    const state = loadDemoState();
    connections = Object.values(state.connections).filter((c) => c.users.includes(uid));
    groups = Object.values(state.groups).filter((g) => g.memberUids.includes(uid));
  } else {
    const [connSnap, grpSnap] = await Promise.all([
      getDocs(query(collection(db, 'connections'), where('users', 'array-contains', uid))),
      getDocs(query(collection(db, 'groups'), where('memberUids', 'array-contains', uid))),
    ]);
    connections = connSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    groups = grpSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const relatedUids = new Set();
  connections.forEach((c) => {
    (c.users || []).forEach((u) => {
      if (u && u !== uid) relatedUids.add(u);
    });
  });
  groups.forEach((g) => {
    (g.memberUids || []).forEach((u) => {
      if (u && u !== uid) relatedUids.add(u);
    });
  });

  const usersMap = await getUsersByUidsBatch(Array.from(relatedUids));

  // Všichni potvrzení propojení lidé z kolekce connections (status === 'accepted')
  const acceptedContacts = connections
    .filter((c) => c.status === 'accepted' && Array.isArray(c.users) && c.users.includes(uid))
    .map((c) => {
      const otherUid = c.users.find((u) => u !== uid);
      if (!otherUid) return null;
      const profile = usersMap[otherUid] || {
        uid: otherUid,
        displayName: 'Propojený kontakt',
        tag: '0000',
        avatarId: 'star',
        avatarBg: '#F5E6D3',
      };
      usersMap[otherUid] = profile;
      return {
        connectionId: c.id,
        uid: otherUid,
        user: profile,
      };
    })
    .filter(Boolean);

  return { connections, groups, usersMap, acceptedContacts };
}

export async function sendConnectionRequest(fromUid, toUid) {
  const sortedUsers = [fromUid, toUid].sort();
  const connId = `${sortedUsers[0]}_${sortedUsers[1]}`;

  if (isDemoModeActive()) {
    const state = loadDemoState();
    const existing = state.connections[connId];
    if (existing) {
      if (existing.status === 'accepted') throw new Error('S tímto člověkem už jste propojení.');
      throw new Error('Žádost o sdílení už byla odeslána nebo čeká na potvrzení.');
    }
    const conn = {
      id: connId,
      users: sortedUsers,
      status: 'pending',
      requestedBy: fromUid,
      createdAt: Date.now(),
    };
    state.connections[connId] = conn;
    saveDemoState(state);
    return conn;
  }

  const ref = doc(db, 'connections', connId);
  const existingSnap = await getDoc(ref);
  if (existingSnap.exists()) {
    const data = existingSnap.data();
    if (data.status === 'accepted') {
      throw new Error('S tímto člověkem už jste propojení.');
    }
    throw new Error('Žádost o sdílení už byla odeslána nebo čeká na potvrzení.');
  }

  const payload = {
    users: sortedUsers,
    status: 'pending',
    requestedBy: fromUid,
    createdAt: Date.now(),
  };
  await setDoc(ref, payload);
  return { id: connId, ...payload };
}

export async function acceptConnectionRequest(connectionId) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (state.connections[connectionId]) {
      state.connections[connectionId].status = 'accepted';
      saveDemoState(state);
    }
    return;
  }
  await updateDoc(doc(db, 'connections', connectionId), { status: 'accepted' });
}

export async function removeConnection(connectionId) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    delete state.connections[connectionId];
    saveDemoState(state);
    return;
  }
  await deleteDoc(doc(db, 'connections', connectionId));
}

export function generateGroupInviteCode() {
  return `SKUPINA-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createGroup(createdBy, name, memberUids = [], options = {}) {
  const uniqueMembers = Array.from(new Set([createdBy, ...memberUids]));
  const id = generateRandomId('group');
  const icon = ['home', 'friends', 'tree', 'work', 'heart'].includes(options.icon)
    ? options.icon
    : 'home';
  const showChildLetters =
    options.showChildLetters !== undefined ? Boolean(options.showChildLetters) : true;
  const inviteCode = options.inviteCode || generateGroupInviteCode();

  const payload = {
    name: name.trim(),
    icon,
    inviteCode,
    showChildLetters,
    createdBy,
    memberUids: uniqueMembers,
    createdAt: Date.now(),
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    state.groups[id] = { id, ...payload };
    saveDemoState(state);
    return state.groups[id];
  }

  await setDoc(doc(db, 'groups', id), payload);
  return { id, ...payload };
}

export async function updateGroup(groupId, updates) {
  const uniqueMembers = Array.from(new Set(updates.memberUids || []));
  const payload = {
    name: (updates.name || '').trim(),
    icon: ['home', 'friends', 'tree', 'work', 'heart'].includes(updates.icon)
      ? updates.icon
      : 'home',
    showChildLetters:
      updates.showChildLetters !== undefined ? Boolean(updates.showChildLetters) : true,
    memberUids: uniqueMembers,
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (!state.groups[groupId]) throw new Error('Skupina nebyla nalezena.');
    state.groups[groupId] = {
      ...state.groups[groupId],
      ...payload,
    };
    saveDemoState(state);
    return state.groups[groupId];
  }

  await updateDoc(doc(db, 'groups', groupId), payload);
  return { id: groupId, ...payload };
}

export async function updateGroupMembers(groupId, memberUids) {
  const uniqueMembers = Array.from(new Set(memberUids));
  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (state.groups[groupId]) {
      state.groups[groupId].memberUids = uniqueMembers;
      saveDemoState(state);
    }
    return;
  }
  await updateDoc(doc(db, 'groups', groupId), { memberUids: uniqueMembers });
}

export async function leaveGroup(groupId, uid) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    const g = state.groups[groupId];
    if (!g) return;
    g.memberUids = (g.memberUids || []).filter((m) => m !== uid);
    if (g.memberUids.length === 0) {
      delete state.groups[groupId];
    }
    saveDemoState(state);
    return;
  }

  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const remaining = (data.memberUids || []).filter((m) => m !== uid);
  if (remaining.length === 0) {
    await deleteDoc(ref);
  } else {
    await updateDoc(ref, { memberUids: remaining });
  }
}

export async function joinGroupByInviteCode(uid, rawCode) {
  const cleaned = extractInviteCodeFromInput(rawCode).toUpperCase();
  if (!cleaned) {
    throw new Error('Zadej prosím platný kód skupiny (např. SKUPINA-8412).');
  }

  if (isDemoModeActive()) {
    const state = loadDemoState();
    const found = Object.values(state.groups).find(
      (g) => (g.inviteCode || '').toUpperCase() === cleaned
    );
    if (!found) {
      throw new Error('Skupinu s tímto zvacím kódem jsme nenašli.');
    }
    if ((found.memberUids || []).includes(uid)) {
      throw new Error(`Ve skupině „${found.name}“ už jsi členem.`);
    }
    found.memberUids = [...(found.memberUids || []), uid];
    saveDemoState(state);
    return found;
  }

  const q = query(collection(db, 'groups'), where('inviteCode', '==', cleaned), limit(2));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('Skupinu s tímto zvacím kódem jsme nenašli.');
  }
  const groupDoc = snap.docs[0];
  const groupData = groupDoc.data();
  if ((groupData.memberUids || []).includes(uid)) {
    throw new Error(`Ve skupině „${groupData.name}“ už jsi členem.`);
  }
  const nextMembers = [...(groupData.memberUids || []), uid];
  await updateDoc(groupDoc.ref, { memberUids: nextMembers });
  return { id: groupDoc.id, ...groupData, memberUids: nextMembers };
}

export async function deleteGroup(groupId) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    delete state.groups[groupId];
    saveDemoState(state);
    return;
  }
  await deleteDoc(doc(db, 'groups', groupId));
}

/**
 * Prohlížení cizích dopisů a tajné zamlouvání (claims)
 * POZOR: nikdy nečte claims pro vlastní dopisy ani pro dětské dopisy, kde je uživatel v coParentUids.
 */
export async function getMemberLettersWithAvailability(viewerUid, targetUid) {
  if (!viewerUid || !targetUid || viewerUid === targetUid) {
    throw new Error('Nelze zobrazit rezervace vlastního dopisu.');
  }

  const allTargetLetters = await getUserLetters(targetUid, { includeCoParented: false });
  // Vynecháme dětské dopisy, které viewerUid spoluvlastní jako druhý rodič (ty spravuje v „Napsat dopis“)
  const letters = allTargetLetters.filter(
    (l) => !(Array.isArray(l.coParentUids) && l.coParentUids.includes(viewerUid))
  );

  if (letters.length === 0) return [];

  if (isDemoModeActive()) {
    const state = loadDemoState();
    const claims = Object.values(state.claims).filter((c) => c.letterOwnerUid === targetUid);
    const claimedSet = new Set(claims.map((c) => `${c.letterId}::${c.wishId}`));
    return letters.map((letter) => ({
      ...letter,
      availableWishes: (letter.wishes || []).filter(
        (wish) => !claimedSet.has(`${letter.id}::${wish.id}`)
      ),
    }));
  }

  // Ve Firestore ověříme deterministická ID claims/{letterId}_{wishId} přes getDoc,
  // což 100% respektuje pravidlo pro coParentUids i když jiný dopis téhož rodiče je sdílený.
  const claimedSet = new Set();
  const slotChecks = [];
  letters.forEach((letter) => {
    (letter.wishes || []).forEach((wish) => {
      const claimId = `${letter.id}_${wish.id}`;
      slotChecks.push(
        getDoc(doc(db, 'claims', claimId)).then((snap) => {
          if (snap.exists()) {
            claimedSet.add(`${letter.id}::${wish.id}`);
          }
        })
      );
    });
  });
  await Promise.all(slotChecks);

  return letters.map((letter) => ({
    ...letter,
    availableWishes: (letter.wishes || []).filter(
      (wish) => !claimedSet.has(`${letter.id}::${wish.id}`)
    ),
  }));
}

/**
 * Sloučený a deduplikovaný přehled všech dopisů rodiny (dospělí i děti na stejné úrovni)
 */
export async function getAllFamilyLettersOverview(viewerUid) {
  if (!viewerUid) return { cards: [], connections: [], groups: [], usersMap: {} };

  const { connections, groups, usersMap } = await getConnectionsAndGroups(viewerUid);

  // Deduplikace všech viditelných členů rodiny (přijatá přímá propojení + členové společných skupin)
  const visibleMemberUids = new Set();
  connections.forEach((conn) => {
    if (conn.status === 'accepted') {
      conn.users.forEach((u) => {
        if (u !== viewerUid) visibleMemberUids.add(u);
      });
    }
  });
  groups.forEach((grp) => {
    (grp.memberUids || []).forEach((u) => {
      if (u !== viewerUid) visibleMemberUids.add(u);
    });
  });

  const memberLettersPairs = await Promise.all(
    Array.from(visibleMemberUids).map(async (memberUid) => {
      const ownerProfile = usersMap[memberUid] || (await getUserProfile(memberUid));
      if (!ownerProfile) return [];

      // Skupiny, které viewerUid a memberUid sdílejí
      const sharedGroups = groups.filter((g) => (g.memberUids || []).includes(memberUid));
      const allSharedGroupIds = sharedGroups.map((g) => g.id);
      const allSharedGroupNames = sharedGroups.map((g) => g.name);

      // Skupiny, ve kterých je povoleno zobrazovat i dětské dopisy
      const childAllowedGroups = sharedGroups.filter((g) => g.showChildLetters !== false);
      const canSeeChildLetters =
        sharedGroups.length === 0 ? true : childAllowedGroups.length > 0;

      const letters = await getMemberLettersWithAvailability(viewerUid, memberUid);
      const filteredLetters = letters.filter(
        (l) => !l.isChildLetter || canSeeChildLetters
      );

      if (filteredLetters.length === 0) {
        return [
          {
            cardId: `empty-${memberUid}`,
            letter: null,
            ownerProfile,
            recipientName: ownerProfile.displayName,
            isChildLetter: false,
            parentName: null,
            availableWishes: [],
            groupIds: allSharedGroupIds,
            groupNames: allSharedGroupNames,
          },
        ];
      }
      return filteredLetters.map((letter) => {
        const isChild = Boolean(letter.isChildLetter);
        return {
          cardId: letter.id,
          letter,
          ownerProfile,
          recipientName: letter.recipientName || ownerProfile.displayName,
          isChildLetter: isChild,
          parentName: isChild ? ownerProfile.displayName : null,
          availableWishes: letter.availableWishes || [],
          groupIds: isChild
            ? childAllowedGroups.map((g) => g.id)
            : allSharedGroupIds,
          groupNames: isChild
            ? childAllowedGroups.map((g) => g.name)
            : allSharedGroupNames,
        };
      });
    })
  );

  const cards = memberLettersPairs.flat();
  return { cards, connections, groups, usersMap };
}

export async function claimWish(claimerUid, letter, wish) {
  const coParents = Array.isArray(letter.coParentUids) ? letter.coParentUids : [];
  if (claimerUid === letter.ownerUid || coParents.includes(claimerUid)) {
    throw new Error('Nemůžeš si zamluvit dárek z dopisu, který sám spravuješ.');
  }

  const claimId = `${letter.id}_${wish.id}`;
  const payload = {
    letterId: letter.id,
    letterOwnerUid: letter.ownerUid,
    letterCoParentUids: coParents,
    wishId: wish.id,
    wishTitleSnapshot: wish.title,
    wishUrlSnapshot: wish.url || '',
    wishNoteSnapshot: wish.note || '',
    recipientNameSnapshot: letter.recipientName,
    claimedByUid: claimerUid,
    isBought: false,
    orphanStatus: 'active',
    createdAt: Date.now(),
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (state.claims[claimId]) {
      throw new Error('Toto přání si právě zamluvil někdo jiný z rodiny.');
    }
    state.claims[claimId] = { id: claimId, ...payload };
    saveDemoState(state);
    return state.claims[claimId];
  }

  const claimRef = doc(db, 'claims', claimId);
  const existing = await getDoc(claimRef);
  if (existing.exists()) {
    throw new Error('Toto přání si právě zamluvil někdo jiný z rodiny.');
  }

  await setDoc(claimRef, payload);
  return { id: claimId, ...payload };
}

export async function unclaimWish(claimId) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    delete state.claims[claimId];
    saveDemoState(state);
    return;
  }
  await deleteDoc(doc(db, 'claims', claimId));
}

export async function toggleClaimBought(claimId, isBought) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (state.claims[claimId]) {
      state.claims[claimId].isBought = Boolean(isBought);
      saveDemoState(state);
    }
    return;
  }
  await updateDoc(doc(db, 'claims', claimId), { isBought: Boolean(isBought) });
}

/**
 * Pomocné čtení všech rezervací kupujícího (splňuje security rule letterOwnerUid != auth.uid)
 */
async function fetchBuyerClaims(buyerUid) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    return Object.values(state.claims).filter(
      (c) => c.claimedByUid === buyerUid && c.letterOwnerUid !== buyerUid
    );
  }

  try {
    const q = query(
      collection(db, 'claims'),
      where('claimedByUid', '==', buyerUid),
      where('letterOwnerUid', '!=', buyerUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // Pokud zatím není nasazený složený index, bezpečně se přepneme na jednopoložkový filtr
    if (err?.code === 'failed-precondition') {
      const fallbackQ = query(
        collection(db, 'claims'),
        where('letterOwnerUid', '!=', buyerUid)
      );
      const snap = await getDocs(fallbackQ);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.claimedByUid === buyerUid);
    }
    throw err;
  }
}

/**
 * Nákupní seznam („Co mám koupit“) + kontrola smazaných přání / smazaných účtů
 */
export async function getShoppingList(buyerUid) {
  const rawClaims = await fetchBuyerClaims(buyerUid);
  let privateIdeas = [];

  if (isDemoModeActive()) {
    const state = loadDemoState();
    privateIdeas = Object.values(state.privateIdeas).filter((p) => p.ownerUid === buyerUid);
  } else {
    const ideasSnap = await getDocs(
      query(collection(db, 'privateIdeas'), where('ownerUid', '==', buyerUid))
    );
    privateIdeas = ideasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const ownerUids = Array.from(new Set(rawClaims.map((c) => c.letterOwnerUid)));
  const ownerProfiles = {};
  const ownerLettersById = {};

  await Promise.all(
    ownerUids.map(async (ownerUid) => {
      const profile = await getUserProfile(ownerUid);
      ownerProfiles[ownerUid] = profile;
      if (profile) {
        const letters = await getUserLetters(ownerUid);
        letters.forEach((l) => {
          ownerLettersById[l.id] = l;
        });
      }
    })
  );

  const enrichedClaims = rawClaims.map((claim) => {
    const ownerProfile = ownerProfiles[claim.letterOwnerUid];
    let orphanStatus = 'active';
    let recipientName = claim.recipientNameSnapshot;

    if (!ownerProfile) {
      orphanStatus = 'account_deleted';
    } else {
      const letter = ownerLettersById[claim.letterId];
      if (!letter) {
        orphanStatus = 'wish_deleted';
      } else {
        recipientName = letter.recipientName || recipientName;
        const stillInLetter = (letter.wishes || []).some((w) => w.id === claim.wishId);
        if (!stillInLetter) {
          orphanStatus = 'wish_deleted';
        }
      }
    }

    return {
      ...claim,
      recipientName,
      orphanStatus,
    };
  });

  enrichedClaims.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  privateIdeas.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return { claims: enrichedClaims, privateIdeas };
}

/**
 * Tajné vlastní nápady na dárky (privateIdeas)
 */
export async function addPrivateIdea({ ownerUid, targetUid = null, targetName, title, url, note }) {
  const id = generateRandomId('idea');
  const payload = {
    ownerUid,
    targetUid: targetUid || null,
    targetName: targetName.trim(),
    title: title.trim(),
    url: normalizeUrl(url),
    note: (note || '').trim(),
    isBought: false,
    createdAt: Date.now(),
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    state.privateIdeas[id] = { id, ...payload };
    saveDemoState(state);
    return state.privateIdeas[id];
  }

  await setDoc(doc(db, 'privateIdeas', id), payload);
  return { id, ...payload };
}

export async function updatePrivateIdea(ideaId, { targetUid = null, targetName, title, url, note }) {
  const updates = {
    targetUid: targetUid || null,
    targetName: targetName.trim(),
    title: title.trim(),
    url: normalizeUrl(url),
    note: (note || '').trim(),
  };

  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (!state.privateIdeas[ideaId]) throw new Error('Tajný nápad nebyl nalezen.');
    state.privateIdeas[ideaId] = {
      ...state.privateIdeas[ideaId],
      ...updates,
    };
    saveDemoState(state);
    return state.privateIdeas[ideaId];
  }

  await updateDoc(doc(db, 'privateIdeas', ideaId), updates);
  const snap = await getDoc(doc(db, 'privateIdeas', ideaId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : { id: ideaId, ...updates };
}

export async function togglePrivateIdeaBought(ideaId, isBought) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    if (state.privateIdeas[ideaId]) {
      state.privateIdeas[ideaId].isBought = Boolean(isBought);
      saveDemoState(state);
    }
    return;
  }
  await updateDoc(doc(db, 'privateIdeas', ideaId), { isBought: Boolean(isBought) });
}

export async function deletePrivateIdea(ideaId) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    delete state.privateIdeas[ideaId];
    saveDemoState(state);
    return;
  }
  await deleteDoc(doc(db, 'privateIdeas', ideaId));
}

/**
 * Kompletní smazání profilu a dat uživatele:
 * - uvolní všechny dárky, které uživatel zamluvil ostatním
 * - smaže jeho dopisy (včetně dětských), tajné nápady, propojení a skupiny
 * - poznámky ostatních na jeho smazané dopisy zůstanou zachované jako text s orphanStatus = 'account_deleted'
 */
export async function deleteUserAccountCompletely(uid, authUser) {
  if (isDemoModeActive()) {
    const state = loadDemoState();
    delete state.users[uid];

    Object.keys(state.letters).forEach((lid) => {
      if (state.letters[lid].ownerUid === uid) {
        delete state.letters[lid];
      }
    });

    Object.keys(state.claims).forEach((cid) => {
      const claim = state.claims[cid];
      if (claim.claimedByUid === uid) {
        delete state.claims[cid];
      } else if (claim.letterOwnerUid === uid) {
        claim.orphanStatus = 'account_deleted';
      }
    });

    Object.keys(state.privateIdeas).forEach((pid) => {
      if (state.privateIdeas[pid].ownerUid === uid) {
        delete state.privateIdeas[pid];
      }
    });

    Object.keys(state.connections).forEach((cid) => {
      if (state.connections[cid].users.includes(uid)) {
        delete state.connections[cid];
      }
    });

    Object.keys(state.groups).forEach((gid) => {
      const g = state.groups[gid];
      if (g.createdBy === uid) {
        delete state.groups[gid];
      } else if (g.memberUids.includes(uid)) {
        g.memberUids = g.memberUids.filter((m) => m !== uid);
        if (g.memberUids.length === 0) delete state.groups[gid];
      }
    });

    const remainingUids = Object.keys(state.users);
    state.activeUid = remainingUids[0] || null;
    saveDemoState(state);
    return;
  }

  // Pokud se uživatel přihlásil dávno, obnovíme nejprve čerstvost Google přihlášení,
  // aby deleteUser(authUser) na konci neselhal na auth/requires-recent-login.
  if (authUser?.metadata?.lastSignInTime) {
    const signedInMs = new Date(authUser.metadata.lastSignInTime).getTime();
    if (Date.now() - signedInMs > 4 * 60 * 1000) {
      await reauthenticateWithPopup(authUser, googleProvider);
    }
  }

  const [buyerClaims, lettersSnap, ideasSnap, connsSnap, groupsSnap] = await Promise.all([
    fetchBuyerClaims(uid),
    getDocs(query(collection(db, 'letters'), where('ownerUid', '==', uid))),
    getDocs(query(collection(db, 'privateIdeas'), where('ownerUid', '==', uid))),
    getDocs(query(collection(db, 'connections'), where('users', 'array-contains', uid))),
    getDocs(query(collection(db, 'groups'), where('memberUids', 'array-contains', uid))),
  ]);

  const ops = [];

  buyerClaims.forEach((claim) => {
    ops.push({ type: 'delete', ref: doc(db, 'claims', claim.id) });
  });
  lettersSnap.docs.forEach((d) => {
    ops.push({ type: 'delete', ref: d.ref });
  });
  ideasSnap.docs.forEach((d) => {
    ops.push({ type: 'delete', ref: d.ref });
  });
  connsSnap.docs.forEach((d) => {
    ops.push({ type: 'delete', ref: d.ref });
  });
  groupsSnap.docs.forEach((d) => {
    const data = d.data();
    const remaining = (data.memberUids || []).filter((m) => m !== uid);
    if (data.createdBy === uid || remaining.length === 0) {
      ops.push({ type: 'delete', ref: d.ref });
    } else {
      ops.push({ type: 'update', ref: d.ref, data: { memberUids: remaining } });
    }
  });
  ops.push({ type: 'delete', ref: doc(db, 'users', uid) });

  // Zápis v dávkách po max 450 operacích
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    const slice = ops.slice(i, i + 450);
    slice.forEach((op) => {
      if (op.type === 'delete') batch.delete(op.ref);
      if (op.type === 'update') batch.update(op.ref, op.data);
    });
    await batch.commit();
  }

  if (authUser) {
    await deleteUser(authUser);
  }
}
