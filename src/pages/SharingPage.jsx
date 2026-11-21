import React, { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  Check,
  Copy,
  Edit3,
  FolderPlus,
  Heart,
  Home,
  Link as LinkIcon,
  LogOut,
  Plus,
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
import {
  acceptConnectionRequest,
  createGroup,
  deleteGroup,
  findUserByTag,
  getConnectionsAndGroups,
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
  { id: 'work', label: 'Práce', Icon: Briefcase },
  { id: 'heart', label: 'Blízcí', Icon: Heart },
];

export function renderGroupIcon(iconId, className = 'w-4 h-4') {
  const found = GROUP_ICON_OPTIONS.find((o) => o.id === iconId) || GROUP_ICON_OPTIONS[0];
  const IconComp = found.Icon;
  return <IconComp className={className} />;
}

export function SharingPage() {
  const { authUser, profile, notify, refreshPendingCount } = useAuth();

  const [connections, setConnections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [acceptedContacts, setAcceptedContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [copiedPersonal, setCopiedPersonal] = useState(false);
  const [copiedPersonalLink, setCopiedPersonalLink] = useState(false);
  const [copiedGroupId, setCopiedGroupId] = useState(null);
  const [copiedGroupLinkId, setCopiedGroupLinkId] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Tvorba a úprava skupiny
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('home');
  const [showChildLetters, setShowChildLetters] = useState(true);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupToDelete, setGroupToDelete] = useState(null);

  const loadSharingData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const data = await getConnectionsAndGroups(authUser.uid);
      setConnections(data.connections || []);
      setGroups(data.groups || []);
      setUsersMap(data.usersMap || {});
      setAcceptedContacts(data.acceptedContacts || []);
      await refreshPendingCount();
    } catch (err) {
      notify(err.message || 'Nepodařilo se načíst propojení a skupiny.', 'error');
    } finally {
      setLoading(false);
    }
  }, [authUser, notify, refreshPendingCount]);

  useEffect(() => {
    loadSharingData();
  }, [loadSharingData]);

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
      notify('Zvací odkaz zkopírován — pošli ho do zprávy nebo na WhatsApp.');
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
    if (!raw || !authUser) return;

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

  const incomingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy !== authUser?.uid
  );
  const outgoingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy === authUser?.uid
  );

  // Sestavíme seznam všech propojených lidí k zaškrtnutí do skupiny (z přijatých connections + stávající členové při úpravě)
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

  const handleLeaveGroup = async (group) => {
    if (!authUser) return;
    try {
      await leaveGroup(group.id, authUser.uid);
      notify(`Opustil/a jsi skupinu „${group.name}“.`);
      await loadSharingData();
    } catch (err) {
      notify(err.message || 'Opuštění skupiny se nezdařilo.', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-page-transition">
      <div>
        <h1 className="font-fairytale font-bold text-[32px] sm:text-[36px] leading-tight text-slate-text">
          Sdílení a skupiny
        </h1>
        <p className="text-base text-slate-text-muted mt-0.5">
          Propoj se s rodinou či přáteli a spravuj své společné okruhy.
        </p>
      </div>

      {/* 1. Tvůj osobní kód a zvací odkaz */}
      <section className="stationery-sheet paper-grain-overlay rounded-3xl border border-[#E5DBC3] p-5 sm:p-7 space-y-4">
        <div>
          <h2 className="font-fairytale font-bold text-2xl text-slate-text">
            Tvůj osobní kód a zvací odkaz
          </h2>
          <p className="text-sm text-slate-text-muted mt-0.5">
            Pošli odkaz nebo kód blízkým, aby si tě mohli přidat.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F6F1E7] border border-[#E5DEC9]">
          <div className="font-bold text-xl text-fir break-all">
            {fullCode}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPersonalLink}
              className="min-h-[46px] whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-fir hover:bg-fir-dark text-white text-sm sm:text-base font-bold shadow-xs transition"
            >
              {copiedPersonalLink ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <LinkIcon className="w-4 h-4 shrink-0" />
              )}
              <span>{copiedPersonalLink ? 'Odkaz zkopírován' : 'Zkopírovat odkaz'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyPersonalCode}
              style={{ backgroundColor: '#FFFDF9' }}
              className="min-h-[46px] whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#FFFDF9] border border-[#E5DEC9] hover:bg-[#EAE1D0] text-sm sm:text-base font-bold text-slate-text transition"
            >
              {copiedPersonal ? (
                <Check className="w-4 h-4 text-fir shrink-0" />
              ) : (
                <Copy className="w-4 h-4 shrink-0" />
              )}
              <span>{copiedPersonal ? 'Zkopírováno' : 'Zkopírovat kód'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Přidat člověka nebo se připojit ke skupině + čekající pozvánky + propojení blízcí */}
      <section className="stationery-sheet paper-grain-overlay rounded-3xl border border-[#E5DBC3] p-5 sm:p-7 space-y-5">
        <div>
          <h2 className="font-fairytale font-bold text-2xl text-slate-text">
            Přidat člověka nebo se připojit ke skupině
          </h2>
          <p className="text-sm text-slate-text-muted mt-0.5">
            Zadej osobní kód člověka (např. <strong>Dana#7392</strong>) nebo kód skupiny (např.{' '}
            <strong>SKUPINA-8412</strong>).
          </p>
        </div>

        <form onSubmit={handleSearchOrJoin} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="w-5 h-5 text-slate-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Např. Dana#7392 nebo SKUPINA-8412"
              style={{ backgroundColor: '#F6F1E7' }}
              className="w-full min-h-[48px] pl-12 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-[#F6F1E7] text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchInput.trim()}
            className="min-h-[48px] whitespace-nowrap px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold transition disabled:opacity-50 shrink-0"
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
          <div className="p-4 rounded-xl bg-fir-soft border border-fir/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="min-h-[48px] whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold transition shrink-0"
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              <span>Odeslat pozvánku</span>
            </button>
          </div>
        )}

        {/* Čekající pozvánky */}
        {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
          <div className="space-y-3 pt-4 border-t border-[#E5DEC9]">
            <h3 className="text-base font-bold text-slate-text">Čekající pozvánky</h3>

            {incomingRequests.map((req) => {
              const requester = usersMap[req.requestedBy];
              if (!requester) return null;
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-gold-soft/70 border border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                      <div className="text-xs text-slate-text-muted">
                        Chce s tebou sdílet dopisy
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAccept(req.id)}
                      className="min-h-[46px] whitespace-nowrap inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold transition"
                    >
                      <UserCheck className="w-5 h-5 shrink-0" />
                      <span>Přijmout</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineOrRemove(req.id, 'Pozvánka byla odmítnuta.')}
                      className="min-h-[46px] whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] text-base font-semibold text-crimson hover:bg-crimson-soft transition"
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
                  style={{ backgroundColor: '#F6F1E7' }}
                  className="p-3.5 rounded-xl bg-[#F6F1E7] border border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar avatarId={target.avatarId} avatarBg={target.avatarBg} size="sm" />
                    <span className="text-base text-slate-text">
                      Pozvánka pro <strong>{target.displayName}</strong> čeká na potvrzení
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeclineOrRemove(req.id, 'Pozvánka byla zrušena.')}
                    className="text-sm font-semibold text-crimson hover:underline shrink-0"
                  >
                    Zrušit
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Seznam propojených blízkých */}
        <div className="space-y-3 pt-4 border-t border-[#E5DEC9]">
          <h3 className="text-base font-bold text-slate-text">
            Tvoji propojení blízcí ({acceptedContacts.length})
          </h3>

          {loading ? (
            <p className="text-sm text-slate-text-muted">Načítám propojené kontakty...</p>
          ) : acceptedContacts.length === 0 ? (
            <p className="text-sm text-slate-text-muted">
              Zatím nemáš žádné přímé propojení. Pošli někomu svůj odkaz nebo zadej jeho kód výše.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {acceptedContacts.map(({ connectionId, user }) => (
                <div
                  key={connectionId}
                  style={{ backgroundColor: '#F6F1E7' }}
                  className="p-3.5 rounded-2xl bg-[#F6F1E7] border border-[#E5DEC9] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar avatarId={user.avatarId} avatarBg={user.avatarBg} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-text truncate">{user.displayName}</div>
                      <div className="text-xs text-slate-text-muted truncate">
                        {user.displayName}#{user.tag}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeclineOrRemove(connectionId, 'Propojení bylo odebráno.')}
                    title="Odebrat propojení"
                    className="p-2 rounded-xl text-slate-text-muted hover:text-crimson hover:bg-crimson-soft/50 transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Skupiny */}
      <section className="stationery-sheet paper-grain-overlay rounded-3xl border border-[#E5DBC3] p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-fairytale font-bold text-2xl text-slate-text flex items-center gap-2">
              <Users className="w-5 h-5 text-fir shrink-0" />
              <span>Skupiny</span>
            </h2>
            <p className="text-sm text-slate-text-muted mt-0.5">
              Všichni členové jedné skupiny si automaticky vidí své dopisy navzájem.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewGroupForm}
            className="min-h-[46px] whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fir hover:bg-fir-dark text-white text-sm sm:text-base font-bold shadow-xs transition"
          >
            <FolderPlus className="w-4 h-4 shrink-0" />
            <span>Nová skupina</span>
          </button>
        </div>

        {groupFormOpen && (
          <form
            onSubmit={handleSaveGroup}
            style={{ backgroundColor: '#F6F1E7' }}
            className="rounded-2xl bg-[#F6F1E7] border border-fir/35 p-4 sm:p-5 space-y-5 animate-slide-up"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-text">
                {editingGroup ? `Upravit skupinu „${editingGroup.name}“` : 'Založit novou skupinu'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setGroupFormOpen(false);
                  setEditingGroup(null);
                }}
                className="p-1 text-slate-text-muted hover:text-slate-text"
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
                placeholder="Např. Rodina, Kamarádi, Práce..."
                style={{ backgroundColor: '#FFFDF9' }}
                className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] text-base"
                required
              />
            </div>

            <div>
              <span className="block text-sm font-bold text-slate-text mb-2">
                Motiv skupiny
              </span>
              <div className="flex flex-wrap gap-2">
                {GROUP_ICON_OPTIONS.map(({ id, label, Icon }) => {
                  const active = groupIcon === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setGroupIcon(id)}
                      className={`min-h-[42px] inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold transition ${
                        active
                          ? 'bg-fir text-white border-fir'
                          : 'bg-[#FFFDF9] text-slate-text border-[#E5DEC9] hover:bg-[#EAE1D0]/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Výběr členů ze svých propojených kontaktů (přehledné checkboxy) */}
            <div>
              <span className="block text-sm font-bold text-slate-text mb-2">
                Vyber členy ze svých propojených kontaktů
              </span>
              {selectableContacts.length === 0 ? (
                <p className="text-sm text-slate-text-muted">
                  Zatím nemáš žádné propojené kontakty — po založení skupiny ale můžeš komukoliv
                  poslat její zvací odkaz.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectableContacts.map((user) => {
                    const checked = selectedGroupMembers.includes(user.uid);
                    return (
                      <label
                        key={user.uid}
                        style={{ backgroundColor: checked ? '#E3EFEA' : '#FFFDF9' }}
                        className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'border-fir bg-[#E3EFEA]'
                            : 'border-[#E5DEC9] bg-[#FFFDF9] hover:bg-[#EAE1D0]/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMemberInSelection(user.uid)}
                          className="w-5 h-5 accent-[#234B3E] rounded cursor-pointer shrink-0"
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
            <div
              style={{ backgroundColor: '#FFFDF9' }}
              className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#E5DEC9]"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showChildLetters}
                  onChange={(e) => setShowChildLetters(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#234B3E] rounded cursor-pointer shrink-0"
                />
                <div>
                  <div className="text-sm font-bold text-slate-text">
                    Zobrazovat v této skupině i dětské dopisy
                  </div>
                  <div className="text-xs text-slate-text-muted mt-0.5">
                    U rodiny nech zapnuté. U skupiny kamarádů nebo kolegů můžeš vypnout, aby
                    viděli jen tvůj vlastní dopis.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setGroupFormOpen(false);
                  setEditingGroup(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] text-sm font-semibold"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-fir hover:bg-fir-dark text-white text-sm font-bold"
              >
                {editingGroup ? 'Uložit změny' : 'Založit skupinu'}
              </button>
            </div>
          </form>
        )}

        {groups.length === 0 ? (
          <p className="text-sm text-slate-text-muted">
            Zatím nejsi v žádné skupině. Založ skupinu tlačítkem výše nebo zadej zvací kód.
          </p>
        ) : (
          <div className="space-y-3">
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
                  style={{ backgroundColor: '#F6F1E7' }}
                  className="p-4 rounded-2xl bg-[#F6F1E7] border border-[#E5DEC9] space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-fir-soft text-fir flex items-center justify-center shrink-0 mt-0.5">
                        {renderGroupIcon(g.icon, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-text text-base flex flex-wrap items-center gap-2">
                          <span>{g.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFFDF9] border border-[#E5DEC9] text-xs font-medium text-slate-text-muted">
                            {g.showChildLetters === false
                              ? 'Jen osobní dopisy'
                              : 'Včetně dětských dopisů'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-text-muted mt-1 break-words">
                          Členové ({(g.memberUids || []).length}): {memberNames.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFounder ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditGroupForm(g)}
                            style={{ backgroundColor: '#FFFDF9' }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#E5DEC9] text-xs font-semibold text-slate-text hover:bg-[#EAE1D0]"
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0" />
                            <span>Upravit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupToDelete(g)}
                            title="Smazat skupinu"
                            aria-label={`Smazat skupinu ${g.name}`}
                            className="p-2 rounded-xl text-crimson hover:bg-crimson-soft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLeaveGroup(g)}
                          style={{ backgroundColor: '#FFFDF9' }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#E5DEC9] text-xs font-semibold text-crimson hover:bg-crimson-soft"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0" />
                          <span>Opustit skupinu</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {g.inviteCode && (
                    <div
                      style={{ backgroundColor: '#FFFDF9' }}
                      className="px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E5DEC9] flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="text-xs sm:text-sm text-slate-text">
                        <span className="text-slate-text-muted">Zvací kód skupiny: </span>
                        <strong className="font-bold text-fir">{g.inviteCode}</strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyGroupLink(g)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fir hover:bg-fir-dark text-white text-xs font-bold transition"
                        >
                          {copiedGroupLinkId === g.id ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            {copiedGroupLinkId === g.id
                              ? 'Odkaz zkopírován'
                              : 'Sdílet zvací odkaz'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyGroupCode(g)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F6F1E7] hover:bg-[#EAE1D0] border border-[#E5DEC9] text-xs font-bold text-slate-text transition"
                        >
                          {codeCopied ? (
                            <Check className="w-3.5 h-3.5 text-fir shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 shrink-0" />
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
        open={Boolean(groupToDelete)}
        danger
        title={`Smazat skupinu „${groupToDelete?.name}“?`}
        description="Skupina bude odstraněna pro všechny členy. Vaše přímá propojení zůstanou zachována."
        confirmLabel="Smazat skupinu"
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => setGroupToDelete(null)}
      />
    </div>
  );
}
