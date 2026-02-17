import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Barkoder, BarkoderResult } from 'barkoder-capacitor';
import { Camera } from '@capacitor/camera';

const isNativePlatform = Capacitor.getPlatform() !== 'web';

let registered = false;
let resultListener: PluginListenerHandle | null = null;
let hiddenInitializationElement: HTMLElement | null = null;

const resultSubscribers = new Set<(result: BarkoderResult) => void>();
const closeSubscribers = new Set<() => void>();

const getLicenseKey = (): string => {
  return import.meta.env.VITE_BARKODER_LICENSE_KEY ?? '';
};

const ensureListeners = async (): Promise<void> => {
  if (!isNativePlatform || resultListener) {
    return;
  }

  resultListener = await Barkoder.addListener('barkoderResultEvent', (payload: unknown) => {
    try {
      const result = new BarkoderResult(payload as Record<string, unknown>);
      resultSubscribers.forEach((subscriber) => subscriber(result));
    } catch (error) {
      console.error('Failed to parse barkoder result payload', error);
    }
  });

  await Barkoder.addListener('barkoderCloseButtonTappedEvent', () => {
    closeSubscribers.forEach((subscriber) => subscriber());
  });
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const getElementBounds = (element: HTMLElement): DOMRect => element.getBoundingClientRect();

const getHiddenInitializationElement = (): HTMLElement => {
  if (!hiddenInitializationElement) {
    hiddenInitializationElement = document.createElement('div');
    hiddenInitializationElement.style.position = 'fixed';
    hiddenInitializationElement.style.left = '200vw';
    hiddenInitializationElement.style.top = '200vh';
    hiddenInitializationElement.style.width = '2px';
    hiddenInitializationElement.style.height = '2px';
    hiddenInitializationElement.style.opacity = '0';
    hiddenInitializationElement.style.pointerEvents = 'none';
  }

  if (document.body && !hiddenInitializationElement.isConnected) {
    document.body.appendChild(hiddenInitializationElement);
  }

  return hiddenInitializationElement;
};

const getValidBounds = async (element: HTMLElement): Promise<DOMRect> => {
  let rect = getElementBounds(element);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (rect.width > 1 && rect.height > 1) {
      return rect;
    }

    await sleep(50);
    rect = getElementBounds(element);
  }

  return rect;
};

const initializeWithBounds = async (
  element: HTMLElement,
  options?: { fullscreen?: boolean },
): Promise<void> => {
  const rect = await getValidBounds(element);
  const fullscreen = options?.fullscreen ?? true;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = fullscreen ? Math.max(rect.width, viewportWidth) : rect.width;
  const height = fullscreen ? Math.max(rect.height, viewportHeight) : rect.height;
  const x = fullscreen ? 0 : rect.left;
  const y = fullscreen ? 0 : rect.top;

  if (rect.width <= 1 || rect.height <= 1) {
    console.warn('Barkoder initialize using fallback bounds', {
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
    });
  }

  await Barkoder.initialize({
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
  });

  // The native plugin resolves initialize before the UI-thread view attach completes.
  await sleep(120);
};

const ensureCameraPermission = async (): Promise<boolean> => {
  try {
    const current = await Camera.checkPermissions();
    if (current.camera === 'granted') {
      return true;
    }

    const requested = await Camera.requestPermissions();
    return requested.camera === 'granted';
  } catch (error) {
    console.error('Failed to request camera permission', error);
    return false;
  }
};

const ensureRegistered = async (): Promise<void> => {
  if (registered) {
    return;
  }

  const licenseKey = getLicenseKey();
  await Barkoder.registerWithLicenseKey({ licenseKey });
  registered = true;
};

export const barkoderService = {
  isNativePlatform,

  async ensureReady(
    element: HTMLElement,
    options?: { requireCameraPermission?: boolean; fullscreen?: boolean },
  ): Promise<boolean> {
    if (!isNativePlatform) {
      return false;
    }

    const requireCameraPermission = options?.requireCameraPermission ?? true;

    if (requireCameraPermission) {
      const hasCameraPermission = await ensureCameraPermission();
      if (!hasCameraPermission) {
        console.error('Camera permission denied');
        return false;
      }
    }

    await ensureRegistered();

    // Reinitialize when entering scanner to keep native preview layout in sync
    // with the current web view and avoid stale view artifacts.
    await initializeWithBounds(element, { fullscreen: options?.fullscreen ?? true });

    await ensureListeners();
    return true;
  },

  async ensureImageScanReady(): Promise<boolean> {
    if (!isNativePlatform) {
      return false;
    }

    await ensureRegistered();
    await initializeWithBounds(getHiddenInitializationElement(), { fullscreen: false });
    await ensureListeners();
    return true;
  },

  async subscribeResults(callback: (result: BarkoderResult) => void): Promise<() => void> {
    resultSubscribers.add(callback);
    await ensureListeners();

    return () => {
      resultSubscribers.delete(callback);
    };
  },

  subscribeClose(callback: () => void): () => void {
    closeSubscribers.add(callback);
    return () => closeSubscribers.delete(callback);
  },
};
