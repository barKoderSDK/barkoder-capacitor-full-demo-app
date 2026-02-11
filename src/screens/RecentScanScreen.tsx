import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/images/BG.svg';
import chevron from '../assets/icons/chevron.svg';
import iconInfo from '../assets/icons/info.svg';
import icon1D from '../assets/icons/icon_1d.svg';
import icon2D from '../assets/icons/icon_2d.svg';
import { HistoryService } from '../services/HistoryService';
import type { HistoryItem } from '../types/types';
import { is1D } from '../utils/barcodeUtils';

export default function RecentScanScreen() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      const data = await HistoryService.getHistory();
      setHistory(data);
      setIsLoading(false);
    };

    void loadHistory();
  }, []);

  const grouped = useMemo(() => {
    return history.reduce<Record<string, HistoryItem[]>>((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString('en-GB');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});
  }, [history]);

  return (
    <div className="page">
      <img src={bgImage} alt="Background" className="page-background" />
      <div className="page-content">
        <header className="screen-header">
          <button className="icon-button" onClick={() => navigate(-1)}>
            <img src={chevron} alt="Back" className="chevron-icon" />
          </button>
          <h1>Recent Scans</h1>
        </header>

        {isLoading ? (
          <div className="loading-wrap">Loading...</div>
        ) : (
          <div className="history-scroll">
            {Object.entries(grouped).map(([date, items]) => (
              <section key={date} className="history-section">
                <h2 className="history-date">{date}</h2>

                {items.map((item, index) => (
                  <div key={`${item.text}-${index}`} className="history-item">
                    <div className="history-item-left">
                      {item.image ? (
                        <img src={item.image} alt="Scanned" className="history-thumb" />
                      ) : (
                        <div className="history-thumb history-thumb-placeholder">
                          <img src={is1D(item.type) ? icon1D : icon2D} alt="Barcode type" />
                        </div>
                      )}

                      <div>
                        <p className="history-text">{item.text}</p>
                        <p className="history-type">{item.type}</p>
                      </div>
                    </div>

                    <div className="history-item-right">
                      {item.count > 1 && <span>({item.count})</span>}
                      <button
                        className="icon-button"
                        onClick={() => navigate('/details', { state: { item } })}
                      >
                        <img src={iconInfo} alt="Details" className="bottom-tab-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}