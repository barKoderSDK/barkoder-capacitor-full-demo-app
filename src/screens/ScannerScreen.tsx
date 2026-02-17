import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Barkoder } from 'barkoder-capacitor';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import TopBar from '../components/TopBar';
import UnifiedSettings from '../components/UnifiedSettings';
import PauseOverlay from '../components/PauseOverlay';
import ScannedResultSheet from '../components/ScannedResultSheet';
import BottomControls from '../components/BottomControls';
import { BARCODE_TYPES_1D, BARCODE_TYPES_2D, MODES } from '../constants/constants';
import { useScannerLogic } from '../hooks/useScannerLogic';
import type { ScannedItem } from '../types/types';

const ALL_TYPES = [...BARCODE_TYPES_1D, ...BARCODE_TYPES_2D];

interface ScannerSessionSnapshot {
  scannedItems: ScannedItem[];
  lastScanCount: number;
  isScanningPaused: boolean;
  frozenImage: string | null;
  hiddenState: { session: string | undefined; count: number };
}

const scannerSessionSnapshots = new Map<string, ScannerSessionSnapshot>();

export default function ScannerScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const mode = params.mode ?? MODES.ANYSCAN;
  const isGalleryMode = mode === MODES.GALLERY;
  const sessionId = params.sessionId;
  const sessionKey = `${mode}:${sessionId ?? 'default'}`;
  const restoredSnapshot = useMemo(() => {
    const snapshot = scannerSessionSnapshots.get(sessionKey) ?? null;
    if (snapshot) {
      scannerSessionSnapshots.delete(sessionKey);
    }
    return snapshot;
  }, [sessionKey]);
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const scannerReadyRef = useRef(false);
  const activeButtonRef = useRef<string | null>(null);

  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isResultSheetExpanded, setIsResultSheetExpanded] = useState(false);
  const [hiddenState, setHiddenState] = useState<{ session: string | undefined; count: number }>({
    session: undefined,
    count: -1,
  });

  const {
    scannedItems,
    setScannedItems,
    enabledTypes,
    lastScanCount,
    setLastScanCount,
    settings,
    isFlashOn,
    zoomLevel,
    isScanningPaused,
    setIsScanningPaused,
    frozenImage,
    setFrozenImage,
    isNativePlatform,
    isReady,
    statusMessage,
    isGalleryProcessing,
    galleryScanOutcome,
    initializeScanner,
    onUpdateSetting,
    onToggleBarcodeType,
    onEnableAllBarcodeTypes,
    resetConfig,
    resetSession,
    toggleFlash,
    toggleZoom,
    toggleCamera,
    startScanning,
  } = useScannerLogic(mode);
  const initializeScannerRef = useRef(initializeScanner);

  useEffect(() => {
    scannerReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    activeButtonRef.current = activeButton;
  }, [activeButton]);

  useEffect(() => {
    initializeScannerRef.current = initializeScanner;
  }, [initializeScanner]);

  useEffect(() => {
    if (restoredSnapshot) {
      setScannedItems(restoredSnapshot.scannedItems);
      setLastScanCount(restoredSnapshot.lastScanCount);
      setIsScanningPaused(restoredSnapshot.isScanningPaused);
      setFrozenImage(restoredSnapshot.frozenImage);
      setHiddenState(restoredSnapshot.hiddenState);
      return;
    }

    resetSession();
    setHiddenState({ session: undefined, count: -1 });
  }, [resetSession, restoredSnapshot, setFrozenImage, setIsScanningPaused, setLastScanCount, setScannedItems, sessionId]);

  useEffect(() => {
    if (!scannerRef.current) {
      return;
    }

    const timeoutMs = isGalleryMode ? 0 : 150;
    const timeoutId = window.setTimeout(() => {
      if (scannerRef.current) {
        initializeScannerRef
          .current(scannerRef.current, { autoStart: !(restoredSnapshot?.isScanningPaused ?? false) })
          .catch((error) => console.error(error));
      }
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (scannerReadyRef.current) {
        Barkoder.stopScanning().catch(() => undefined);
      }
    };
  }, [isGalleryMode, mode, restoredSnapshot, sessionId]);

  useEffect(() => {
    if (mode !== MODES.GALLERY) {
      return;
    }

    if (galleryScanOutcome === 'success' && scannedItems.length > 0) {
      navigate('/details', { state: { item: scannedItems[0], returnToHome: true } });
      return;
    }

    if (galleryScanOutcome === 'empty') {
      window.alert('No barcode has been detected in the selected image.');
      navigate('/', { replace: true });
      return;
    }

    if (galleryScanOutcome === 'cancelled') {
      navigate('/', { replace: true });
    }
  }, [galleryScanOutcome, mode, navigate, scannedItems]);

  useEffect(() => {
    if (!isNativePlatform) {
      return;
    }

    let backButtonHandle: PluginListenerHandle | undefined;

    const setupBackHandler = async () => {
      backButtonHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (activeButtonRef.current === 'settings') {
          setActiveButton(null);
          if (mode !== MODES.GALLERY) {
            startScanning().catch((error) => console.error(error));
          }
          return;
        }

        if (canGoBack) {
          navigate(-1);
          return;
        }

        navigate('/', { replace: true });
      });
    };

    void setupBackHandler();

    return () => {
      if (backButtonHandle) {
        void backButtonHandle.remove();
      }
    };
  }, [isNativePlatform, mode, navigate, startScanning]);

  const activeTypes = useMemo(() => {
    return ALL_TYPES.filter((item) => enabledTypes[item.id]);
  }, [enabledTypes]);

  const activeBarcodeText = activeTypes.map((item) => item.label).join(', ');
  const isResultSheetOpen =
    settings.showResultSheet !== false &&
    scannedItems.length > 0 &&
    !(hiddenState.session === sessionId && hiddenState.count === scannedItems.length);

  const handleCopy = async () => {
    if (!scannedItems.length) {
      return;
    }

    const allText = scannedItems.map((item) => item.text).join('\n');
    await navigator.clipboard.writeText(allText);
  };

  const handleCSV = async () => {
    if (!scannedItems.length) {
      return;
    }

    const header = 'Barcode,Type\n';
    const rows = scannedItems
      .map((item) => `"${item.text.replace(/"/g, '""')}","${item.type}"`)
      .join('\n');
    const csvContent = `${header}${rows}`;

    if (isNativePlatform) {
      await Filesystem.writeFile({
        path: 'scanned_barcodes.csv',
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const uri = await Filesystem.getUri({
        path: 'scanned_barcodes.csv',
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'Share CSV',
        text: 'Here are your scanned barcodes',
        url: uri.uri,
      });
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'scanned_barcodes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResumeScanning = () => {
    setHiddenState({ session: sessionId, count: scannedItems.length });
    setIsResultSheetExpanded(false);
    setIsScanningPaused(false);
    setFrozenImage(null);
    startScanning().catch((error) => console.error(error));
  };

  const handleDetails = (item: ScannedItem) => {
    scannerSessionSnapshots.set(sessionKey, {
      scannedItems,
      lastScanCount,
      isScanningPaused,
      frozenImage,
      hiddenState,
    });

    navigate('/details', { state: { item, returnToHome: mode === MODES.GALLERY } });
  };

  if (isGalleryMode) {
    return (
      <div className="scanner-page scanner-page-gallery">
        <div ref={scannerRef} className="scanner-gallery-anchor" />
        {isGalleryProcessing && (
          <div className="gallery-processing-overlay" aria-live="polite" aria-label="Processing image">
            <div className="gallery-processing-spinner" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="scanner-page">
      {!isGalleryMode && (
        <div className="scanner-top-wrap">
          {activeButton !== 'settings' && (
            <TopBar
              transparent
              onMenuPress={() => {
                if (scannerReadyRef.current) {
                  Barkoder.stopScanning().catch(() => undefined);
                }
                setActiveButton('settings');
              }}
              onClose={() => navigate(-1)}
            />
          )}
        </div>
      )}

      <div className="scanner-content-wrap">
        <div ref={scannerRef} className="scanner-native-surface" />

        {!isGalleryMode && !isNativePlatform && (
          <div className="scanner-fallback">Native scanner preview is available in iOS/Android builds.</div>
        )}

        {!isGalleryMode && !isReady && <div className="scanner-status">{statusMessage}</div>}

        {!isGalleryMode && isGalleryProcessing && <div className="scanner-status">Processing image...</div>}

        {!isGalleryMode && isScanningPaused && (
          <PauseOverlay
            isSheetExpanded={isResultSheetExpanded}
            frozenImage={frozenImage}
            onResume={handleResumeScanning}
          />
        )}
      </div>

      {!isGalleryMode && (
        <BottomControls
          activeBarcodeText={activeBarcodeText}
          zoomLevel={zoomLevel}
          isFlashOn={isFlashOn}
          showButtons={!isResultSheetOpen}
          onToggleZoom={() => toggleZoom().catch((error) => console.error(error))}
          onToggleFlash={() => toggleFlash().catch((error) => console.error(error))}
          onToggleCamera={() => toggleCamera().catch((error) => console.error(error))}
        />
      )}

      {!isGalleryMode && (
        <div className="scanner-bottom-wrap">
          <ScannedResultSheet
            scannedItems={scannedItems}
            lastScanCount={lastScanCount}
            onCopy={() => handleCopy().catch((error) => console.error(error))}
            onCSV={() => handleCSV().catch((error) => console.error(error))}
            onDetails={handleDetails}
            showResultSheet={isResultSheetOpen}
            onClose={() => setHiddenState({ session: sessionId, count: scannedItems.length })}
            onExpandedChange={setIsResultSheetExpanded}
          />
        </div>
      )}

      {!isGalleryMode && (
        <UnifiedSettings
          visible={activeButton === 'settings'}
          settings={settings}
          enabledTypes={enabledTypes}
          onUpdateSetting={(key, value) => onUpdateSetting(key, value).catch((error) => console.error(error))}
          onToggleType={(typeId, enabled) => onToggleBarcodeType(typeId, enabled).catch((error) => console.error(error))}
          onEnableAll={(enabled, category) =>
            onEnableAllBarcodeTypes(enabled, category).catch((error) => console.error(error))
          }
          onResetConfig={() => resetConfig().catch((error) => console.error(error))}
          mode={mode}
          onClose={() => {
            setActiveButton(null);
            if (mode !== MODES.GALLERY) {
              startScanning().catch((error) => console.error(error));
            }
          }}
        />
      )}
    </div>
  );
}
