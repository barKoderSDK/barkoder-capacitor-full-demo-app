import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import bgImage from '../assets/images/BG.svg';
import chevron from '../assets/icons/chevron.svg';
import iconCopy from '../assets/icons/icon_copy.svg';
import iconSearch from '../assets/icons/icon_search.svg';
import icon1D from '../assets/icons/icon_1d.svg';
import icon2D from '../assets/icons/icon_2d.svg';
import type { ScannedItem } from '../types/types';
import { is1D } from '../utils/barcodeUtils';

const parseMrzData = (text: string) => {
  const fields: { id: string; label: string; value: string }[] = [];
  text.split('\n').forEach((line) => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      return;
    }
    const key = match[1].trim();
    const value = match[2].trim();
    const label = key
      .split('_')
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ');
    fields.push({ id: key, label, value });
  });
  return fields;
};

export default function BarcodeDetailsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { item?: ScannedItem; returnToHome?: boolean } | null) ?? null;
  const item = state?.item;
  const returnToHome = Boolean(state?.returnToHome);

  const handleBack = () => {
    if (returnToHome) {
      navigate('/', { replace: true });
      return;
    }
    navigate(-1);
  };

  useEffect(() => {
    if (!returnToHome || Capacitor.getPlatform() === 'web') {
      return;
    }

    let backButtonHandle: PluginListenerHandle | undefined;
    const setupBackHandler = async () => {
      backButtonHandle = await CapacitorApp.addListener('backButton', () => {
        navigate('/', { replace: true });
      });
    };

    void setupBackHandler();

    return () => {
      if (backButtonHandle) {
        void backButtonHandle.remove();
      }
    };
  }, [navigate, returnToHome]);

  const details = useMemo(() => {
    if (!item) {
      return [] as Array<{ id: string; label: string; value: string; multiline?: boolean }>;
    }

    if (item.type.toLowerCase() === 'mrz') {
      return [{ id: 'type', label: 'Barcode Type', value: item.type }, ...parseMrzData(item.text)];
    }

    return [
      { id: 'type', label: 'Barcode Type', value: item.type },
      { id: 'value', label: 'Value', value: item.text, multiline: true },
    ];
  }, [item]);

  if (!item) {
    return (
      <div className="page">
        <img src={bgImage} alt="Background" className="page-background" />
        <div className="page-content centered">
          <p>No barcode selected.</p>
          <button className="about-cta" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const onCopy = async () => {
    await navigator.clipboard.writeText(item.text);
  };

  const onSearch = () => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(item.text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page">
      <img src={bgImage} alt="Background" className="page-background" />

      <div className="page-content">
        <header className="screen-header">
          <button className="icon-button" onClick={handleBack}>
            <img src={chevron} alt="Back" className="chevron-icon" />
          </button>
          <h1>Barcode Details</h1>
        </header>

        <div className="details-scroll">
          <div className="details-image-card">
            {item.image ? (
              <img src={item.image} alt="Scanned barcode" className="details-image" />
            ) : (
              <div className="details-placeholder">
                <img src={is1D(item.type) ? icon1D : icon2D} alt="Barcode type" />
              </div>
            )}
          </div>

          <p className="details-section-label">DATA</p>

          {details.map((detail) => (
            <div key={detail.id} className="details-info-card">
              <span>{detail.label}</span>
              <span className={detail.multiline ? 'details-value-multiline' : ''}>{detail.value}</span>
            </div>
          ))}
        </div>

        <div className="details-bottom-bar">
          <button className="result-action" onClick={onCopy}>
            <img src={iconCopy} alt="Copy" />
            <span>Copy</span>
          </button>
          <button className="result-action" onClick={onSearch}>
            <img src={iconSearch} alt="Search" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
