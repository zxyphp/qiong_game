import React from 'react';
import { Moon, Music, Sparkles, Sun, Vibrate, Volume2, X } from 'lucide-react';
import { UserSettings } from '../types/game';

interface SettingsModalProps {
  open: boolean;
  settings: UserSettings;
  onUpdate: (patch: Partial<UserSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  settings,
  onUpdate,
  onClose,
}) => {
  if (!open) return null;

  const isNight = settings.theme === 'night';

  const toggleRow = (
    label: string,
    sub: string,
    icon: React.ReactNode,
    enabled: boolean,
    onToggle: () => void
  ) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3 text-left">
        <div className="w-9 h-9 rounded-xl bg-starlight-700/60 flex items-center justify-center text-starlight-200">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-starlight-300/75">{sub}</div>
        </div>
      </div>
      <div
        className={`w-12 h-7 rounded-full p-1 transition-colors ${
          enabled ? 'bg-gradient-to-r from-petal-pink to-petal-violet' : 'bg-white/15'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl glass-panel p-6 text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭设置"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-starlight-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-petal-gold" />
          <h2 className="text-lg font-display font-semibold tracking-wide">星海偏好设置</h2>
        </div>

        <div className="space-y-3">
          {toggleRow(
            isNight ? '星夜护眼模式' : '晨光花海模式',
            isNight ? '柔和深空配色，深夜游玩不刺眼' : '明亮梦幻霞光，清新花海氛围',
            isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-petal-gold" />,
            isNight,
            () => onUpdate({ theme: isNight ? 'day' : 'night' })
          )}

          {toggleRow(
            '背景音乐 (BGM)',
            '可独立关闭，安静享受深夜时光',
            <Music className="w-4 h-4" />,
            settings.bgmEnabled,
            () => onUpdate({ bgmEnabled: !settings.bgmEnabled })
          )}

          {toggleRow(
            '连击音效 (SFX)',
            'Web Audio 五声音阶清脆叮咚声',
            <Volume2 className="w-4 h-4" />,
            settings.sfxEnabled,
            () => onUpdate({ sfxEnabled: !settings.sfxEnabled })
          )}

          {toggleRow(
            '触感震动反馈',
            '特效引爆与消除时的轻柔震动',
            <Vibrate className="w-4 h-4" />,
            settings.vibrateEnabled,
            () => onUpdate({ vibrateEnabled: !settings.vibrateEnabled })
          )}
        </div>

        <p className="mt-5 text-center text-xs text-starlight-300/70">
          设置会自动保存在本地，随时随地零压力畅玩
        </p>
      </div>
    </div>
  );
};
