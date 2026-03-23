import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Icons } from '../constants';
import { useAppLanguage } from '../contexts/AppLanguageContext';
import { AppLock, AppLockMode, AppLockState, LauncherAppRow } from '../src/plugins/app-lock';

interface Props {
  onChange?: () => void;
}

const isAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const AppLockSettings: React.FC<Props> = ({ onChange }) => {
  const { t } = useAppLanguage();
  const [state, setState] = useState<AppLockState | null>(null);
  const [packageLabels, setPackageLabels] = useState<Record<string, string>>({});
  const [apps, setApps] = useState<LauncherAppRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isAndroid()) return;
    try {
      const s = await AppLock.getState();
      const pkgs = Array.isArray(s.packages) ? s.packages : [];
      setState({
        ...s,
        packages: pkgs,
        displayOverOtherAppsGranted: s.displayOverOtherAppsGranted ?? true
      });

      if (pkgs.length > 0) {
        const { labels } = await AppLock.getLabelsForPackages({ packages: pkgs });
        const map: Record<string, string> = {};
        for (const row of labels) {
          map[row.packageName] = row.label;
        }
        setPackageLabels(map);
      } else {
        setPackageLabels({});
      }
    } catch {
      setState(null);
      setPackageLabels({});
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openPicker = async () => {
    if (!isAndroid()) return;
    setPickerOpen(true);
    setQuery('');
    try {
      const { apps: list } = await AppLock.getLauncherApps();
      setApps(Array.isArray(list) ? list : []);
    } catch {
      setApps([]);
    }
  };

  const persistPackages = async (packages: string[]) => {
    if (!isAndroid()) return;
    setBusy(true);
    try {
      await AppLock.setLockedPackages({ packages });
      await load();
      onChange?.();
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    if (!isAndroid()) return;
    setBusy(true);
    try {
      await AppLock.setEnabled({ enabled });
      await load();
      onChange?.();
    } finally {
      setBusy(false);
    }
  };

  const setMode = async (mode: AppLockMode) => {
    if (!isAndroid()) return;
    setBusy(true);
    try {
      await AppLock.setMode({ mode });
      await load();
      onChange?.();
    } finally {
      setBusy(false);
    }
  };

  const removePackage = (pkg: string) => {
    if (!state) return;
    void persistPackages(state.packages.filter((p) => p !== pkg));
  };

  const addPackage = (pkg: string) => {
    if (!state) return;
    if (state.packages.includes(pkg)) {
      setPickerOpen(false);
      return;
    }
    void persistPackages([...state.packages, pkg]);
    setPickerOpen(false);
  };

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        a.packageName.toLowerCase().includes(q) ||
        (a.label && a.label.toLowerCase().includes(q))
    );
  }, [apps, query]);

  const modeHint = useMemo(
    () => (state?.mode === 'chapter' ? t('appLock.modeChapterDesc') : t('appLock.modeParagraphDesc')),
    [state?.mode, t]
  );

  if (!isAndroid()) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-[var(--gold)]">
        <Icons.Feather className="w-5 h-5 shrink-0" />
        <div className="min-w-0">
          <h3 className="uppercase text-xs font-black tracking-[0.2em]">{t('appLock.title')}</h3>
          <p className="text-[10px] text-[var(--text-secondary)] leading-snug mt-1">{t('appLock.intro')}</p>
        </div>
      </div>

      {state === null && <p className="text-xs text-[var(--text-muted)]">{t('appLock.loading')}</p>}

      {state && (
        <div className="space-y-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleEnabled(!state.enabled)}
            className={`w-full p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all text-left text-[var(--text-primary)] ${
              state.enabled
                ? 'bg-[var(--gold-muted)]/80 border-[var(--gold)]'
                : 'bg-[var(--card-bg)] border-theme'
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-bold">{t('appLock.enable')}</div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{t('appLock.enableDesc')}</div>
            </div>
            <div
              className={`w-11 h-6 rounded-full shrink-0 relative transition-colors ${
                state.enabled ? 'bg-[var(--gold)]' : 'bg-[var(--card-bg)] border border-theme'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  state.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-2">
              {t('appLock.gateStep')}
            </p>
            <div className="flex rounded-xl border border-theme p-1 gap-1 bg-[var(--card-bg)]">
              {(['paragraph', 'chapter'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={busy}
                  onClick={() => void setMode(m)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    state.mode === m
                      ? 'bg-[var(--gold-muted)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {m === 'paragraph' ? t('appLock.modeParagraph') : t('appLock.modeChapter')}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-2 leading-relaxed">{modeHint}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-2">
              {t('appLock.setupTitle')}
            </p>
            <div className="rounded-xl border border-theme overflow-hidden divide-y divide-theme">
              <button
                type="button"
                disabled={busy}
                onClick={() => void AppLock.openAccessibilitySettings()}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--card-bg)] transition-colors active:bg-[var(--gold-muted)]/30"
              >
                <span className="flex-1 min-w-0 text-sm font-semibold text-[var(--text-primary)]">
                  {t('appLock.rowAccessibility')}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase shrink-0 ${
                    state.accessibilityServiceEnabled ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                >
                  {state.accessibilityServiceEnabled ? t('appLock.badgeOn') : t('appLock.badgeOff')}
                </span>
                <Icons.ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </button>
              {!state.displayOverOtherAppsGranted && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void AppLock.openDisplayOverOtherAppsSettings().then(() => load())}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                >
                  <span className="flex-1 min-w-0 text-sm font-semibold text-[var(--text-primary)]">
                    {t('appLock.displayOverApps')}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-500 shrink-0">
                    {t('appLock.badgeOff')}
                  </span>
                  <Icons.ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                {t('appLock.lockedApps')}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void openPicker()}
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]"
              >
                {t('appLock.addApp')}
              </button>
            </div>
            {state.packages.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-2">{t('appLock.noApps')}</p>
            ) : (
              <ul className="rounded-xl border border-theme divide-y divide-theme overflow-hidden">
                {state.packages.map((pkg) => (
                  <li key={pkg} className="flex items-center gap-3 px-4 py-3 bg-[var(--card-bg)]/50">
                    <div className="min-w-0 flex-1 text-sm font-medium text-[var(--text-primary)] truncate">
                      {packageLabels[pkg] ?? pkg}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removePackage(pkg)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-400 shrink-0 rounded-lg"
                      aria-label={`Remove ${packageLabels[pkg] ?? pkg}`}
                    >
                      <Icons.Close className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPickerOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[80vh] bg-[var(--bg-primary)] border border-theme rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-theme flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[var(--gold)]">{t('appLock.chooseApp')}</h4>
              <button type="button" onClick={() => setPickerOpen(false)} className="p-2 text-[var(--text-muted)]">
                <Icons.Close className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 border-b border-theme">
              <div className="flex items-center gap-2 bg-[var(--card-bg)] rounded-lg px-3 py-2 border border-theme">
                <Icons.Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder={t('appLock.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
              {filteredApps.slice(0, 400).map((a) => (
                <button
                  key={a.packageName}
                  type="button"
                  onClick={() => addPackage(a.packageName)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--card-bg)] text-[var(--text-primary)]"
                >
                  <div className="text-sm font-semibold truncate">{a.label}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">{a.packageName}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
