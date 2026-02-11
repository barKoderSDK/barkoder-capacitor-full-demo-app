import { Preferences } from '@capacitor/preferences';
import type { ScannerSettings } from '../types/types';

const SETTINGS_KEY = 'scanner_settings';

export interface SavedSettings {
  enabledTypes: Record<string, boolean>;
  scannerSettings: ScannerSettings;
}

export const SettingsService = {
  async getSettings(mode: string): Promise<SavedSettings | null> {
    try {
      const { value } = await Preferences.get({ key: SETTINGS_KEY });
      if (!value) {
        return null;
      }
      const allSettings = JSON.parse(value) as Record<string, SavedSettings>;
      return allSettings[mode] ?? null;
    } catch (error) {
      console.error('Error reading settings:', error);
      return null;
    }
  },

  async saveSettings(mode: string, settings: SavedSettings): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: SETTINGS_KEY });
      const allSettings = value ? (JSON.parse(value) as Record<string, SavedSettings>) : {};
      allSettings[mode] = settings;
      await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(allSettings) });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },
};