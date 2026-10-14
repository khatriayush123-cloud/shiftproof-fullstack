import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ShiftProvider } from './context/ShiftContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import SetupScreen from './screens/SetupScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import AddShiftScreen from './screens/AddShiftScreen.jsx';
import CheckShiftScreen from './screens/CheckShiftScreen.jsx';
import ResultScreen from './screens/ResultScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import PrivacyScreen from './screens/PrivacyScreen.jsx';
import PayScreen from './screens/PayScreen.jsx';
import GuideScreen from './screens/GuideScreen.jsx';

function Guarded({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ShiftProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Guarded><AuthScreen /></Guarded>} />
              <Route path="/setup" element={<Guarded><SetupScreen /></Guarded>} />
              <Route path="/dashboard" element={<Guarded><DashboardScreen /></Guarded>} />
              <Route path="/add-shift" element={<Guarded><AddShiftScreen /></Guarded>} />
              <Route path="/check-shift" element={<Guarded><CheckShiftScreen /></Guarded>} />
              <Route path="/result" element={<Guarded><ResultScreen /></Guarded>} />
              <Route path="/history" element={<Guarded><HistoryScreen /></Guarded>} />
              <Route path="/privacy" element={<Guarded><PrivacyScreen /></Guarded>} />
              <Route path="/pay" element={<Guarded><PayScreen /></Guarded>} />
              <Route path="/guide" element={<Guarded><GuideScreen /></Guarded>} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </BrowserRouter>
        </ShiftProvider>
      </AuthProvider>
    </ToastProvider>
  );
}



