import React, { useEffect, useState } from 'react';
import { AssetShowcaseModal } from './components/AssetShowcaseModal';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { PostcardGalleryModal } from './components/PostcardGalleryModal';
import { SettingsModal } from './components/SettingsModal';
import { StarfieldCanvas } from './components/StarfieldCanvas';
import { WorldMapScreen } from './components/WorldMapScreen';
import { assetManager } from './config/assetsManifest';
import { getLevelConfig } from './config/levels';
import { audioEngine } from './engine/AudioEngine';
import { loadSaveAsync, loadSaveSync, persistSave } from './storage/persistence';
import { PlayerSaveData, UserSettings } from './types/game';

type Screen = 'home' | 'map' | 'game';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  const [save, setSave] = useState<PlayerSaveData>(() => loadSaveSync());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void assetManager.preloadCoreAssets();
    void loadSaveAsync().then((loaded) => {
      if (active) {
        setSave(loaded);
        audioEngine.syncSettings(loaded.settings);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    audioEngine.syncSettings(save.settings);
  }, [save.settings]);

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

  const handleSelectLevel = (levelId: number) => {
    setActiveLevelId(levelId);
    setScreen('game');
  };

  const handleLevelCleared = (levelId: number, stars: number, score: number) => {
    setSave((prev) => {
      const existing = prev.levels[levelId];
      const bestStars = Math.max(existing?.stars ?? 0, stars);
      const bestScore = Math.max(existing?.bestScore ?? 0, score);
      const nextUnlocked = Math.min(50, Math.max(prev.highestUnlockedLevel, levelId + 1));

      const unlockedPostcards = [...prev.unlockedPostcards];
      if (levelId % 10 === 0) {
        const postcardId = levelId / 10;
        if (!unlockedPostcards.includes(postcardId)) {
          unlockedPostcards.push(postcardId);
        }
      }

      const next: PlayerSaveData = {
        ...prev,
        highestUnlockedLevel: nextUnlocked,
        unlockedPostcards,
        levels: {
          ...prev.levels,
          [levelId]: {
            stars: bestStars,
            bestScore,
            cleared: true,
            consecutiveFails: 0,
          },
        },
      };
      void persistSave(next);
      return next;
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden font-sans select-none">
      <StarfieldCanvas theme={save.settings.theme} variant={screen} />

      {screen === 'home' && (
        <HomeScreen
          save={save}
          onEnterMap={() => setScreen('map')}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenShowcase={() => setShowcaseOpen(true)}
          onToggleTheme={toggleTheme}
          onDismissWelcome={() => updateSettings({ hasSeenWelcome: true })}
        />
      )}

      {screen === 'map' && (
        <WorldMapScreen
          save={save}
          onBackHome={() => setScreen('home')}
          onSelectLevel={handleSelectLevel}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenGallery={() => setGalleryOpen(true)}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          level={getLevelConfig(activeLevelId)}
          theme={save.settings.theme}
          onBackToMap={() => setScreen('map')}
          onOpenSettings={() => setSettingsOpen(true)}
          onLevelCleared={handleLevelCleared}
          onNextLevel={(nextId) => setActiveLevelId(nextId)}
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
