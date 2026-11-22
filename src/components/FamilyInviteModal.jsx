import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  joinGroupByInviteCode,
  leaveGroup,
  removeConnection,
  sendConnectionRequest,
  updateGroup,
} from '../lib/db';

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

export function FamilyInviteModal({
  open,
  connections = [],
  groups = [],
  usersMap = {},
  onUpdated,
  onClose,
}) {
  const { authUser, profile, notify } = useAuth();

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

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !profile) return null;

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
    if (!raw || !authUser) return;

    setSearching(true);
    setSearchError('');
    setFoundUser(null);

    try {
      const extracted = searchInput.includes('?invite=')
        ? new URL(searchInput, 'https://dopis-jeziskovi.local').searchParams.get('invite') || raw
        : raw;

      // Pokud jde o zvací kód skupiny (např. SKUPINA-8412)
      if (/^SKUPINA-\d{3,6}$/i.test(extracted.trim())) {
        const joined = await joinGroupByInviteCode(authUser.uid, extracted.trim());
        notify(`Připojil/a ses do skupiny „${joined.name}“.`);
        setSearchInput('');
        if (onUpdated) await onUpdated();
        return;
      }

      // Jinak hledáme člověka podle osobního kódu (Dana#7392 nebo 7392)
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
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify(err.message || 'Pozvánku se nepodařilo odeslat.', 'error');
    }
  };

  const handleAccept = async (connId) => {
    try {
      await acceptConnectionRequest(connId);
      notify('Propojení bylo potvrzeno.');
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify(err.message || 'Nepodařilo se přijmout pozvánku.', 'error');
    }
  };

  const handleDeclineOrRemove = async (connId, msg = 'Propojení bylo zrušeno.') => {
    try {
      await removeConnection(connId);
      notify(msg);
      if (onUpdated) await onUpdated();
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
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');

  // Všechny známé kontakty (z přímých propojení i ze skupin) pro výběr členů skupiny
  const selectableContactsMap = {};
  acceptedConnections.forEach((c) => {
    const otherUid = (c.users || []).find((u) => u !== authUser?.uid);
    if (otherUid) {
      selectableContactsMap[otherUid] = usersMap[otherUid] || {
        uid: otherUid,
        displayName: 'Propojený kontakt',
        tag: '0000',
        avatarId: 'star',
        avatarBg: '#F5E6D3',
      };
    }
  });
  if (editingGroup) {
    (editingGroup.memberUids || []).forEach((uid) => {
      if (uid !== authUser?.uid) {
        selectableContactsMap[uid] = usersMap[uid] || {
          uid,
          displayName: 'Člen skupiny',
          tag: '0000',
          avatarId: 'star',
          avatarBg: '#F5E6D3',
        };
      }
    });
  }
  const selectableContacts = Object.values(selectableContactsMap);

  const toggleMemberInSelection = (uid) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const openNewGroupForm = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupIcon('home');
    setShowChildLetters(true);
    setSelectedGroupMembers([]);
    setGroupFormOpen(true);
  };

  const openEditGroupForm = (group) => {
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
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify(err.message || 'Uložení skupiny se nezdařilo.', 'error');
    }
  };

  const handleDeleteGroup = async (group) => {
    try {
      await deleteGroup(group.id);
      notify(`Skupina „${group.name}“ byla smazána.`);
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify(err.message || 'Smazání skupiny se nezdařilo.', 'error');
    }
  };

  const handleLeaveGroup = async (group) => {
    if (!authUser) return;
    try {
      await leaveGroup(group.id, authUser.uid);
      notify(`Opustil/a jsi skupinu „${group.name}“.`);
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify(err.message || 'Opuštění skupiny se nezdařilo.', 'error');
    }
  };

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: '#FFFDF9' }}
        className="w-full max-w-2xl bg-[#FFFDF9] rounded-2xl border border-[#E5DEC9] shadow-2xl flex flex-col max-h-[90vh] animate-slide-up overflow-hidden"
      >
        <div
          style={{ backgroundColor: '#FFFDF9' }}
          className="shrink-0 px-6 py-4 bg-[#FFFDF9] border-b border-[#E5DEC9] flex items-center justify-between gap-4"
        >
          <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
            Pozvat blízké a spravovat skupiny
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-[#F6F1E7] transition"
            aria-label="Zavřít okno"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. Osobní kód */}
          <section
            style={{ backgroundColor: '#F6F1E7' }}
            className="rounded-2xl bg-[#F6F1E7] border border-[#E5DEC9] p-5 space-y-3"
          >
            <div>
              <h3 className="text-base font-bold text-slate-text">
                Tvůj osobní kód
              </h3>
              <p className="text-sm text-slate-text-muted mt-0.5">
                Pošli ho blízkým nebo kamarádům, se kterými chceš sdílet dopisy.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div
                style={{ backgroundColor: '#FFFDF9' }}
                className="px-4 py-3 rounded-xl bg-[#FFFDF9] border border-[#E5DEC9] font-bold text-xl text-fir text-center sm:text-left"
              >
                {fullCode}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPersonalLink}
                  className="min-h-[48px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold shadow-sm transition"
                >
                  {copiedPersonalLink ? (
                    <Check className="w-5 h-5 shrink-0" />
                  ) : (
                    <LinkIcon className="w-5 h-5 shrink-0" />
                  )}
                  <span>{copiedPersonalLink ? 'Odkaz zkopírován' : 'Zkopírovat zvací odkaz'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPersonalCode}
                  style={{ backgroundColor: '#FFFDF9' }}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E5DEC9] hover:bg-[#EAE1D0] text-sm font-bold text-slate-text transition"
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

          {/* 2. Zadání osobního kódu nebo kódu skupiny */}
          <section className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-text">
                Přidat člověka nebo se připojit ke skupině
              </h3>
              <p className="text-sm text-slate-text-muted mt-0.5">
                Zadej osobní kód člověka (např. <strong>Dana#7392</strong>) nebo zvací kód skupiny
                (např. <strong>SKUPINA-8412</strong>).
              </p>
            </div>

            <form onSubmit={handleSearchOrJoin} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
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
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold transition disabled:opacity-50 shrink-0"
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
                <div className="flex items-center gap-3">
                  <Avatar avatarId={foundUser.avatarId} avatarBg={foundUser.avatarBg} size="md" />
                  <div>
                    <div className="font-bold text-lg text-slate-text">{foundUser.displayName}</div>
                    <div className="text-sm text-slate-text-muted">
                      {foundUser.displayName}#{foundUser.tag}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendInvite(foundUser)}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold transition"
                >
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <span>Odeslat pozvánku</span>
                </button>
              </div>
            )}
          </section>

          {/* 3. Čekající pozvánky */}
          {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
            <section className="space-y-3 pt-2 border-t border-[#E5DEC9]">
              <h3 className="text-lg font-bold text-slate-text">Čekající pozvánky</h3>

              {incomingRequests.map((req) => {
                const requester = usersMap[req.requestedBy];
                if (!requester) return null;
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-gold-soft/70 border border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        avatarId={requester.avatarId}
                        avatarBg={requester.avatarBg}
                        size="md"
                      />
                      <div className="font-bold text-slate-text text-lg">
                        {requester.displayName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAccept(req.id)}
                        className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold transition"
                      >
                        <UserCheck className="w-5 h-5 shrink-0" />
                        <span>Přijmout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineOrRemove(req.id, 'Pozvánka byla odmítnuta.')}
                        className="min-h-[48px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] text-base font-semibold text-crimson hover:bg-crimson-soft transition"
                      >
                        <X className="w-5 h-5 shrink-0" />
                        <span>Odmítnout</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {outgoingRequests.map((req) => {
                const targetUid = req.users.find((u) => u !== authUser?.uid);
                const target = usersMap[targetUid];
                if (!target) return null;
                return (
                  <div
                    key={req.id}
                    style={{ backgroundColor: '#F6F1E7' }}
                    className="p-3.5 rounded-xl bg-[#F6F1E7] border border-[#E5DEC9] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar avatarId={target.avatarId} avatarBg={target.avatarBg} size="sm" />
                      <span className="text-base text-slate-text">
                        Pozvánka pro <strong>{target.displayName}</strong> čeká na schválení
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeclineOrRemove(req.id, 'Pozvánka byla zrušena.')}
                      className="text-sm font-semibold text-crimson hover:underline"
                    >
                      Zrušit
                    </button>
                  </div>
                );
              })}
            </section>
          )}

          {/* 4. Skupiny (Rodina, Kamarádi, Práce...) */}
          <section className="space-y-4 pt-2 border-t border-[#E5DEC9]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-text flex items-center gap-2">
                  <Users className="w-5 h-5 text-fir shrink-0" />
                  <span>Skupiny</span>
                </h3>
                <p className="text-sm text-slate-text-muted">
                  Vytvoř si okruh pro rodinu, kamarády nebo kolegy a pozvi je jedním kódem.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewGroupForm}
                style={{ backgroundColor: '#F6F1E7' }}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F6F1E7] border border-[#E5DEC9] hover:bg-[#EAE1D0] text-sm font-bold text-slate-text transition"
              >
                <FolderPlus className="w-4 h-4 text-fir shrink-0" />
                <span>Nová skupina</span>
              </button>
            </div>

            {groupFormOpen && (
              <form
                onSubmit={handleSaveGroup}
                style={{ backgroundColor: '#F6F1E7' }}
                className="rounded-2xl bg-[#F6F1E7] border border-fir/35 p-5 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-text">
                    {editingGroup ? `Upravit skupinu „${editingGroup.name}“` : 'Založit novou skupinu'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setGroupFormOpen(false);
                      setEditingGroup(null);
                    }}
                    className="p-1 text-slate-text-muted hover:text-slate-text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Název skupiny */}
                <div>
                  <label
                    htmlFor="modal-group-name"
                    className="block text-sm font-bold text-slate-text mb-1.5"
                  >
                    Název skupiny
                  </label>
                  <input
                    id="modal-group-name"
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

                {/* Ikonka skupiny */}
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

                {/* Výběr členů z propojených kontaktů */}
                <div>
                  <span className="block text-sm font-bold text-slate-text mb-2">
                    Přidat do skupiny své propojené kontakty
                  </span>
                  {selectableContacts.length === 0 ? (
                    <p className="text-sm text-slate-text-muted">
                      Zatím žádné propojené kontakty.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectableContacts.map((user) => {
                        const checked = selectedGroupMembers.includes(user.uid);
                        return (
                          <button
                            key={user.uid}
                            type="button"
                            onClick={() => toggleMemberInSelection(user.uid)}
                            className={`min-h-[44px] inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold transition ${
                              checked
                                ? 'bg-fir text-white border-fir'
                                : 'bg-[#FFFDF9] text-slate-text border-[#E5DEC9]'
                            }`}
                          >
                            <Avatar avatarId={user.avatarId} avatarBg={user.avatarBg} size="xs" />
                            <span>{user.displayName}</span>
                            {checked && <Check className="w-4 h-4 shrink-0" />}
                          </button>
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

                <div className="flex justify-end gap-2">
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

            {groups.length > 0 && (
              <div className="space-y-3">
                {groups.map((g) => {
                  const isFounder = g.createdBy === authUser?.uid;
                  const codeCopied = copiedGroupId === g.id;
                  const memberNames = (g.memberUids || [])
                    .map((uid) =>
                      uid === authUser?.uid ? `${profile.displayName} (ty)` : usersMap[uid]?.displayName
                    )
                    .filter(Boolean);

                  return (
                    <div
                      key={g.id}
                      style={{ backgroundColor: '#F6F1E7' }}
                      className="p-4 rounded-2xl bg-[#F6F1E7] border border-[#E5DEC9] space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-fir-soft text-fir flex items-center justify-center shrink-0">
                            {renderGroupIcon(g.icon, 'w-5 h-5')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-text text-base flex flex-wrap items-center gap-2">
                              <span>{g.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#FFFDF9] border border-[#E5DEC9] text-xs font-medium text-slate-text-muted">
                                {g.showChildLetters === false
                                  ? 'Jen osobní dopisy'
                                  : 'Včetně dětských dopisů'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-text-muted mt-0.5">
                              Členové ({g.memberUids.length}): {memberNames.join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
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
                                onClick={() => handleDeleteGroup(g)}
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

                      {/* Zvací kód a 1-click odkaz skupiny */}
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
        </div>

        <div
          style={{ backgroundColor: '#FFFDF9' }}
          className="shrink-0 border-t border-[#E5DEC9] bg-[#FFFDF9] p-4 flex justify-end"
        >
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 rounded-xl border border-[#E5DEC9] bg-[#F6F1E7] hover:bg-[#EAE1D0] text-base font-bold text-slate-text transition"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
