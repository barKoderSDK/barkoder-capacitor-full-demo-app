import {
  BarkoderARHeaderShowMode,
  BarkoderARLocationType,
  BarkoderARMode,
  BarkoderAROverlayRefresh,
  BarkoderResolution,
  DecodingSpeed,
} from 'barkoder-capacitor';
import bgImage from '../assets/images/BG.svg';
import chevron from '../assets/icons/chevron.svg';
import { BARCODE_TYPES_1D, BARCODE_TYPES_2D, MODES } from '../constants/constants';
import type { ScannerSettings } from '../types/types';
import SettingDropdown from './SettingDropdown';
import SettingSwitch from './SettingSwitch';

interface UnifiedSettingsProps {
  visible: boolean;
  settings: ScannerSettings;
  enabledTypes: Record<string, boolean>;
  onUpdateSetting: (key: keyof ScannerSettings, value: unknown) => void;
  onToggleType: (typeId: string, enabled: boolean) => void;
  onEnableAll: (enabled: boolean, category: '1D' | '2D') => void;
  onResetConfig: () => void;
  onClose: () => void;
  mode?: string;
}

export default function UnifiedSettings({
  visible,
  settings,
  enabledTypes,
  onUpdateSetting,
  onToggleType,
  onEnableAll,
  onResetConfig,
  onClose,
  mode,
}: UnifiedSettingsProps) {
  if (!visible) {
    return null;
  }

  const isDpmMode = mode === MODES.DPM;
  const isARMode = mode === MODES.AR_MODE;
  const isVinMode = mode === MODES.VIN;
  const isMrzMode = mode === MODES.MRZ;
  const isDotcodeMode = mode === MODES.DOTCODE;
  const isMode1D = mode === MODES.MODE_1D;
  const isMode2D = mode === MODES.MODE_2D;

  const generalSettings: Array<{ type: 'switch' | 'dropdown'; key: keyof ScannerSettings; label: string; options?: Array<{ label: string; value: number }> }> = [];

  if (mode === MODES.ANYSCAN) {
    generalSettings.push({ type: 'switch', key: 'compositeMode', label: 'Composite Mode' });
  }

  generalSettings.push({ type: 'switch', key: 'pinchToZoom', label: 'Allow Pinch to Zoom' });

  if (!isDpmMode && !isARMode && !isVinMode && !isMrzMode) {
    generalSettings.push({ type: 'switch', key: 'locationInPreview', label: 'Location in Preview' });
  }

  if (!isDpmMode && !isARMode && !isMrzMode) {
    generalSettings.push({
      type: 'switch',
      key: 'regionOfInterest',
      label: isVinMode ? 'Narrow Viewfinder' : 'Region of Interest',
    });
  }

  generalSettings.push({ type: 'switch', key: 'beepOnSuccess', label: 'Beep on Success' });
  generalSettings.push({ type: 'switch', key: 'vibrateOnSuccess', label: 'Vibrate on Success' });
  generalSettings.push({ type: 'switch', key: 'showResultSheet', label: 'Show Result Sheet' });

  if (!isDpmMode && !isARMode && !isVinMode && !isMrzMode && !isDotcodeMode) {
    generalSettings.push({ type: 'switch', key: 'scanBlurred', label: 'Scan Blurred UPC/EAN' });
    generalSettings.push({ type: 'switch', key: 'scanDeformed', label: 'Scan Deformed Codes' });
  }

  if (!isARMode) {
    generalSettings.push({ type: 'switch', key: 'continuousScanning', label: 'Continuous Scanning' });

    if (settings.continuousScanning) {
      generalSettings.push({
        type: 'dropdown',
        key: 'continuousThreshold',
        label: 'Duplicate Threshold',
        options: Array.from({ length: 11 }, (_, index) => ({ label: `${index}s`, value: index })),
      });
    }
  }

  if (isARMode) {
    generalSettings.push({ type: 'switch', key: 'arDoubleTapToFreeze', label: 'Double Tap to Freeze' });
    generalSettings.push({
      type: 'dropdown',
      key: 'arMode',
      label: 'AR Mode',
      options: [
        { label: 'Disabled', value: BarkoderARMode.interactiveDisabled },
        { label: 'Enabled', value: BarkoderARMode.interactiveEnabled },
        { label: 'Always', value: BarkoderARMode.nonInteractive },
      ],
    });
    generalSettings.push({
      type: 'dropdown',
      key: 'arLocationType',
      label: 'Location Type',
      options: [
        { label: 'None', value: BarkoderARLocationType.none },
        { label: 'Tight', value: BarkoderARLocationType.tight },
        { label: 'Box', value: BarkoderARLocationType.boundingBox },
      ],
    });
    generalSettings.push({
      type: 'dropdown',
      key: 'arHeaderShowMode',
      label: 'Header Show Mode',
      options: [
        { label: 'Never', value: BarkoderARHeaderShowMode.never },
        { label: 'Always', value: BarkoderARHeaderShowMode.always },
        { label: 'Selected', value: BarkoderARHeaderShowMode.onSelected },
      ],
    });
    generalSettings.push({
      type: 'dropdown',
      key: 'arOverlayRefresh',
      label: 'Overlay Refresh',
      options: [
        { label: 'Smooth', value: BarkoderAROverlayRefresh.smooth },
        { label: 'Normal', value: BarkoderAROverlayRefresh.normal },
      ],
    });
  }

  const decodingSettings: typeof generalSettings = [];
  if (!isDpmMode && !isARMode && !isVinMode && !isMrzMode && !isDotcodeMode) {
    decodingSettings.push({
      type: 'dropdown',
      key: 'decodingSpeed',
      label: 'Decoding Speed',
      options: [
        { label: 'Fast', value: DecodingSpeed.fast },
        { label: 'Normal', value: DecodingSpeed.normal },
        { label: 'Slow', value: DecodingSpeed.slow },
      ],
    });

    decodingSettings.push({
      type: 'dropdown',
      key: 'resolution',
      label: 'Resolution',
      options: [
        { label: 'HD', value: BarkoderResolution.HD },
        { label: 'FHD', value: BarkoderResolution.FHD },
      ],
    });
  }

  const getFilteredBarcodeTypes = (category: '1D' | '2D') => {
    if (isMrzMode) {
      if (category === '1D') {
        return [];
      }
      return BARCODE_TYPES_2D.filter((item) => item.id === 'idDocument');
    }

    let types = category === '1D' ? BARCODE_TYPES_1D : BARCODE_TYPES_2D;

    if (isDpmMode) {
      types = types.filter((item) => ['datamatrix', 'qr', 'qrMicro'].includes(item.id));
    } else if (isDotcodeMode) {
      types = types.filter((item) => item.id === 'dotcode');
    } else if (isVinMode) {
      types = types.filter((item) => ['code39', 'code128', 'datamatrix', 'qr', 'ocrText'].includes(item.id));
    } else if (isMode1D && category === '2D') {
      return [];
    } else if (isMode2D && category === '1D') {
      return [];
    }

    if (!isVinMode) {
      types = types.filter((item) => item.id !== 'ocrText');
    }
    types = types.filter((item) => item.id !== 'idDocument');

    return types;
  };

  const renderSettingsGroup = (items: typeof generalSettings) => {
    if (!items.length) {
      return null;
    }

    return (
      <div className="settings-group">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          if (item.type === 'switch') {
            return (
              <SettingSwitch
                key={item.key}
                label={item.label}
                value={Boolean(settings[item.key])}
                onValueChange={(value) => onUpdateSetting(item.key, value)}
                isLast={isLast}
              />
            );
          }

          return (
            <SettingDropdown
              key={item.key}
              label={item.label}
              options={item.options ?? []}
              selectedValue={settings[item.key] as number | undefined}
              onSelect={(value) => onUpdateSetting(item.key, value)}
              isLast={isLast}
            />
          );
        })}
      </div>
    );
  };

  const renderBarcodeGroup = (category: '1D' | '2D') => {
    const types = getFilteredBarcodeTypes(category);
    if (!types.length) {
      return null;
    }

    const isAllEnabled = types.every((item) => enabledTypes[item.id]);

    return (
      <div>
        <h3 className="settings-section-title">{category} Barcodes</h3>
        <div className="settings-group">
          <SettingSwitch
            label="Enable All"
            value={isAllEnabled}
            onValueChange={(value) => onEnableAll(value, category)}
          />
          {types.map((type, index) => (
            <SettingSwitch
              key={type.id}
              label={type.label}
              value={Boolean(enabledTypes[type.id])}
              onValueChange={(value) => onToggleType(type.id, value)}
              isLast={index === types.length - 1}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="settings-overlay">
      <img src={bgImage} alt="Background" className="page-background" />

      <div className="settings-header">
        <button className="icon-button" onClick={onClose}>
          <img src={chevron} alt="Back" className="chevron-icon" />
        </button>
        <h2>Settings</h2>
      </div>

      <div className="settings-scroll">
        <h3 className="settings-section-title">General Settings</h3>
        {renderSettingsGroup(generalSettings)}

        {decodingSettings.length > 0 && (
          <>
            <h3 className="settings-section-title">Decoding Settings</h3>
            {renderSettingsGroup(decodingSettings)}
          </>
        )}

        {renderBarcodeGroup('1D')}
        {renderBarcodeGroup('2D')}

        <button className="settings-reset" onClick={onResetConfig}>
          Reset All Settings
        </button>
      </div>
    </div>
  );
}
