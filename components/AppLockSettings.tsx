import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Icons } from '../constants';
import { AppLock, AppLockMode, AppLockState, LauncherAppRow } from '../src/plugins/app-lock';

interface Props {
  onChange?: () => void;
}

const isAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const AppLockSettings: React.FC<Props> = ({ onChange }) => {
  const [state, setState] = useState<AppLockState | null>(null);
  /** Display name per package id (from Android PackageManager). */
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
      setState({ ...s, packages: pkgs });

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

  if (!isAndroid()) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center space-x-3 text-[var(--gold)]">
        <Icons.Feather className="w-5 h-5" />
        <h3 className="uppercase text-xs font-black tracking-[0.2em]">Focus lock (Android)</h3>
      </div>

      <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
        Locked apps show a Bible gate from <span className="font-mono">bible-content.json</span> (bundled with Senay).
        Your place advances each time you finish the gate. When you open Senay again, that reading is added to your{' '}
        <strong className="text-[var(--text-primary)]">streak and heatmap</strong>
        {` `}(chapter mode also marks the chapter in your library progress). Choose <strong>five verses</strong> per lock or a{' '}
        <strong>full chapter</strong> below.
      </p>

      {state === null && (
        <p className="text-xs text-[var(--text-muted)]">Loading focus lock…</p>
      )}

      {state && (
        <div className="space-y-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleEnabled(!state.enabled)}
            className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all text-left text-[var(--text-primary)] ${
              state.enabled
                ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-md'
                : 'bg-[var(--card-bg)] border-theme opacity-80'
            }`}
          >
            <div className="text-left min-w-0 pr-2">
              <div className="text-sm font-bold text-[var(--text-primary)]">Enable focus lock</div>
              <div className="text-[9px] text-[var(--text-secondary)] uppercase tracking-tighter mt-0.5">
                Block selected apps until you read
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full relative transition-colors ${
                state.enabled ? 'bg-[var(--gold)]' : 'bg-[var(--card-bg)] border border-theme'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  state.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </button>

          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
              Gate step size
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void setMode('paragraph')}
                className={`p-4 rounded-2xl border-2 text-left transition-all text-[var(--text-primary)] ${
                  state.mode === 'paragraph'
                    ? 'border-[var(--gold)] bg-[var(--gold-muted)]'
                    : 'border-theme bg-[var(--card-bg)]'
                }`}
              >
                <div className="text-xs font-bold text-[var(--text-primary)]">5 paragraphs</div>
                <div className="text-[8px] text-[var(--text-secondary)] mt-1 leading-snug">
                  Five verses in order from the Bible file (one gate)
                </div>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void setMode('chapter')}
                className={`p-4 rounded-2xl border-2 text-left transition-all text-[var(--text-primary)] ${
                  state.mode === 'chapter'
                    ? 'border-[var(--gold)] bg-[var(--gold-muted)]'
                    : 'border-theme bg-[var(--card-bg)]'
                }`}
              >
                <div className="text-xs font-bold text-[var(--text-primary)]">1 chapter</div>
                <div className="text-[8px] text-[var(--text-secondary)] mt-1 leading-snug">
                  Whole chapter each time; next lock starts the next chapter
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              disabled={busy}
              onClick={() => void AppLock.openAccessibilitySettings()}
              className="px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-theme text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] ring-1 ring-[var(--gold)]/35"
            >
              Accessibility settings
            </button>
            <span
              className={`text-[9px] font-bold uppercase ${
                state.accessibilityServiceEnabled ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {state.accessibilityServiceEnabled ? 'Service on' : 'Service off — enable Senay'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
                Locked apps
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void openPicker()}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--gold)]"
              >
                + Add app
              </button>
            </div>
            {state.packages.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No apps selected.</p>
            ) : (
              <ul className="space-y-2">
                {state.packages.map((pkg) => (
                  <li
                    key={pkg}
                    className="flex items-center justify-between p-4 rounded-2xl bg-[var(--card-bg)] border border-theme gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {packageLabels[pkg] ?? pkg}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removePackage(pkg)}
                      className="p-2 text-red-400 hover:text-red-300 shrink-0"
                      aria-label={`Remove ${packageLabels[pkg] ?? pkg}`}
                    >
                      <Icons.Close className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!state.hasGateReadingContent && (
            <p className="text-[10px] text-[var(--text-primary)] leading-relaxed rounded-xl p-3 border border-amber-600/45 bg-amber-500/[0.12]">
              Bible file missing from the app bundle. Run <span className="font-mono font-semibold">npm run build</span> then{' '}
              <span className="font-mono font-semibold">npx cap sync android</span> so{' '}
              <span className="font-mono font-semibold">public/data/bible-content.json</span> is copied into the APK.
            </p>
          )}
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPickerOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[80vh] bg-[var(--bg-primary)] border border-theme rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-theme flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[var(--gold)]">Choose an app</h4>
              <button type="button" onClick={() => setPickerOpen(false)} className="p-2 text-[var(--text-muted)]">
                <Icons.Close className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 border-b border-theme">
              <div className="flex items-center gap-2 bg-[var(--card-bg)] rounded-xl px-3 py-2 border border-theme">
                <Icons.Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Search by name or package"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
              {filteredApps.slice(0, 400).map((a) => (
                <button
                  key={a.packageName}
                  type="button"
                  onClick={() => addPackage(a.packageName)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-[var(--card-bg)] border border-transparent hover:border-theme transition-all text-[var(--text-primary)]"
                >
                  <div className="text-sm font-bold truncate text-[var(--text-primary)]">{a.label}</div>
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
