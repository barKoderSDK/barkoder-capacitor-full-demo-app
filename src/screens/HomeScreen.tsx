import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/images/BG.svg';
import { SECTIONS } from '../constants/constants';
import HomeGrid from '../components/HomeGrid';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import { barkoderService } from '../services/barkoderService';

export default function HomeScreen() {
  const navigate = useNavigate();

  const handlePress = (item: (typeof SECTIONS)[number]['data'][number]) => {
    if (item.action === 'url' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }

    navigate(`/scanner/${item.mode}/${Date.now()}`);
  };

  return (
    <div className="page home-page">
      <img src={bgImage} alt="Background" className="page-background" />
      <div className="page-content">
        <TopBar logoPosition="left" />

        {!barkoderService.isNativePlatform && (
          <div className="native-banner">Scanner and gallery scanning work on iOS/Android Capacitor builds.</div>
        )}
        <HomeGrid sections={SECTIONS} onItemPress={handlePress} />

        <BottomBar />
      </div>
    </div>
  );
}
