import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  connectedGoogleEmail?: string;
  secondaryEmails?: string[];
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Ratish Patil',
  email: 'patilratish369@gmail.com',
  avatarUrl: '/google-avatar.png', // Authentic Google Account profile photo
  connectedGoogleEmail: 'patilratish369@gmail.com',
  secondaryEmails: [],
};

interface AccountPopoverProps {
  user?: UserProfile;
  onOpenSettings: () => void;
  onSignOut?: () => void;
}

export const AccountPopover: React.FC<AccountPopoverProps> = ({
  user = DEFAULT_USER_PROFILE,
  onOpenSettings,
  onSignOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSignOutConfirm(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const avatarSrc = user.avatarUrl || '/google-avatar.png';

  return (
    <div className="relative" ref={popoverRef}>
      {/* Top-Right Navbar Avatar Trigger Button (Exact Match to Screenshot 2) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-transparent hover:ring-amber-500/40 transition-all cursor-pointer flex items-center justify-center p-0.5 overflow-hidden"
        title={`${user.name} (${user.email})`}
        aria-label="User Account Menu"
        aria-expanded={isOpen}
      >
        <img
          src={avatarSrc}
          alt={user.name}
          className="w-full h-full rounded-full object-cover border border-slate-200 dark:border-white/10"
          onError={(e) => {
            // Fallback to static cropped avatar if custom URL fails
            (e.target as HTMLImageElement).src = '/google-avatar.png';
          }}
        />
      </motion.button>

      {/* Floating Account Card Popover (Exact Match to Screenshot 2) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#12141C] border border-slate-200/90 dark:border-white/10 shadow-2xl shadow-black/20 overflow-hidden z-50 text-slate-800 dark:text-zinc-200 text-sm font-sans"
          >
            {/* User Profile Header (ss2) */}
            <div className="p-4 flex items-center gap-3.5 bg-slate-50/50 dark:bg-white/[0.02]">
              <img
                src={avatarSrc}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/google-avatar.png';
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 dark:text-white truncate text-sm">
                  {user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-white/[0.06]" />

            {/* Menu Options (ss2) */}
            <div className="p-1.5 space-y-0.5">
              {/* Manage Account -> Opens Settings View */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                <span>Manage account</span>
              </button>

              {/* Sign Out */}
              {showSignOutConfirm ? (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-300 space-y-2">
                  <div>Sign out of Nagrik AI?</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setShowSignOutConfirm(false);
                        if (onSignOut) onSignOut();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                    >
                      Confirm Sign Out
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSignOutConfirm(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 text-slate-700 dark:text-zinc-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                  <span>Sign out</span>
                </button>
              )}
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-white/[0.06]" />

            {/* Development Mode Bottom Striped Banner (Exact Match to Screenshot 2) */}
            <div className="px-4 py-2 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border-t border-orange-500/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 tracking-wide">
                Development mode
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
