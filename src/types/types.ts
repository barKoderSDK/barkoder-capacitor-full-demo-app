import type {
  BarkoderARHeaderShowMode,
  BarkoderARLocationType,
  BarkoderARMode,
  BarkoderAROverlayRefresh,
  BarkoderResolution,
  DecodingSpeed,
} from 'barkoder-capacitor';

export interface HomeItem {
  id: string;
  label: string;
  icon: string;
  mode: string;
  action?: string;
  url?: string;
}

export interface HomeSection {
  title: string;
  data: HomeItem[];
}

export interface ScannedItem {
  text: string;
  type: string;
  image?: string;
}

export interface HistoryItem extends ScannedItem {
  timestamp: number;
  count: number;
}

export interface ScannerSettings {
  compositeMode: boolean;
  pinchToZoom: boolean;
  locationInPreview: boolean;
  regionOfInterest: boolean;
  beepOnSuccess: boolean;
  vibrateOnSuccess: boolean;
  scanBlurred: boolean;
  scanDeformed: boolean;
  continuousScanning: boolean;
  decodingSpeed: DecodingSpeed;
  resolution: BarkoderResolution;
  arMode?: BarkoderARMode;
  arLocationType?: BarkoderARLocationType;
  arHeaderShowMode?: BarkoderARHeaderShowMode;
  arOverlayRefresh?: BarkoderAROverlayRefresh;
  arDoubleTapToFreeze?: boolean;
  continuousThreshold?: number;
  showResultSheet?: boolean;
}