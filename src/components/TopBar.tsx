import { MdClose, MdSettings } from 'react-icons/md';
import logoBarkoder from '../assets/images/logo_barkoder.svg';
import logoBarkoderWhite from '../assets/images/logo_barkoder_white.svg';

interface TopBarProps {
  onMenuPress?: () => void;
  onClose?: () => void;
  logoPosition?: 'left' | 'center';
  transparent?: boolean;
}

export default function TopBar({
  onMenuPress,
  onClose,
  logoPosition = 'center',
  transparent = false,
}: TopBarProps) {
  const iconColor = transparent ? '#ffffff' : '#000000';
  const logoSrc = transparent ? logoBarkoderWhite : logoBarkoder;

  return (
    <div className="topbar">
      <div className="topbar-side">
        {logoPosition === 'left' ? (
          <img src={logoSrc} alt="barKoder" className="topbar-logo" />
        ) : (
          onClose && (
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <MdClose size={28} color={iconColor} />
            </button>
          )
        )}
      </div>

      {logoPosition !== 'left' && <img src={logoSrc} alt="barKoder" className="topbar-logo" />}

      <div className="topbar-side topbar-side-right">
        {onMenuPress && (
          <button className="icon-button" onClick={onMenuPress} aria-label="Settings">
            <MdSettings size={28} color={iconColor} />
          </button>
        )}
      </div>
    </div>
  );
}