import { useCallback, useState } from 'react';
import { Barkoder, BarkoderCameraPosition } from 'barkoder-capacitor';

export const useCameraControls = () => {
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [selectedCameraId, setSelectedCameraId] = useState<'back' | 'front'>('back');

  const toggleFlash = useCallback(async () => {
    const next = !isFlashOn;
    setIsFlashOn(next);
    await Barkoder.setFlashEnabled({ enabled: next });
  }, [isFlashOn]);

  const toggleZoom = useCallback(async () => {
    const next = zoomLevel === 1.0 ? 1.5 : 1.0;
    setZoomLevel(next);
    await Barkoder.setZoomFactor({ value: next });
  }, [zoomLevel]);

  const toggleCamera = useCallback(async () => {
    const next = selectedCameraId === 'back' ? 'front' : 'back';
    setSelectedCameraId(next);
    await Barkoder.setCamera({
      value: next === 'back' ? BarkoderCameraPosition.BACK : BarkoderCameraPosition.FRONT,
    });
  }, [selectedCameraId]);

  return {
    isFlashOn,
    zoomLevel,
    selectedCameraId,
    toggleFlash,
    toggleZoom,
    toggleCamera,
  };
};