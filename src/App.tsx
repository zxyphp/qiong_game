import React, { useEffect, useState } from 'react';
import { AssetShowcaseModal } from './components/AssetShowcaseModal';
import { HomeScreen } from './components/HomeScreen';
import { PostcardGalleryModal } from './components/PostcardGalleryModal';
import { SettingsModal } from './components/SettingsModal';
import { StarfieldCanvas } from './components/StarfieldCanvas';
import { WorldMapScreen } from './components/WorldMapScreen';
import { assetManager } from './config/assetsManifest';
import { loadSaveAsync, loadSaveSync, persistSave } from './storage/persistence';
import { PlayerSaveData, UserSettings } from './types/game';

type Screen = 'home' | 'map';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [save, setSave] = useState<PlayerSaveData>(() => loadSaveSync());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void assetManager.preloadCoreAssets();
    void loadSaveAsync().then((loaded) => {
      if (active) setSave(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = (patch: Partial<UserSettings>) => {
    setSave((prev) => {
      const next: PlayerSaveData = {
        ...prev,
        settings: {
          ...prev.settings,
          ...patch,
        },
      };
      void persistSave(next);
      return next;
    });
  };

  const toggleTheme = () => {
    updateSettings({ theme: save.settings.theme === 'night' ? 'day' : 'night' });
  };

  return (
    <div className="relative h-full w-full overflow-hidden font-sans select-none">
      <StarfieldCanvas theme={save.settings.theme} variant={screen} />

      {screen === 'home' ? (
        <HomeScreen
          save={save}
          onEnterMap={() => setScreen('map')}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenShowcase={() => setShowcaseOpen(true)}
          onToggleTheme={toggleTheme}
          onDismissWelcome={() => updateSettings({ hasSeenWelcome: true })}
        />
      ) : (
        <WorldMapScreen
          save={save}
          onBackHome={() => setScreen('home')}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenGallery={() => setGalleryOpen(true)}
          onToggleTheme={toggleTheme}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        settings={save.settings}
        onUpdate={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <PostcardGalleryModal
        open={galleryOpen}
        unlockedIds={save.unlockedPostcards}
        onClose={() => setGalleryOpen(false)}
      />

      <AssetShowcaseModal open={showcaseOpen} onClose={() => setShowcaseOpen(false)} />
    </div>
  );
};

export default App;
