import cameraSwitch from '../assets/icons/camera_switch.svg';
import flashOff from '../assets/icons/flash_off.svg';
import flashOn from '../assets/icons/flash_on.svg';
import zoomIn from '../assets/icons/zoom_in.svg';
import zoomOut from '../assets/icons/zoom_out.svg';

interface BottomControlsProps {
  activeBarcodeText: string;
  zoomLevel: number;
  isFlashOn: boolean;
  showButtons?: boolean;
  onToggleZoom: () => void;
  onToggleFlash: () => void;
  onToggleCamera: () => void;
}

export default function BottomControls({
  activeBarcodeText,
  zoomLevel,
  isFlashOn,
  showButtons = true,
  onToggleZoom,
  onToggleFlash,
  onToggleCamera,
}: BottomControlsProps) {
  return (
    <div className="scanner-controls-wrap">
      {activeBarcodeText && <div className="scanner-types-pill">{activeBarcodeText}</div>}

      {showButtons && (
        <div className="scanner-controls-row">
          <button className="scanner-control-btn" onClick={onToggleZoom}>
            <img src={zoomLevel === 1 ? zoomIn : zoomOut} alt="Zoom" />
          </button>

          <button className="scanner-control-btn" onClick={onToggleFlash}>
            <img src={isFlashOn ? flashOff : flashOn} alt="Flash" />
          </button>

          <button className="scanner-control-btn" onClick={onToggleCamera}>
            <img src={cameraSwitch} alt="Camera" />
          </button>
        </div>
      )}
    </div>
  );
}
