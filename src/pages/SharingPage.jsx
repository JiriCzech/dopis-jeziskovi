import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Check,
  Copy,
  Edit3,
  FolderPlus,
  Heart,
  Home,
  Link as LinkIcon,
  LogOut,
  Search,
  Trash2,
  TreePine,
  UserCheck,
  UserPlus,
  Users,
  Wine,
  X,
} from 'lucide-react';
import { Avatar } from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import {
  acceptConnectionRequest,
  createGroup,
  deleteGroup,
  findUserByTag,
  joinGroupByInviteCode,
  leaveGroup,
  removeConnection,
  sendConnectionRequest,
  updateGroup,
} from '../lib/db';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const GROUP_ICON_OPTIONS = [
  { id: 'home', label: 'Rodina', Icon: Home },
  { id: 'friends', label: 'Kamarádi', Icon: Wine },
  { id: 'tree', label: 'Vánoce', Icon: TreePine },
  { id: 'work', label: 'Kolegové', Icon: Briefcase },
  { id: 'heart', label: 'Blízcí', Icon: Heart },
];

export function renderGroupIcon(iconId, className = 'w-4 h-4') {
  const found = GROUP_ICON_OPTIONS.find((o) => o.id === iconId) || GROUP_ICON_OPTIONS[0];
  const IconComp = found.Icon;
  return <IconComp className={className} />;
}

export function SharingPage() {
  const { authUser, profile, notify } = useAuth();
  const {
    connections,
    groups,
    familyCards,
    usersById: usersMap,
    acceptedContacts,
  } = useAppData();

  const [copiedPersonal, setCopiedPersonal] = useState(false);
  const [copiedPersonalLink, setCopiedPersonalLink] = useState(false);
  const [copiedGroupId, setCopiedGroupId] = useState(null);
  const [copiedGroupLinkId, setCopiedGroupLinkId] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get('code') || '');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get('code');
    if (prefill) {
      setSearchInput(prefill);
      searchParams.delete('code');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [foundUser, setFoundUser] = useState(null);
  const [searchError, setSearchError] = useState('');

  const [connectionToRemove, setConnectionToRemove] = useState(null);
  const [removingConnection, setRemovingConnection] = useState(false);

  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('home');
  const [showChildLetters, setShowChildLetters] = useState(true);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [groupToLeave, setGroupToLeave] = useState(null);

  const loadSharingData = useCallback(async () => {}, []);

  if (!profile) return null;

  const fullCode = `${profile.displayName}#${profile.tag}`;

  const buildInviteLink = (code) => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://dopis-jeziskovi.vercel.app';
    return `${origin}/?invite=${encodeURIComponent(code)}`;
  };

  const handleCopyPersonalCode = async () => {
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopiedPersonal(true);
      notify(`Zkopírováno do schránky: ${fullCode}`);
      setTimeout(() => setCopiedPersonal(false), 2500);
    } catch {
      notify(`Tvůj osobní kód je: ${fullCode}`);
    }
  };

  const handleCopyPersonalLink = async () => {
    const link = buildInviteLink(fullCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedPersonalLink(true);
      notify('Zvací odkaz zkopírován.');
      setTimeout(() => setCopiedPersonalLink(false), 2500);
    } catch {
      notify(`Zvací odkaz: ${link}`);
    }
  };

  const handleCopyGroupCode = async (group) => {
    const code = group.inviteCode || '';
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedGroupId(group.id);
      notify(`Kód skupiny zkopírován: ${code}`);
      setTimeout(() => setCopiedGroupId(null), 2500);
    } catch {
      notify(`Kód skupiny je: ${code}`);
    }
  };

  const handleCopyGroupLink = async (group) => {
    const code = group.inviteCode || '';
    if (!code) return;
    const link = buildInviteLink(code);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedGroupLinkId(group.id);
      notify(`Zvací odkaz do skupiny „${group.name}“ zkopírován.`);
      setTimeout(() => setCopiedGroupLinkId(null), 2500);
    } catch {
      notify(`Zvací odkaz: ${link}`);
    }
  };

  const handleSearchOrJoin = async (e) => {
    e.preventDefault();
    const raw = searchInput.trim();
    if (!raw) {
      setSearchError('Zadej prosím osobní kód (např. Dana#7392) nebo kód skupiny.');
      return;
    }
    if (!authUser) return;

    setSearching(true);
    setSearchError('');
    setFoundUser(null);

    try {
      const extracted = searchInput.includes('?invite=')
        ? new URL(searchInput, 'https://dopis-jeziskovi.local').searchParams.get('invite') || raw
        : raw;

      if (/^SKUPINA-\d{3,6}$/i.test(extracted.trim())) {
        const joined = await joinGroupByInviteCode(authUser.uid, extracted.trim());
        notify(`Připojil/a ses do skupiny „${joined.name}“.`);
        setSearchInput('');
        await loadSharingData();
        return;
      }

      const found = await findUserByTag(extracted.trim(), authUser.uid);
      setFoundUser(found);
    } catch (err) {
      setSearchError(err.message || 'Kód nebyl nalezen.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendInvite = async (targetUser) => {
    if (!authUser) return;
    try {
      await sendConnectionRequest(authUser.uid, targetUser.uid);
      notify(`Pozvánka byla odeslána pro ${targetUser.displayName}.`);
      setFoundUser(null);
      setSearchInput('');
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Pozvánku se nepodařilo odeslat.', 'error');
    }
  };

  const handleAccept = async (connId) => {
    try {
      await acceptConnectionRequest(connId);
      notify('Propojení bylo potvrzeno.');
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Nepodařilo se přijmout pozvánku.', 'error');
    }
  };

  const handleDeclineOrRemove = async (connId, msg = 'Propojení bylo zrušeno.') => {
    try {
      await removeConnection(connId);
      notify(msg);
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Akce se nezdařila.', 'error');
    }
  };

  const handleConfirmRemoveConnection = async () => {
    if (!connectionToRemove) return;
    setRemovingConnection(true);
    try {
      await removeConnection(connectionToRemove.connectionId);
      notify(`Propojení s ${connectionToRemove.user.displayName} bylo odebráno.`);
      setConnectionToRemove(null);
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Odebrání propojení se nezdařilo.', 'error');
    } finally {
      setRemovingConnection(false);
    }
  };

  const incomingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy !== authUser?.uid
  );
  const outgoingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy === authUser?.uid
  );

  // Všichni potvrzení propojení lidé z connections se status === 'accepted'
  const selectableContactsMap = {};
  acceptedContacts.forEach(({ uid, user }) => {
    if (uid && uid !== authUser?.uid && user) {
      selectableContactsMap[uid] = user;
    }
  });
  connections
    .filter((c) => c.status === 'accepted')
    .forEach((c) => {
      const otherUid = (c.users || []).find((u) => u !== authUser?.uid);
      if (otherUid && usersMap[otherUid]) {
        selectableContactsMap[otherUid] = usersMap[otherUid];
      }
    });
  if (editingGroup) {
    (editingGroup.memberUids || []).forEach((uid) => {
      if (uid !== authUser?.uid && usersMap[uid]) {
        selectableContactsMap[uid] = usersMap[uid];
      }
    });
  }
  const selectableContacts = Object.values(selectableContactsMap);

  const toggleMemberInSelection = (uid) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const openNewGroupForm = async () => {
    await loadSharingData();
    setEditingGroup(null);
    setGroupName('');
    setGroupIcon('home');
    setShowChildLetters(true);
    setSelectedGroupMembers([]);
    setGroupFormOpen(true);
  };

  const openEditGroupForm = async (group) => {
    await loadSharingData();
    setEditingGroup(group);
    setGroupName(group.name || '');
    setGroupIcon(group.icon || 'home');
    setShowChildLetters(group.showChildLetters !== false);
    setSelectedGroupMembers(
      (group.memberUids || []).filter((u) => u !== authUser?.uid)
    );
    setGroupFormOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!authUser || !groupName.trim()) return;
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: groupName,
          icon: groupIcon,
          showChildLetters,
          memberUids: [authUser.uid, ...selectedGroupMembers],
        });
        notify(`Skupina „${groupName.trim()}“ byla upravena.`);
      } else {
        await createGroup(authUser.uid, groupName, selectedGroupMembers, {
          icon: groupIcon,
          showChildLetters,
        });
        notify(`Skupina „${groupName.trim()}“ byla vytvořena.`);
      }
      setEditingGroup(null);
      setGroupName('');
      setSelectedGroupMembers([]);
      setGroupFormOpen(false);
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Uložení skupiny se nezdařilo.', 'error');
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteGroup(groupToDelete.id);
      notify(`Skupina „${groupToDelete.name}“ byla smazána.`);
      setGroupToDelete(null);
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Smazání skupiny se nezdařilo.', 'error');
    }
  };

  const handleConfirmLeaveGroup = async () => {
    if (!authUser || !groupToLeave) return;
    try {
      await leaveGroup(groupToLeave.id, authUser.uid);
      notify(`Opustil/a jsi skupinu „${groupToLeave.name}“.`);
      setGroupToLeave(null);
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Opuštění skupiny se nezdařilo.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-page-transition min-w-0">
      <div>
        <h1 className="font-fairytale font-bold text-[32px] sm:text-[38px] leading-tight text-slate-text">
          Sdílení a skupiny
        </h1>
      </div>

      {/* 1. Osobní kód a zvací odkaz */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-sheet border border-paper-warm shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar avatarId={profile.avatarId} avatarBg={profile.avatarBg} size="md" />
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-fir">
              Osobní kód
            </div>
            <div className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text break-all leading-tight">
              {fullCode}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPersonalLink}
            className="min-h-[44px] whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-fir hover:bg-fir-hover text-white text-sm sm:text-base font-bold shadow-xs transition"
          >
            {copiedPersonalLink ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <LinkIcon className="w-4 h-4 shrink-0" />
            )}
            <span>{copiedPersonalLink ? 'Odkaz zkopírován' : 'Sdílet odkaz'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyPersonalCode}
            className="min-h-[44px] whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-paper border border-paper-warm hover:bg-kraft text-sm sm:text-base font-bold text-slate-text transition"
          >
            {copiedPersonal ? (
              <Check className="w-4 h-4 text-fir shrink-0" />
            ) : (
              <Copy className="w-4 h-4 shrink-0" />
            )}
            <span>{copiedPersonal ? 'Zkopírováno' : 'Kód'}</span>
          </button>
        </div>
      </div>

      {/* 2. Přidat blízkého + kompaktní seznam propojených blízkých */}
      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="font-fairytale font-bold text-2xl sm:text-[28px] text-slate-text">
            Přidat blízkého
          </h2>

          <form onSubmit={handleSearchOrJoin} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-5 h-5 text-slate-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <label htmlFor="sharing-search-code" className="sr-only">
                Kód blízkého nebo kód skupiny
              </label>
              <input
                id="sharing-search-code"
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (searchError) setSearchError('');
                }}
                placeholder="Např. Dana#7392 nebo SKUPINA-1024"
                className="w-full min-h-[48px] pl-12 pr-4 py-2.5 rounded-xl border border-paper-warm bg-sheet text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="min-h-[48px] whitespace-nowrap px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold transition disabled:opacity-60 shrink-0 shadow-xs"
            >
              {searching ? 'Ověřuji...' : 'Potvrdit kód'}
            </button>
          </form>

          {searchError && (
            <p className="text-base text-crimson bg-crimson-soft px-4 py-3 rounded-xl">
              {searchError}
            </p>
          )}

          {foundUser && (
            <div className="p-4 rounded-2xl bg-fir-soft border border-fir/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar avatarId={foundUser.avatarId} avatarBg={foundUser.avatarBg} size="md" />
                <div className="min-w-0">
                  <div className="font-bold text-lg text-slate-text truncate">
                    {foundUser.displayName}
                  </div>
                  <div className="text-sm text-slate-text-muted truncate">
                    {foundUser.displayName}#{foundUser.tag}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSendInvite(foundUser)}
                className="min-h-[48px] whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold transition shrink-0"
              >
                <UserPlus className="w-5 h-5 shrink-0" />
                <span>Odeslat pozvánku</span>
              </button>
            </div>
          )}
        </div>

        {/* Čekající pozvánky */}
        {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
          <div className="space-y-3 pt-1">
            <h3 className="text-base font-bold text-slate-text">Čekající pozvánky</h3>

            {incomingRequests.map((req) => {
              const requester = usersMap[req.requestedBy];
              if (!requester) return null;
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-gold-soft/80 border border-gold/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      avatarId={requester.avatarId}
                      avatarBg={requester.avatarBg}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-text text-lg truncate">
                        {requester.displayName}
                      </div>
                      <div className="text-xs font-semibold text-fir">
                        Nová žádost o sdílení dopisů
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAccept(req.id)}
                      className="min-h-[44px] whitespace-nowrap inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold transition"
                    >
                      <UserCheck className="w-5 h-5 shrink-0" />
                      <span>Přijmout</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineOrRemove(req.id, 'Pozvánka byla odmítnuta.')}
                      className="min-h-[44px] whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-paper-warm bg-sheet text-base font-semibold text-crimson hover:bg-crimson-soft transition"
                    >
                      <X className="w-5 h-5 shrink-0" />
                      <span>Odmítnout</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {outgoingRequests.map((req) => {
              const targetUid = (req.users || []).find((u) => u !== authUser?.uid);
              const target = usersMap[targetUid];
              if (!target) return null;
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-sheet border border-paper-warm flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar avatarId={target.avatarId} avatarBg={target.avatarBg} size="sm" />
                    <div>
                      <div className="text-base font-bold text-slate-text">
                        {target.displayName}
                      </div>
                      <div className="text-xs font-semibold text-slate-text-muted">
                        Čeká na potvrzení pozvánky
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeclineOrRemove(req.id, 'Pozvánka byla zrušena.')}
                    className="min-h-[44px] px-3 rounded-xl text-sm font-semibold text-crimson hover:bg-crimson-soft transition shrink-0"
                  >
                    Zrušit
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Seznam propojených blízkých v čistých kompaktních řádcích s proklikem na přání */}
        <div className="space-y-3 pt-1">
          <h3 className="font-fairytale font-bold text-2xl sm:text-[26px] text-slate-text">
            Propojení blízcí ({acceptedContacts.length})
          </h3>

          {acceptedContacts.length === 0 ? (
            <div className="p-5 rounded-2xl bg-sheet border border-paper-warm text-sm sm:text-base text-slate-text-muted">
              Zatím žádní propojení blízcí. Pošli rodině svůj zvací odkaz nebo zadej její kód výše.
            </div>
          ) : (
            <ul className="rounded-2xl bg-sheet border border-paper-warm shadow-card overflow-hidden divide-y divide-paper-warm/70">
              {acceptedContacts.map(({ connectionId, user }) => {
                const memberCard = familyCards.find(
                  (c) => !c.isChildLetter && c.ownerProfile?.uid === user.uid
                );
                const wishCount = memberCard ? (memberCard.availableWishes || []).length : null;
                const wishText =
                  wishCount === null
                    ? null
                    : wishCount === 0
                      ? 'Všechna přání splněna'
                      : wishCount === 1
                        ? '1 přání'
                        : `${wishCount} přání`;
                const personTarget = memberCard ? memberCard.cardId : user.uid;

                return (
                  <li
                    key={connectionId}
                    className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar avatarId={user.avatarId} avatarBg={user.avatarBg} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-fairytale font-bold text-2xl text-slate-text leading-tight break-words">
                            {user.displayName}
                          </span>
                          {wishText && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                wishCount === 0
                                  ? 'bg-paper text-slate-text-muted'
                                  : 'bg-fir-soft text-fir'
                              }`}
                            >
                              {wishText}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-text-muted truncate">
                          {user.displayName}#{user.tag}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      <Link
                        to={`/rodina?person=${encodeURIComponent(personTarget)}`}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-fir-soft hover:bg-fir text-fir hover:text-white text-sm font-bold transition"
                      >
                        <span>Zobrazit přání</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConnectionToRemove({ connectionId, user })}
                        aria-label={`Odebrat propojení s ${user.displayName}`}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-text-muted hover:text-crimson hover:bg-crimson-soft transition"
                      >
                        <X className="w-4 h-4 shrink-0" />
                        <span>Odebrat</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* 3. Správa skupin (čisté ploché karty bez vnořených rámečků) */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-fairytale font-bold text-2xl sm:text-[28px] text-slate-text flex items-center gap-2">
            <Users className="w-5 h-5 text-fir shrink-0" />
            <span>Skupiny</span>
          </h2>
          <button
            type="button"
            onClick={openNewGroupForm}
            className="min-h-[44px] whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fir hover:bg-fir-hover text-white text-sm sm:text-base font-bold shadow-xs transition"
          >
            <FolderPlus className="w-4 h-4 shrink-0" />
            <span>Nová skupina</span>
          </button>
        </div>

        {groupFormOpen && (
          <form
            onSubmit={handleSaveGroup}
            className="rounded-2xl bg-sheet border border-paper-warm p-5 space-y-5 shadow-card animate-slide-up"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-fairytale font-bold text-2xl text-slate-text">
                {editingGroup ? `Upravit skupinu „${editingGroup.name}“` : 'Založit novou skupinu'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setGroupFormOpen(false);
                  setEditingGroup(null);
                }}
                aria-label="Zavřít formulář skupiny"
                className="min-w-[44px] min-h-[44px] -mr-1.5 rounded-xl inline-flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label
                htmlFor="sharing-group-name"
                className="block text-sm font-bold text-slate-text mb-1.5"
              >
                Název skupiny
              </label>
              <input
                id="sharing-group-name"
                type="text"
                maxLength={40}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Např. Naše rodina, Kamarádi, Kolegové..."
                className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-paper-warm bg-paper text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
                required
              />
            </div>

            <div>
              <span className="block text-sm font-bold text-slate-text mb-2">
                Vánoční ikonka skupiny
              </span>
              <div className="flex flex-wrap gap-2">
                {GROUP_ICON_OPTIONS.map(({ id, label, Icon }) => {
                  const active = groupIcon === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setGroupIcon(id)}
                      className={`min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold transition ${
                        active
                          ? 'bg-fir text-white border-fir'
                          : 'bg-sheet text-slate-text border-paper-warm hover:bg-fir-soft'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Výběr členů ze svých propojených kontaktů */}
            <div>
              <span className="block text-sm font-bold text-slate-text mb-2">
                Zaškrtni propojené lidi do skupiny
              </span>
              {selectableContacts.length === 0 ? (
                <p className="text-sm text-slate-text-muted">
                  Zatím žádné propojené kontakty.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectableContacts.map((user) => {
                    const checked = selectedGroupMembers.includes(user.uid);
                    return (
                      <label
                        key={user.uid}
                        className={`min-h-[54px] flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'border-fir bg-fir-soft'
                            : 'border-paper-warm bg-paper hover:bg-kraft/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMemberInSelection(user.uid)}
                          className="w-5 h-5 accent-[#1B4332] rounded cursor-pointer shrink-0"
                        />
                        <Avatar avatarId={user.avatarId} avatarBg={user.avatarBg} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-slate-text truncate">
                            {user.displayName}
                          </div>
                          <div className="text-xs text-slate-text-muted truncate">
                            {user.displayName}#{user.tag}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Soukromí dětských dopisů */}
            <label className="min-h-[44px] inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showChildLetters}
                onChange={(e) => setShowChildLetters(e.target.checked)}
                className="w-5 h-5 accent-[#1B4332] rounded cursor-pointer shrink-0"
              />
              <span className="text-sm font-bold text-slate-text">
                Včetně dětských dopisů
              </span>
            </label>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setGroupFormOpen(false);
                  setEditingGroup(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-paper-warm bg-paper text-sm font-semibold text-slate-text hover:bg-kraft transition"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-fir hover:bg-fir-hover text-white text-sm font-bold transition"
              >
                {editingGroup ? 'Uložit změny' : 'Založit skupinu'}
              </button>
            </div>
          </form>
        )}

        {groups.length === 0 ? (
          <p className="text-sm text-slate-text-muted">
            Zatím žádné skupiny.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => {
              const isFounder = g.createdBy === authUser?.uid;
              const codeCopied = copiedGroupId === g.id;
              const memberNames = (g.memberUids || [])
                .map((uid) =>
                  uid === authUser?.uid
                    ? `${profile.displayName} (ty)`
                    : usersMap[uid]?.displayName || 'Člen skupiny'
                )
                .filter(Boolean);

              return (
                <div
                  key={g.id}
                  className="p-4 sm:p-5 rounded-2xl bg-sheet border border-paper-warm shadow-card space-y-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-fir-soft text-fir border border-fir/25 flex items-center justify-center shrink-0 mt-0.5">
                        {renderGroupIcon(g.icon, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-text text-base sm:text-lg flex flex-wrap items-center gap-2">
                          <span>{g.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-paper border border-paper-warm text-xs font-medium text-slate-text-muted">
                            {g.showChildLetters === false
                              ? 'Jen osobní dopisy'
                              : 'Včetně dětských dopisů'}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-text-muted mt-1 break-words">
                          Členové ({(g.memberUids || []).length}): {memberNames.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isFounder ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditGroupForm(g)}
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper border border-paper-warm text-sm font-bold text-slate-text hover:bg-fir-soft transition"
                          >
                            <Edit3 className="w-4 h-4 shrink-0" />
                            <span>Upravit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupToDelete(g)}
                            title="Smazat skupinu"
                            aria-label={`Smazat skupinu ${g.name}`}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-crimson hover:bg-crimson-soft transition"
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">Smazat</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setGroupToLeave(g)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper border border-crimson/35 text-sm font-bold text-crimson hover:bg-crimson-soft transition"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Opustit skupinu</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {g.inviteCode && (
                    <div className="pt-3 border-t border-paper-warm/80 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="text-xs sm:text-sm text-slate-text">
                        <span className="text-slate-text-muted">Zvací kód skupiny: </span>
                        <strong className="font-bold text-fir">{g.inviteCode}</strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyGroupLink(g)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-fir hover:bg-fir-hover text-white text-sm font-bold transition"
                        >
                          {copiedGroupLinkId === g.id ? (
                            <Check className="w-4 h-4 shrink-0" />
                          ) : (
                            <LinkIcon className="w-4 h-4 shrink-0" />
                          )}
                          <span>
                            {copiedGroupLinkId === g.id
                              ? 'Odkaz zkopírován'
                              : 'Sdílet odkaz'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyGroupCode(g)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper hover:bg-kraft border border-paper-warm text-sm font-bold text-slate-text transition"
                        >
                          {codeCopied ? (
                            <Check className="w-4 h-4 text-fir shrink-0" />
                          ) : (
                            <Copy className="w-4 h-4 shrink-0" />
                          )}
                          <span>{codeCopied ? 'Zkopírováno' : 'Zkopírovat kód'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(connectionToRemove)}
        danger
        loading={removingConnection}
        title={`Odebrat propojení s ${connectionToRemove?.user?.displayName || ''}?`}
        description="Po odebrání přestaneš vidět dopisy tohoto člena a on neuvidí tvoje přání."
        confirmLabel="Odebrat propojení"
        onConfirm={handleConfirmRemoveConnection}
        onCancel={() => setConnectionToRemove(null)}
      />

      <ConfirmDialog
        open={Boolean(groupToDelete)}
        danger
        title={`Smazat skupinu „${groupToDelete?.name}“?`}
        description="Skupina bude odstraněna pro všechny členy. Vaše přímá propojení zůstanou zachována."
        confirmLabel="Smazat skupinu"
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => setGroupToDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(groupToLeave)}
        danger
        title={`Opustit skupinu „${groupToLeave?.name}“?`}
        description="Pokud opustíš skupinu, přestaneš v ní vidět ostatní členy, se kterými nemáš přímé propojení."
        confirmLabel="Opustit skupinu"
        onConfirm={handleConfirmLeaveGroup}
        onCancel={() => setGroupToLeave(null)}
      />
    </div>
  );
}
