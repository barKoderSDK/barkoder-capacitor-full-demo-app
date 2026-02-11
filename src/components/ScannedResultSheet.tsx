import { useState } from 'react';
import { MdClose, MdInfoOutline } from 'react-icons/md';
import iconCopy from '../assets/icons/icon_copy.svg';
import iconCsv from '../assets/icons/icon_csv.svg';
import iconExpand from '../assets/icons/expand_all.svg';
import type { ScannedItem } from '../types/types';

interface ScannedResultSheetProps {
  scannedItems: ScannedItem[];
  lastScanCount?: number;
  onCopy: () => void;
  onCSV: () => void;
  onDetails: (item: ScannedItem) => void;
  showResultSheet?: boolean;
  onClose: () => void;
  onExpandedChange?: (expanded: boolean) => void;
}

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

const findMrzField = (fields: Array<{ id: string; label: string; value: string }>, keys: string[]) => {
  const loweredKeys = keys.map((key) => key.toLowerCase());
  return fields.find((field) => {
    const haystack = `${field.id} ${field.label}`.toLowerCase();
    return loweredKeys.some((key) => haystack.includes(key));
  });
};

const getDisplayText = (item: ScannedItem): string => {
  if (item.type.toLowerCase() !== 'mrz') {
    return item.text;
  }

  const mrzFields = parseMrzData(item.text);
  const mrzName = findMrzField(mrzFields, ['name', 'given name', 'forename']);
  const mrzSurname = findMrzField(mrzFields, ['surname', 'last name', 'family name']);
  const nameParts = [mrzName?.value, mrzSurname?.value].filter(Boolean);

  return nameParts.length > 0 ? nameParts.join(' ') : 'Name/Surname not found';
};

export default function ScannedResultSheet({
  scannedItems,
  lastScanCount,
  onCopy,
  onCSV,
  onDetails,
  showResultSheet = true,
  onClose,
  onExpandedChange,
}: ScannedResultSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (scannedItems.length === 0 || !showResultSheet) {
    return null;
  }

  const uniqueItems = scannedItems.reduce<ScannedItem[]>((acc, item) => {
    if (!acc.some((candidate) => candidate.text === item.text)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const totalCount = scannedItems.length;
  const uniqueCount = uniqueItems.length;
  const scanCount = lastScanCount && lastScanCount > 0 ? lastScanCount : uniqueCount;

  const toggleExpanded = (next: boolean) => {
    setIsExpanded(next);
    onExpandedChange?.(next);
  };

  const content = (
    <>
      <div className="result-sheet-header">
        <span>
          {scanCount} result{scanCount === 1 ? '' : 's'} found ({totalCount} total)
        </span>
        <button className="icon-button" onClick={onClose}>
          <MdClose size={20} color="#6C757D" />
        </button>
      </div>

      <div className={`result-sheet-list ${isExpanded ? 'result-sheet-list-expanded' : ''}`}>
        {uniqueItems.map((item, index) => {
          const count = scannedItems.filter((entry) => entry.text === item.text).length;
          return (
            <button
              key={`${item.text}-${index}`}
              className={`result-sheet-item ${index === 0 ? 'result-sheet-item-primary' : ''}`}
              onClick={() => onDetails(item)}
            >
              <div>
                <div className="result-sheet-type">{item.type}</div>
                <div className="result-sheet-text">{getDisplayText(item)}</div>
              </div>
              <div className="result-sheet-meta">
                {count > 1 && <span>({count})</span>}
                <MdInfoOutline size={18} color="#6C757D" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="result-sheet-actions">
        <button className="result-action" onClick={onCopy}>
          <img src={iconCopy} alt="Copy" />
          <span>Copy</span>
        </button>
        <button className="result-action" onClick={onCSV}>
          <img src={iconCsv} alt="CSV" />
          <span>CSV</span>
        </button>
        <button className="result-action" onClick={() => toggleExpanded(!isExpanded)}>
          <img src={iconExpand} alt="Expand" />
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="result-sheet">{content}</div>
      {isExpanded && (
        <div className="result-sheet-modal">
          <div className="result-sheet-modal-content">{content}</div>
        </div>
      )}
    </>
  );
}
