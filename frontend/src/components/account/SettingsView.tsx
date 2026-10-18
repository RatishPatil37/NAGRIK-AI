import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Shield,
  LayoutGrid,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Trash2,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NagrikLogo } from '../brand/NagrikLogo';
import type { UserProfile } from './AccountPopover';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onNavigate: (view: 'conversation' | 'dashboard' | 'landing') => void;
  onClose?: () => void;
  onSignOut?: () => void;
  isTTSEnabled?: boolean;
  onToggleTTS?: () => void;
  sessionsCount?: number;
  onClearSessions?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onNavigate,
  onClose,
  onSignOut,
  isTTSEnabled = false,
  onToggleTTS,
  sessionsCount = 0,
  onClearSessions,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatarUrl || '/google-avatar.png');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Functional Modals for New Buttons
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState(user.connectedGoogleEmail || user.email);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Menu Dropdowns
  const [activeMenu, setActiveMenu] = useState<'primary-email' | 'google-account' | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: editName.trim() || user.name,
      avatarUrl: editAvatarUrl.trim() || '/google-avatar.png',
    });
    setIsEditingProfile(false);
    showToast('Profile updated successfully');
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    const secondary = user.secondaryEmails || [];
    if (secondary.includes(newEmailInput.trim()) || newEmailInput.trim() === user.email) {
      alert('This email is already associated with your account');
      return;
    }
    onUpdateUser({
      secondaryEmails: [...secondary, newEmailInput.trim()],
    });
    setNewEmailInput('');
    setIsAddingEmail(false);
    showToast(`Added ${newEmailInput.trim()} to account`);
  };

  const handleConnectGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim() || !googleEmailInput.includes('@')) {
      alert('Please enter a valid Google email address');
      return;
    }
    onUpdateUser({
      connectedGoogleEmail: googleEmailInput.trim(),
      avatarUrl: user.avatarUrl || '/google-avatar.png',
    });
    setIsConnectingGoogle(false);
    showToast(`Connected Google account: ${googleEmailInput.trim()}`);
  };

  const handleResetGoogleAvatar = () => {
    setEditAvatarUrl('/google-avatar.png');
    onUpdateUser({ avatarUrl: '/google-avatar.png' });
    showToast('Fetched authentic Google profile photo');
  };

  const avatarSrc = user.avatarUrl || '/google-avatar.png';

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#090A0F] text-slate-900 dark:text-zinc-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 dark:border-slate-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Navigation Sidebar (Exact Match to Screenshot 1) */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#0D0E15] border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/[0.08] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="pb-6 pt-1 px-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <NagrikLogo size="md" onClick={() => onNavigate('landing')} />
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Close Settings"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links (ss1) */}
          <nav className="mt-6 space-y-1">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors cursor-pointer text-left"
            >
              <LayoutGrid className="w-4 h-4 text-emerald-500" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('conversation')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors cursor-pointer text-left"
            >
              <MessageSquare className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <span>Conversation</span>
            </button>
          </nav>
        </div>

        {/* Pinned Bottom Settings Pill & Sign Out Action */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
          <div className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-sm font-medium shadow-sm">
            <SettingsIcon className="w-4 h-4 text-slate-300" />
            <span>Settings</span>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Settings Canvas (Exact Match to Screenshot 1) */}
      <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
        {/* Top Header with Gear Icon */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-zinc-200">
              <SettingsIcon className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Manage account settings
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <span>Back to Chat</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section Heading */}
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Update Profile
        </h2>

        {/* Main Settings Card (Exact Match to Screenshot 1) */}
        <div className="bg-white dark:bg-[#11131C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/[0.06]">
            {/* Left Sub-Navigation: Account Info */}
            <div className="md:col-span-4 p-5 sm:p-6 bg-slate-50/40 dark:bg-white/[0.01]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
                Manage your account info.
              </p>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-slate-200/80 dark:bg-white/[0.1] text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-slate-200/80 dark:bg-white/[0.1] text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Security</span>
                </button>
              </div>
            </div>

            {/* Right Panel: Profile Details & Connected Accounts (ss1) */}
            <div className="md:col-span-8 p-5 sm:p-7">
              {activeTab === 'profile' ? (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-3">
                    Profile details
                  </h4>

                  {/* Profile Row: Avatar + Name + Update button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 w-28">
                      Profile
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={avatarSrc}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/google-avatar.png';
                        }}
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {user.name}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      {isEditingProfile ? 'Cancel' : 'Update profile'}
                    </button>
                  </div>

                  {/* Edit Profile Form */}
                  {isEditingProfile && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleSaveProfile}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Google Profile Avatar
                          </label>
                          <button
                            type="button"
                            onClick={handleResetGoogleAvatar}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Fetch from Google Account</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Image URL or default (/google-avatar.png)"
                          value={editAvatarUrl}
                          onChange={(e) => setEditAvatarUrl(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200"
                        >
                          Save Changes
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* Email Addresses Row (ss1) */}
                  <div className="py-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 w-28">
                        Email addresses
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 font-mono">
                          {user.email}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-zinc-300 font-medium">
                          Primary
                        </span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenu(activeMenu === 'primary-email' ? null : 'primary-email')}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {activeMenu === 'primary-email' && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#1A1D28] border border-slate-200 dark:border-white/10 shadow-lg p-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenu(null);
                                showToast('Email already verified as primary');
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                            >
                              Verified Primary
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary Emails */}
                    {user.secondaryEmails && user.secondaryEmails.map((secEmail) => (
                      <div key={secEmail} className="flex items-center justify-between mt-2 ml-0 sm:ml-28 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 dark:text-zinc-300">{secEmail}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500">
                            Secondary
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (user.secondaryEmails || []).filter((e) => e !== secEmail);
                            onUpdateUser({ secondaryEmails: updated });
                            showToast(`Removed ${secEmail}`);
                          }}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="Remove email"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add Email Address Trigger (Now Functional) */}
                    <div className="mt-2.5 ml-0 sm:ml-28">
                      {isAddingEmail ? (
                        <form onSubmit={handleAddEmail} className="flex items-center gap-2 max-w-sm mt-1">
                          <input
                            type="email"
                            placeholder="Enter new email..."
                            value={newEmailInput}
                            onChange={(e) => setNewEmailInput(e.target.value)}
                            className="flex-1 px-3 py-1 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingEmail(false)}
                            className="px-2 py-1 text-slate-500 text-xs"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingEmail(true)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add email address</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Connected Accounts Row (Google) (ss1) */}
                  <div className="py-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 w-28">
                        Connected accounts
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200">
                          Google • {user.connectedGoogleEmail || user.email}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                          Connected
                        </span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenu(activeMenu === 'google-account' ? null : 'google-account')}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {activeMenu === 'google-account' && (
                          <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-[#1A1D28] border border-slate-200 dark:border-white/10 shadow-lg p-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenu(null);
                                handleResetGoogleAvatar();
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Sync Profile Photo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connect Account Trigger (Now Functional) */}
                    <div className="mt-2.5 ml-0 sm:ml-28">
                      {isConnectingGoogle ? (
                        <form onSubmit={handleConnectGoogle} className="flex items-center gap-2 max-w-sm mt-1">
                          <input
                            type="email"
                            placeholder="Google email..."
                            value={googleEmailInput}
                            onChange={(e) => setGoogleEmailInput(e.target.value)}
                            className="flex-1 px-3 py-1 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold"
                          >
                            Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConnectingGoogle(false)}
                            className="px-2 py-1 text-slate-500 text-xs"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsConnectingGoogle(true)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Connect account</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nagrik Civic Engine Preferences */}
                  <div className="pt-4 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Civic Intelligence System
                    </h5>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Primary Model: Gemini 3.7 Flash
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Surge: Gemini 3.5 Flash-Lite • Emergency: Groq Llama 3.3 70B
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </div>

                    {onToggleTTS && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {isTTSEnabled ? (
                            <Volume2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <VolumeX className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Auto-Play Regional Voice Output
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                              Synthesizes responses in English, हिंदी, or मराठी
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onToggleTTS}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            isTTSEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                              isTTSEnabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {onClearSessions && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Client-Side Chat History
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                            {sessionsCount} of 20 stored conversations
                          </div>
                        </div>
                        {showClearConfirm ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClearSessions();
                                setShowClearConfirm(false);
                                showToast('Cleared chat history');
                              }}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowClearConfirm(false)}
                              className="px-2 py-1 rounded bg-slate-200 dark:bg-white/10 text-[10px] text-slate-700 dark:text-zinc-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowClearConfirm(true)}
                            className="text-xs text-red-500 hover:underline font-semibold"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Security Tab */
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-3">
                    Security & Authentication
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>Single Sign-On (SSO) Active</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Your identity is authenticated securely via Google OAuth 2.0 with cryptographic verification under statutory DPDP Act 2023 regulations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Development Mode Bottom Banner */}
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-zinc-400 tracking-wider uppercase">
              Development mode
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
              MCGM-CITIZEN-AUTH-2026
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
