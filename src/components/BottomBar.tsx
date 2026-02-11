import { useNavigate } from 'react-router-dom';
import iconInfo from '../assets/icons/info.svg';
import iconRecent from '../assets/icons/recent.svg';
import iconStart from '../assets/icons/start.svg';
import { MODES } from '../constants/constants';

export default function BottomBar() {
  const navigate = useNavigate();

  return (
    <div className="bottom-bar">
      <button className="bottom-tab" onClick={() => navigate('/history')}>
        <img src={iconRecent} alt="Recent" className="bottom-tab-icon" />
        <span className="bottom-tab-label">Recent</span>
      </button>

      <div className="bottom-tab-center">
        <button
          className="bottom-fab"
          onClick={() => navigate(`/scanner/${MODES.ANYSCAN}/${Date.now()}`)}
          aria-label="Start"
        >
          <img src={iconStart} alt="Start" className="bottom-fab-icon" />
        </button>
        <span className="bottom-tab-label">Anyscan</span>
      </div>

      <button className="bottom-tab" onClick={() => navigate('/about')}>
        <img src={iconInfo} alt="About" className="bottom-tab-icon" />
        <span className="bottom-tab-label">About</span>
      </button>
    </div>
  );
}