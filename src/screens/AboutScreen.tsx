import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Device } from '@capacitor/device';
import { Barkoder } from 'barkoder-capacitor';
import bgImage from '../assets/images/BG.svg';
import logoBarkoder from '../assets/images/logo_barkoder.svg';
import chevron from '../assets/icons/chevron.svg';
import { barkoderService } from '../services/barkoderService';

export default function AboutScreen() {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState('');
  const [sdkVersion, setSdkVersion] = useState('1.6.7');
  const [libVersion, setLibVersion] = useState('React 19');

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const id = await Device.getId();
        setDeviceId(id.identifier);
      } catch (error) {
        console.error(error);
      }

      if (barkoderService.isNativePlatform) {
        try {
          const sdk = await Barkoder.getVersion();
          const lib = await Barkoder.getLibVersion();
          setSdkVersion(String(sdk.version ?? sdk.getVersion ?? '1.6.7'));
          setLibVersion(String(lib.libVersion ?? lib.getLibVersion ?? 'unknown'));
        } catch (error) {
          console.error(error);
        }
      }
    };

    void loadInfo();
  }, []);

  return (
    <div className="page">
      <img src={bgImage} alt="Background" className="page-background" />

      <div className="page-content">
        <header className="about-header">
          <button className="icon-button" onClick={() => navigate(-1)}>
            <img src={chevron} alt="Back" className="chevron-icon" />
          </button>
          <img src={logoBarkoder} alt="barKoder" className="about-logo" />
        </header>

        <div className="about-scroll">
          <section className="about-card">
            <h2>Barcode Scanner SDK by barKoder</h2>
            <p>
              <a href="https://barkoder.com/" target="_blank" rel="noreferrer">
                Barcode Scanner Demo by barKoder
              </a>{' '}
              showcases the enterprise-grade performance of the barKoder Barcode Scanner SDK along
              with most of its features in a wide variety of scanning scenarios.
            </p>
            <p>
              Whether from{' '}
              <a
                href="https://barkoder.com/barcode-types#1D-barcodes"
                target="_blank"
                rel="noreferrer"
              >
                One-Dimensional
              </a>{' '}
              or{' '}
              <a
                href="https://barkoder.com/barcode-types#2D-barcodes"
                target="_blank"
                rel="noreferrer"
              >
                Two-Dimensional
              </a>{' '}
              barcodes, the barKoder API captures data reliably and quickly.
            </p>
            <a href="https://barkoder.com/trial" target="_blank" rel="noreferrer" className="about-cta">
              Get a free trial demo
            </a>
          </section>

          <section className="about-card">
            <h2>Info</h2>
            <div className="about-info-row">
              <span>Device ID</span>
              <span>{deviceId || '-'}</span>
            </div>
            <div className="about-divider" />
            <div className="about-info-row">
              <span>App Version</span>
              <span className="about-accent">0.0.1</span>
            </div>
            <div className="about-divider" />
            <div className="about-info-row">
              <span>SDK Version</span>
              <span>{sdkVersion}</span>
            </div>
            <div className="about-divider" />
            <div className="about-info-row">
              <span>Lib Version</span>
              <span>{libVersion}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}