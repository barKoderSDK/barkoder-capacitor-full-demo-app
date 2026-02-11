import { useCallback } from 'react';
import { Barkoder } from 'barkoder-capacitor';
import { MODES } from '../constants/constants';
import type { ScannerSettings } from '../types/types';

export const useBarkoderSettings = (mode: string, startScanning: () => Promise<void>) => {
  const applySettings = useCallback(
    async (settings: ScannerSettings): Promise<void> => {
      await Barkoder.setImageResultEnabled({ enabled: true });
      await Barkoder.setBarcodeThumbnailOnResultEnabled({ enabled: true });

      const compositeEnabled = mode === MODES.ANYSCAN ? settings.compositeMode : false;
      await Barkoder.setEnableComposite({ value: compositeEnabled ? 1 : 0 });
      await Barkoder.setPinchToZoomEnabled({ enabled: settings.pinchToZoom });
      await Barkoder.setLocationInPreviewEnabled({ enabled: settings.locationInPreview });
      await Barkoder.setRegionOfInterestVisible({ value: settings.regionOfInterest });

      if (settings.regionOfInterest && mode !== MODES.VIN && mode !== MODES.DPM) {
        await Barkoder.setRegionOfInterest({ left: 5, top: 5, width: 90, height: 90 });
      }

      await Barkoder.setBeepOnSuccessEnabled({ enabled: settings.beepOnSuccess });
      await Barkoder.setVibrateOnSuccessEnabled({ enabled: settings.vibrateOnSuccess });
      await Barkoder.setUpcEanDeblurEnabled({ enabled: settings.scanBlurred });
      await Barkoder.setMisshaped1DEnabled({ enabled: settings.scanDeformed });
      await Barkoder.setCloseSessionOnResultEnabled({ enabled: !settings.continuousScanning });
      await Barkoder.setDecodingSpeed({ value: settings.decodingSpeed });
      await Barkoder.setBarkoderResolution({ value: settings.resolution });

      if (mode === MODES.AR_MODE && settings.arMode !== undefined) {
        await Barkoder.setARMode({ value: settings.arMode });
        if (settings.arLocationType !== undefined) {
          await Barkoder.setARLocationType({ value: settings.arLocationType });
        }
        if (settings.arHeaderShowMode !== undefined) {
          await Barkoder.setARHeaderShowMode({ value: settings.arHeaderShowMode });
        }
        if (settings.arOverlayRefresh !== undefined) {
          await Barkoder.setAROverlayRefresh({ value: settings.arOverlayRefresh });
        }
        if (settings.arDoubleTapToFreeze !== undefined) {
          await Barkoder.setARDoubleTapToFreezeEnabled({ enabled: settings.arDoubleTapToFreeze });
        }
      }

      if (settings.continuousScanning) {
        await Barkoder.setThresholdBetweenDuplicatesScans({ value: settings.continuousThreshold ?? 0 });
      }
    },
    [mode],
  );

  const updateSingleSetting = useCallback(
    async (
      key: keyof ScannerSettings,
      value: unknown,
      currentSettings: ScannerSettings,
      clearPauseState: () => void,
    ): Promise<ScannerSettings> => {
      const nextSettings = { ...currentSettings, [key]: value } as ScannerSettings;

      switch (key) {
        case 'compositeMode': {
          const compositeEnabled = mode === MODES.ANYSCAN ? (value as boolean) : false;
          await Barkoder.setEnableComposite({ value: compositeEnabled ? 1 : 0 });
          break;
        }
        case 'pinchToZoom':
          await Barkoder.setPinchToZoomEnabled({ enabled: value as boolean });
          break;
        case 'locationInPreview':
          await Barkoder.setLocationInPreviewEnabled({ enabled: value as boolean });
          break;
        case 'regionOfInterest':
          await Barkoder.setRegionOfInterestVisible({ value: value as boolean });
          if (value && mode !== MODES.VIN && mode !== MODES.DPM) {
            await Barkoder.setRegionOfInterest({ left: 5, top: 5, width: 90, height: 90 });
          }
          break;
        case 'beepOnSuccess':
          await Barkoder.setBeepOnSuccessEnabled({ enabled: value as boolean });
          break;
        case 'vibrateOnSuccess':
          await Barkoder.setVibrateOnSuccessEnabled({ enabled: value as boolean });
          break;
        case 'scanBlurred':
          await Barkoder.setUpcEanDeblurEnabled({ enabled: value as boolean });
          break;
        case 'scanDeformed':
          await Barkoder.setMisshaped1DEnabled({ enabled: value as boolean });
          break;
        case 'continuousScanning':
          await Barkoder.setCloseSessionOnResultEnabled({ enabled: !(value as boolean) });
          clearPauseState();
          await Barkoder.stopScanning();
          await startScanning();
          break;
        case 'decodingSpeed':
          await Barkoder.setDecodingSpeed({ value: value as ScannerSettings['decodingSpeed'] });
          break;
        case 'resolution':
          await Barkoder.setBarkoderResolution({ value: value as ScannerSettings['resolution'] });
          break;
        case 'arMode':
          await Barkoder.setARMode({ value: value as NonNullable<ScannerSettings['arMode']> });
          break;
        case 'arLocationType':
          await Barkoder.setARLocationType({
            value: value as NonNullable<ScannerSettings['arLocationType']>,
          });
          break;
        case 'arHeaderShowMode':
          await Barkoder.setARHeaderShowMode({
            value: value as NonNullable<ScannerSettings['arHeaderShowMode']>,
          });
          break;
        case 'arOverlayRefresh':
          await Barkoder.setAROverlayRefresh({
            value: value as NonNullable<ScannerSettings['arOverlayRefresh']>,
          });
          break;
        case 'arDoubleTapToFreeze':
          await Barkoder.setARDoubleTapToFreezeEnabled({ enabled: value as boolean });
          break;
        case 'continuousThreshold':
          await Barkoder.setThresholdBetweenDuplicatesScans({ value: value as number });
          if (nextSettings.continuousScanning) {
            await Barkoder.stopScanning();
            await startScanning();
          }
          break;
        default:
          break;
      }

      return nextSettings;
    },
    [mode, startScanning],
  );

  return {
    applySettings,
    updateSingleSetting,
  };
};