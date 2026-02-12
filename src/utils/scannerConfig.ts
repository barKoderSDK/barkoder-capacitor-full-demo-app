import {
  BarkoderARHeaderShowMode,
  BarkoderARLocationType,
  BarkoderARMode,
  BarkoderAROverlayRefresh,
  BarkoderResolution,
  BarcodeConfig,
  BarcodeConfigWithDpmMode,
  BarcodeConfigWithLength,
  Code39BarcodeConfig,
  DecodingSpeed,
  IdDocumentBarcodeConfig,
  IdDocumentMasterChecksumType,
} from 'barkoder-capacitor';
import type { ScannerSettings } from '../types/types';
import { BARCODE_TYPES_1D, BARCODE_TYPES_2D, MODES } from '../constants/constants';

const ALL_TYPES = [...BARCODE_TYPES_1D, ...BARCODE_TYPES_2D];
const DEFAULT_ENABLED = ['ean13', 'upcA', 'code128', 'qr', 'datamatrix'];

export const getInitialEnabledTypes = (mode: string): Record<string, boolean> => {
  const enabledTypes: Record<string, boolean> = {};

  ALL_TYPES.forEach((barcodeType) => {
    if (mode === MODES.MODE_1D) {
      enabledTypes[barcodeType.id] = BARCODE_TYPES_1D.some((item) => item.id === barcodeType.id);
    } else if (mode === MODES.MODE_2D) {
      const is2DType = BARCODE_TYPES_2D.some((item) => item.id === barcodeType.id);
      enabledTypes[barcodeType.id] = is2DType && barcodeType.id !== 'ocrText' && barcodeType.id !== 'idDocument';
    } else if (mode === MODES.CONTINUOUS || mode === MODES.ANYSCAN) {
      enabledTypes[barcodeType.id] = barcodeType.id !== 'ocrText' && barcodeType.id !== 'idDocument';
    } else if (mode === MODES.GALLERY) {
      enabledTypes[barcodeType.id] = barcodeType.id !== 'ocrText' && barcodeType.id !== 'idDocument';
    } else if (mode === MODES.DOTCODE) {
      enabledTypes[barcodeType.id] = barcodeType.id === 'dotcode';
    } else if (mode === MODES.MRZ) {
      enabledTypes[barcodeType.id] = barcodeType.id === 'idDocument';
    } else if (mode === MODES.VIN) {
      enabledTypes[barcodeType.id] = ['code39', 'code128', 'qr', 'datamatrix'].includes(barcodeType.id);
    } else if (mode === MODES.AR_MODE) {
      enabledTypes[barcodeType.id] = ['qr', 'code128', 'code39', 'upcA', 'upcE', 'ean13', 'ean8'].includes(
        barcodeType.id,
      );
    } else {
      enabledTypes[barcodeType.id] =
        barcodeType.id !== 'ocrText' && DEFAULT_ENABLED.includes(barcodeType.id);
    }
  });

  return enabledTypes;
};

export const normalizeEnabledTypesForMode = (
  mode: string,
  enabledTypes: Record<string, boolean>,
): Record<string, boolean> => {
  const nextEnabledTypes = { ...enabledTypes };

  if (mode === MODES.MRZ) {
    ALL_TYPES.forEach((barcodeType) => {
      nextEnabledTypes[barcodeType.id] = barcodeType.id === 'idDocument';
    });
    return nextEnabledTypes;
  }

  nextEnabledTypes.idDocument = false;

  if (mode !== MODES.VIN) {
    nextEnabledTypes.ocrText = false;
  }

  return nextEnabledTypes;
};

export const getInitialSettings = (mode: string): ScannerSettings => {
  const baseSettings: ScannerSettings = {
    compositeMode: false,
    pinchToZoom: true,
    locationInPreview: true,
    regionOfInterest: false,
    beepOnSuccess: true,
    vibrateOnSuccess: true,
    scanBlurred: false,
    scanDeformed: false,
    continuousScanning: false,
    decodingSpeed: DecodingSpeed.normal,
    resolution: BarkoderResolution.HD,
    continuousThreshold: 0,
    showResultSheet: true,
  };

  const modeSettings: Partial<ScannerSettings> = (() => {
    switch (mode) {
      case MODES.CONTINUOUS:
        return { continuousScanning: true };
      case MODES.MULTISCAN:
        return { continuousScanning: true, continuousThreshold: -1 };
      case MODES.VIN:
        return {
          decodingSpeed: DecodingSpeed.slow,
          resolution: BarkoderResolution.FHD,
          regionOfInterest: true,
          scanDeformed: true,
        };
      case MODES.DPM:
        return {
          decodingSpeed: DecodingSpeed.slow,
          resolution: BarkoderResolution.FHD,
          regionOfInterest: true,
        };
      case MODES.AR_MODE:
        return {
          resolution: BarkoderResolution.FHD,
          decodingSpeed: DecodingSpeed.slow,
          continuousScanning: true,
          arMode: BarkoderARMode.interactiveEnabled,
          arLocationType: BarkoderARLocationType.none,
          arHeaderShowMode: BarkoderARHeaderShowMode.onSelected,
          arOverlayRefresh: BarkoderAROverlayRefresh.normal,
          arDoubleTapToFreeze: false,
        };
      case MODES.GALLERY:
        return { decodingSpeed: DecodingSpeed.rigorous };
      case MODES.DOTCODE:
        return {
          regionOfInterest: true,
          decodingSpeed: DecodingSpeed.slow,
          continuousScanning: false,
        };
      case MODES.DEBLUR:
        return {
          scanBlurred: true,
          scanDeformed: true,
        };
      default:
        return {};
    }
  })();

  return { ...baseSettings, ...modeSettings };
};

export const createBarcodeConfig = (typeId: string, enabled: boolean) => {
  if (['code128', 'code93', 'codabar', 'code11', 'msi'].includes(typeId)) {
    return new BarcodeConfigWithLength({ enabled });
  }

  if (['qr', 'qrMicro', 'datamatrix'].includes(typeId)) {
    return new BarcodeConfigWithDpmMode({ enabled });
  }

  if (typeId === 'code39') {
    return new Code39BarcodeConfig({ enabled });
  }

  if (typeId === 'idDocument') {
    return new IdDocumentBarcodeConfig({
      enabled,
      masterChecksum: IdDocumentMasterChecksumType.disabled,
    });
  }

  return new BarcodeConfig({ enabled });
};
