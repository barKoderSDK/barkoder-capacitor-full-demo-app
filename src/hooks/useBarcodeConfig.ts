import { useCallback } from 'react';
import { Barkoder, BarkoderConfig, BarcodeType, DekoderConfig } from 'barkoder-capacitor';
import { BARCODE_TYPES_1D, BARCODE_TYPES_2D, MODES } from '../constants/constants';
import { createBarcodeConfig } from '../utils/scannerConfig';

const ALL_TYPES = [...BARCODE_TYPES_1D, ...BARCODE_TYPES_2D];

const getConfigurableTypes = (mode: string) => {
  if (mode === MODES.MRZ) {
    return ALL_TYPES.filter((barcodeType) => barcodeType.id === 'idDocument');
  }
  if (mode === MODES.VIN) {
    return ALL_TYPES.filter((barcodeType) => barcodeType.id !== 'idDocument');
  }
  return ALL_TYPES.filter((barcodeType) => barcodeType.id !== 'ocrText' && barcodeType.id !== 'idDocument');
};

export const useBarcodeConfig = (mode: string) => {
  const updateBarkoderConfig = useCallback(async (enabledTypes: Record<string, boolean>): Promise<void> => {
    const decoderConfig: Record<string, unknown> = {};
    getConfigurableTypes(mode).forEach((barcodeType) => {
      decoderConfig[barcodeType.id] = createBarcodeConfig(barcodeType.id, Boolean(enabledTypes[barcodeType.id]));
    });

    await Barkoder.configureBarkoder({
      barkoderConfig: new BarkoderConfig({
        decoder: new DekoderConfig(decoderConfig),
      }),
    });

    await Barkoder.setBarcodeTypeEnabled({ type: BarcodeType.idDocument, enabled: mode === MODES.MRZ });

    const vinOcrEnabled = mode === MODES.VIN && Boolean(enabledTypes.ocrText);
    await Barkoder.setBarcodeTypeEnabled({ type: BarcodeType.ocrText, enabled: vinOcrEnabled });
    await Barkoder.setCustomOption({
      option: 'enable_ocr_functionality',
      value: vinOcrEnabled ? 1 : 0,
    });
  }, [mode]);

  const toggleBarcodeType = useCallback(
    async (
      typeId: string,
      enabled: boolean,
      currentEnabledTypes: Record<string, boolean>,
    ): Promise<Record<string, boolean>> => {
      const nextEnabledTypes = { ...currentEnabledTypes, [typeId]: enabled };
      await updateBarkoderConfig(nextEnabledTypes);
      return nextEnabledTypes;
    },
    [updateBarkoderConfig],
  );

  const enableAllBarcodeTypes = useCallback(
    async (
      enabled: boolean,
      category: '1D' | '2D',
      currentEnabledTypes: Record<string, boolean>,
    ): Promise<Record<string, boolean>> => {
      const typesToUpdate = getConfigurableTypes(mode).filter((barcodeType) =>
        category === '1D'
          ? BARCODE_TYPES_1D.some((item) => item.id === barcodeType.id)
          : BARCODE_TYPES_2D.some((item) => item.id === barcodeType.id),
      );
      const nextEnabledTypes = { ...currentEnabledTypes };
      typesToUpdate.forEach((barcodeType) => {
        nextEnabledTypes[barcodeType.id] = enabled;
      });
      await updateBarkoderConfig(nextEnabledTypes);
      return nextEnabledTypes;
    },
    [mode, updateBarkoderConfig],
  );

  return {
    updateBarkoderConfig,
    toggleBarcodeType,
    enableAllBarcodeTypes,
  };
};
