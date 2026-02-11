import { Preferences } from '@capacitor/preferences';
import type { HistoryItem, ScannedItem } from '../types/types';

const HISTORY_KEY = 'scan_history';

export const HistoryService = {
  async getHistory(): Promise<HistoryItem[]> {
    try {
      const { value } = await Preferences.get({ key: HISTORY_KEY });
      if (!value) {
        return [];
      }
      const parsed = JSON.parse(value) as HistoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  },

  async addScan(item: ScannedItem): Promise<void> {
    try {
      const history = await this.getHistory();
      const existingIndex = history.findIndex((entry) => entry.text === item.text && entry.type === item.type);

      if (existingIndex >= 0) {
        const updated = { ...history[existingIndex] };
        updated.count += 1;
        updated.timestamp = Date.now();
        if (item.image) {
          updated.image = item.image;
        }
        history.splice(existingIndex, 1);
        history.unshift(updated);
      } else {
        history.unshift({
          ...item,
          timestamp: Date.now(),
          count: 1,
        });
      }

      await Preferences.set({ key: HISTORY_KEY, value: JSON.stringify(history) });
    } catch (error) {
      console.error('Error saving history:', error);
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await Preferences.remove({ key: HISTORY_KEY });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },
};