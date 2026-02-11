import { Navigate, Route, Routes } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import ScannerScreen from './screens/ScannerScreen';
import BarcodeDetailsScreen from './screens/BarcodeDetailsScreen';
import RecentScanScreen from './screens/RecentScanScreen';
import AboutScreen from './screens/AboutScreen';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/scanner/:mode/:sessionId?" element={<ScannerScreen />} />
      <Route path="/details" element={<BarcodeDetailsScreen />} />
      <Route path="/history" element={<RecentScanScreen />} />
      <Route path="/about" element={<AboutScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}