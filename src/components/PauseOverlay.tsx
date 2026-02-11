import touchIcon from '../assets/icons/touch_icon.svg';

interface PauseOverlayProps {
  onResume: () => void;
  isSheetExpanded?: boolean;
  frozenImage?: string | null;
}

export default function PauseOverlay({ onResume, isSheetExpanded = false, frozenImage }: PauseOverlayProps) {
  return (
    <button
      className={`pause-overlay ${isSheetExpanded ? 'pause-overlay-expanded' : ''}`}
      onClick={onResume}
      aria-label="Resume scanning"
    >
      {frozenImage && <img className="pause-preview-image" src={frozenImage} alt="Last scanned frame" />}
      <span className="pause-message">
        <img src={touchIcon} alt="Touch" />
        <span>Tap anywhere to continue</span>
      </span>
    </button>
  );
}
