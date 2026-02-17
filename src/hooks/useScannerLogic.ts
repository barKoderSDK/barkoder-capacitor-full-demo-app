import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Barkoder,
  BarkoderARHeaderShowMode,
  BarkoderARMode,
  BarkoderConfig,
  BarcodeType,
  DekoderConfig,
  type BarkoderResult,
} from 'barkoder-capacitor';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { HistoryService } from '../services/HistoryService';
import { SettingsService } from '../services/SettingsService';
import { barkoderService } from '../services/barkoderService';
import { BARCODE_TYPES_1D, BARCODE_TYPES_2D, MODES } from '../constants/constants';
import {
  getInitialEnabledTypes,
  getInitialSettings,
  createBarcodeConfig,
  normalizeEnabledTypesForMode,
  VIN_ALLOWED_TYPE_IDS,
} from '../utils/scannerConfig';
import { useBarcodeConfig } from './useBarcodeConfig';
import { useBarkoderSettings } from './useBarkoderSettings';
import { useCameraControls } from './useCameraControls';
import type { ScannedItem, ScannerSettings } from '../types/types';
import { mapGalleryResultToItems, toDataUrl } from '../utils/galleryResultUtils';

const ALL_TYPES = [...BARCODE_TYPES_1D, ...BARCODE_TYPES_2D];
const getConfigurableTypesForMode = (scannerMode: string) => {
  if (scannerMode === MODES.MRZ) {
    return ALL_TYPES.filter((barcodeType) => barcodeType.id === 'idDocument');
  }

  if (scannerMode === MODES.VIN) {
    return ALL_TYPES.filter((barcodeType) => VIN_ALLOWED_TYPE_IDS.includes(barcodeType.id));
  }

  return ALL_TYPES.filter((barcodeType) => barcodeType.id !== 'ocrText' && barcodeType.id !== 'idDocument');
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

export const useScannerLogic = (mode: string) => {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [lastScanCount, setLastScanCount] = useState(0);
  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>(() => getInitialEnabledTypes(mode));
  const [settings, setSettings] = useState<ScannerSettings>(() => getInitialSettings(mode));
  const [isScanningPaused, setIsScanningPaused] = useState(false);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGalleryProcessing, setIsGalleryProcessing] = useState(false);
  const [galleryScanOutcome, setGalleryScanOutcome] = useState<'idle' | 'success' | 'empty' | 'cancelled'>('idle');
  const [statusMessage, setStatusMessage] = useState('Preparing scanner...');
  const [isSettingsHydrated, setIsSettingsHydrated] = useState(false);

  const containerRef = useRef<HTMLElement | null>(null);
  const settingsRef = useRef(settings);
  const isInitializingRef = useRef(false);
  const galleryFallbackTimerRef = useRef<number | null>(null);

  const { updateBarkoderConfig, toggleBarcodeType, enableAllBarcodeTypes } = useBarcodeConfig(mode);
  const { isFlashOn, zoomLevel, selectedCameraId, toggleFlash, toggleZoom, toggleCamera } = useCameraControls();

  const clearGalleryFallbackTimer = useCallback(() => {
    if (galleryFallbackTimerRef.current !== null) {
      window.clearTimeout(galleryFallbackTimerRef.current);
      galleryFallbackTimerRef.current = null;
    }
  }, []);

  const startScanning = useCallback(async (): Promise<void> => {
    if (!barkoderService.isNativePlatform || mode === MODES.GALLERY) {
      return;
    }
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        console.log('[ScannerFlow] startScanning -> begin', { mode, attempt });
        // On some Android devices preview attach is flaky unless camera is
        // explicitly started before decoding starts.
        await Barkoder.startCamera();
        if (attempt > 1) {
          await wait(90);
        }
        await Barkoder.startScanning();
        console.log('[ScannerFlow] startScanning -> success', { mode, attempt });
        return;
      } catch (error) {
        console.error('[ScannerFlow] startScanning -> failed', { mode, attempt, error });
        try {
          await Barkoder.stopScanning();
        } catch {
          // Ignore stop errors between retries.
        }
        if (attempt === 3) {
          throw error;
        }
        await wait(180);
      }
    }
  }, [mode]);

  const { applySettings, updateSingleSetting } = useBarkoderSettings(mode, startScanning);

  const clearPauseState = useCallback(() => {
    setIsScanningPaused(false);
    setFrozenImage(null);
  }, []);

  const applyDecoderConfig = useCallback(async (types: Record<string, boolean>): Promise<void> => {
    const normalizedTypes = normalizeEnabledTypesForMode(mode, types);
    const decoderConfig: Record<string, unknown> = {};
    const configurableTypes = getConfigurableTypesForMode(mode).filter(
      (barcodeType) => !(mode === MODES.VIN && barcodeType.id === 'ocrText' && !normalizedTypes.ocrText),
    );

    configurableTypes.forEach((barcodeType) => {
      decoderConfig[barcodeType.id] = createBarcodeConfig(
        barcodeType.id,
        Boolean(normalizedTypes[barcodeType.id]),
      );
    });

    await Barkoder.configureBarkoder({
      barkoderConfig: new BarkoderConfig({
        decoder: new DekoderConfig(decoderConfig),
        imageResultEnabled: true,
        locationInImageResultEnabled: true,
        pinchToZoomEnabled: settingsRef.current.pinchToZoom,
        locationInPreviewEnabled: settingsRef.current.locationInPreview,
        regionOfInterestVisible: settingsRef.current.regionOfInterest,
        beepOnSuccessEnabled: settingsRef.current.beepOnSuccess,
        vibrateOnSuccessEnabled: settingsRef.current.vibrateOnSuccess,
      }),
    });
  }, [mode]);

  const applyModeConfig = useCallback(async (): Promise<void> => {
    await Barkoder.setEnableComposite({
      value: mode === MODES.ANYSCAN && settingsRef.current.compositeMode ? 1 : 0,
    });
    await Barkoder.setUpcEanDeblurEnabled({ enabled: settingsRef.current.scanBlurred });
    await Barkoder.setMisshaped1DEnabled({ enabled: settingsRef.current.scanDeformed });
    await Barkoder.setDecodingSpeed({ value: settingsRef.current.decodingSpeed });
    await Barkoder.setBarkoderResolution({ value: settingsRef.current.resolution });
    await Barkoder.setCloseSessionOnResultEnabled({ enabled: !settingsRef.current.continuousScanning });
    await Barkoder.setBarcodeThumbnailOnResultEnabled({ enabled: true });
    await Barkoder.setMaximumResultsCount({ value: 200 });

    if (settingsRef.current.continuousScanning) {
      await Barkoder.setThresholdBetweenDuplicatesScans({ value: settingsRef.current.continuousThreshold ?? 0 });
    }

    if (mode !== MODES.VIN) {
      await Barkoder.setBarcodeTypeEnabled({ type: BarcodeType.ocrText, enabled: false });
    }
    await Barkoder.setBarcodeTypeEnabled({ type: BarcodeType.idDocument, enabled: mode === MODES.MRZ });

    if (mode === MODES.MULTISCAN) {
      await Barkoder.setMulticodeCachingDuration({ value: 3000 });
      await Barkoder.setMulticodeCachingEnabled({ enabled: true });
    } else if (mode === MODES.VIN) {
      await Barkoder.setEnableVINRestrictions({ value: true });
      await Barkoder.setRegionOfInterest({ left: 0, top: 35, width: 100, height: 30 });
      if (enabledTypes.ocrText) {
        try {
          await Barkoder.setBarcodeTypeEnabled({
            type: BarcodeType.ocrText,
            enabled: true,
          });
          await Barkoder.setCustomOption({
            option: 'enable_ocr_functionality',
            value: 1,
          });
        } catch (error) {
          console.warn('VIN OCR could not be enabled. Continuing VIN barcode scan only.', error);
        }
      }
    } else if (mode === MODES.DPM) {
      await Barkoder.setBarcodeTypeEnabled({ type: BarcodeType.datamatrix, enabled: true });
      await Barkoder.setDatamatrixDpmModeEnabled({ enabled: true });
      await Barkoder.setRegionOfInterest({ left: 40, top: 40, width: 20, height: 10 });
    } else if (mode === MODES.AR_MODE) {
      await Barkoder.setARMode({ value: BarkoderARMode.interactiveEnabled });
      await Barkoder.setARSelectedLocationColor({ value: '#00FF00' });
      await Barkoder.setARNonSelectedLocationColor({ value: '#FF0000' });
      await Barkoder.setARHeaderShowMode({ value: BarkoderARHeaderShowMode.onSelected });
    } else if (mode === MODES.DOTCODE) {
      await Barkoder.setBarcodeTypeEnabled({ type: BarcodeType.dotcode, enabled: true });
      await Barkoder.setRegionOfInterest({ left: 30, top: 40, width: 40, height: 9 });
    }
  }, [enabledTypes.ocrText, mode]);

  const scanImagePressed = useCallback(async (): Promise<void> => {
    if (!barkoderService.isNativePlatform) {
      return;
    }

    try {
      clearGalleryFallbackTimer();
      setGalleryScanOutcome('idle');
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.Base64,
        quality: 95,
      });

      if (!photo.base64String) {
        clearGalleryFallbackTimer();
        setIsGalleryProcessing(false);
        setGalleryScanOutcome('cancelled');
        return;
      }

      setIsGalleryProcessing(true);

      const ready = await barkoderService.ensureImageScanReady();
      if (!ready) {
        clearGalleryFallbackTimer();
        setIsGalleryProcessing(false);
        setGalleryScanOutcome('cancelled');
        return;
      }

      await applyDecoderConfig(enabledTypes);
      await applyModeConfig();
      await Barkoder.scanImage({ base64: photo.base64String });

      galleryFallbackTimerRef.current = window.setTimeout(() => {
        setIsGalleryProcessing((processing) => {
          if (processing) {
            setGalleryScanOutcome('empty');
            return false;
          }
          return processing;
        });
      }, 3000);
    } catch (error) {
      console.error('Error scanning image from gallery', error);
      clearGalleryFallbackTimer();
      setIsGalleryProcessing(false);
      setGalleryScanOutcome('cancelled');
    }
  }, [applyDecoderConfig, applyModeConfig, clearGalleryFallbackTimer, enabledTypes]);

  const initializeScanner = useCallback(
    async (container: HTMLElement, options?: { autoStart?: boolean }): Promise<void> => {
      containerRef.current = container;
      setStatusMessage('Preparing scanner...');

      if (!barkoderService.isNativePlatform) {
        setIsReady(true);
        return;
      }

      if (mode === MODES.GALLERY) {
        setStatusMessage('');
        setIsReady(true);
        const autoStart = options?.autoStart ?? true;
        if (autoStart) {
          await scanImagePressed();
        }
        return;
      }

      try {
      console.log('[ScannerFlow] initialize -> ensureReady');
      const ready = await barkoderService.ensureReady(container);
      if (!ready) {
        setStatusMessage('Camera permission is required to start scanning.');
        setIsReady(false);
        return;
      }

      console.log('[ScannerFlow] initialize -> applyDecoderConfig');
      await applyDecoderConfig(enabledTypes);
      console.log('[ScannerFlow] initialize -> applyModeConfig');
      await applyModeConfig();

      const autoStart = options?.autoStart ?? true;

      if (autoStart) {
        console.log('[ScannerFlow] initialize -> startScanning');
        await startScanning();
      }

      setStatusMessage('');
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize scanner', error);
      setStatusMessage('Failed to initialize scanner.');
      setIsReady(false);
      }
    },
    [
      applyDecoderConfig,
      applyModeConfig,
      enabledTypes,
      mode,
      scanImagePressed,
      startScanning,
    ],
  );

  const initializeScannerSafely = useCallback(
    async (container: HTMLElement, options?: { autoStart?: boolean }): Promise<void> => {
      if (isInitializingRef.current) {
        return;
      }
      isInitializingRef.current = true;
      try {
        await initializeScanner(container, options);
      } finally {
        isInitializingRef.current = false;
      }
    },
    [initializeScanner],
  );

  const onUpdateSetting = useCallback(
    async (key: keyof ScannerSettings, value: unknown): Promise<void> => {
      const nextSettings = await updateSingleSetting(key, value, settings, clearPauseState);
      setSettings(nextSettings);
    },
    [clearPauseState, settings, updateSingleSetting],
  );

  const onToggleBarcodeType = useCallback(
    async (typeId: string, enabled: boolean): Promise<void> => {
      if (typeId === 'ocrText' && mode !== MODES.VIN) {
        return;
      }
      if (typeId === 'idDocument' && mode !== MODES.MRZ) {
        return;
      }
      if (mode === MODES.MRZ && typeId !== 'idDocument') {
        return;
      }

      const nextEnabledTypes = normalizeEnabledTypesForMode(
        mode,
        await toggleBarcodeType(typeId, enabled, enabledTypes),
      );
      setEnabledTypes(nextEnabledTypes);

      if (typeId === 'ocrText' && mode === MODES.VIN) {
        if (!enabled) {
          await Barkoder.setCustomOption({ option: 'enable_ocr_functionality', value: 0 });
          return;
        }

        try {
          await Barkoder.setBarcodeTypeEnabled({ type: BarcodeType.ocrText, enabled: true });
          await Barkoder.setCustomOption({ option: 'enable_ocr_functionality', value: 1 });
        } catch (error) {
          console.warn('VIN OCR could not be enabled from settings.', error);
        }
      }
    },
    [enabledTypes, mode, toggleBarcodeType],
  );

  const onEnableAllBarcodeTypes = useCallback(
    async (enabled: boolean, category: '1D' | '2D'): Promise<void> => {
      const nextEnabledTypes = normalizeEnabledTypesForMode(
        mode,
        await enableAllBarcodeTypes(enabled, category, enabledTypes),
      );
      setEnabledTypes(nextEnabledTypes);

      if (category === '2D' && mode === MODES.VIN) {
        if (!nextEnabledTypes.ocrText) {
          await Barkoder.setCustomOption({
            option: 'enable_ocr_functionality',
            value: 0,
          });
          return;
        }

        try {
          await Barkoder.setBarcodeTypeEnabled({
            type: BarcodeType.ocrText,
            enabled: true,
          });
          await Barkoder.setCustomOption({
            option: 'enable_ocr_functionality',
            value: 1,
          });
        } catch (error) {
          console.warn('VIN OCR could not be enabled from Enable All.', error);
        }
      }
    },
    [enableAllBarcodeTypes, enabledTypes, mode],
  );

  const resetConfig = useCallback(async (): Promise<void> => {
    const nextSettings = getInitialSettings(mode);
    const nextEnabledTypes = getInitialEnabledTypes(mode);

    setSettings(nextSettings);
    setEnabledTypes(nextEnabledTypes);
    
    if (isReady && barkoderService.isNativePlatform) {
      await applySettings(nextSettings);
      await updateBarkoderConfig(nextEnabledTypes);
    }
  }, [applySettings, isReady, mode, updateBarkoderConfig]);

  const resetSession = useCallback(() => {
    setScannedItems([]);
    setLastScanCount(0);
    setIsScanningPaused(false);
    setFrozenImage(null);
    clearGalleryFallbackTimer();
    setIsGalleryProcessing(false);
    setGalleryScanOutcome('idle');
  }, [clearGalleryFallbackTimer]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    let isCancelled = false;

    const loadSavedSettings = async () => {
      setIsSettingsHydrated(false);
      const saved = await SettingsService.getSettings(mode);
      if (isCancelled) {
        return;
      }

      if (saved?.enabledTypes) {
        const mergedEnabledTypes = mode === MODES.GALLERY
          ? getInitialEnabledTypes(mode)
          : {
              ...getInitialEnabledTypes(mode),
              ...saved.enabledTypes,
            };
        if (mode === MODES.VIN) {
          // VIN mode must always start with OCR disabled; users can enable it manually from settings.
          mergedEnabledTypes.ocrText = false;
        }
        const nextEnabledTypes = normalizeEnabledTypesForMode(mode, mergedEnabledTypes);
        setEnabledTypes(nextEnabledTypes);
      } else if (mode === MODES.GALLERY) {
        setEnabledTypes(normalizeEnabledTypesForMode(mode, getInitialEnabledTypes(mode)));
      }

      if (saved?.scannerSettings) {
        setSettings({ ...getInitialSettings(mode), ...saved.scannerSettings });
      }

      setIsSettingsHydrated(true);
    };

    void loadSavedSettings();

    return () => {
      isCancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!isSettingsHydrated) {
      return;
    }

    const save = async () => {
      await SettingsService.saveSettings(mode, {
        enabledTypes,
        scannerSettings: settings,
      });
    };

    const timeoutId = window.setTimeout(() => {
      void save();
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [enabledTypes, isSettingsHydrated, mode, settings]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const handleResult = async (result: BarkoderResult): Promise<void> => {
      if (mode === MODES.GALLERY) {
        clearGalleryFallbackTimer();
      }

      if (!result.decoderResults || result.decoderResults.length === 0) {
        if (mode === MODES.GALLERY) {
          setIsGalleryProcessing(false);
          setGalleryScanOutcome('empty');
        }
        return;
      }

      const shouldPause = !settingsRef.current.continuousScanning && mode !== MODES.GALLERY;

      if (shouldPause) {
        void Barkoder.pauseScanning();
        setIsScanningPaused(true);
      }

      const fullImage = toDataUrl(result.resultImageAsBase64);
      const thumbnail = result.resultThumbnailsAsBase64?.[0];
      const fallbackImage = toDataUrl(thumbnail) ?? fullImage;

      const newItems: ScannedItem[] =
        mode === MODES.GALLERY
          ? await mapGalleryResultToItems(result, fullImage)
          : result.decoderResults.map((decoded) => ({
              text: decoded.textualData,
              type: decoded.barcodeTypeName,
              image: fallbackImage,
            }));

      newItems.forEach((item) => {
        void HistoryService.addScan(item);
      });

      setScannedItems((previous) => [...newItems, ...previous]);
      setLastScanCount(newItems.length);

      if (mode === MODES.GALLERY) {
        setIsGalleryProcessing(false);
        setGalleryScanOutcome('success');
      }

      if (shouldPause) {
        setFrozenImage(fullImage ?? fallbackImage ?? null);
      }
    };

    const subscribe = async () => {
      unsubscribe = await barkoderService.subscribeResults((result: BarkoderResult) => {
        void handleResult(result);
      });
    };

    void subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [clearGalleryFallbackTimer, mode]);

  useEffect(() => {
    return () => {
      clearGalleryFallbackTimer();
    };
  }, [clearGalleryFallbackTimer]);

  return {
    scannedItems,
    setScannedItems,
    enabledTypes,
    lastScanCount,
    setLastScanCount,
    settings,
    isFlashOn,
    zoomLevel,
    selectedCameraId,
    isScanningPaused,
    setIsScanningPaused,
    frozenImage,
    setFrozenImage,
    isNativePlatform: barkoderService.isNativePlatform,
    isReady,
    statusMessage,
    isGalleryProcessing,
    galleryScanOutcome,
    initializeScanner: initializeScannerSafely,
    onUpdateSetting,
    onToggleBarcodeType,
    onEnableAllBarcodeTypes,
    resetConfig,
    resetSession,
    toggleFlash,
    toggleZoom,
    toggleCamera,
    startScanning,
    scanImagePressed,
  };
};
