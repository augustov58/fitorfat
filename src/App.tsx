import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Landing } from './components/Landing';
import { UserSelect } from './components/UserSelect';
import { Dashboard } from './components/Dashboard';

function AutoRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const groupId = localStorage.getItem('fitorfat_group_id');
    const userId = localStorage.getItem('fitorfat_user_id');
    
    if (groupId && userId) {
      navigate(`/group/${groupId}/dashboard`);
    } else if (groupId) {
      navigate(`/group/${groupId}`);
    }
  }, [navigate]);

  return <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AutoRedirect />} />
        <Route path="/group/:groupId" element={<UserSelect />} />
        <Route path="/group/:groupId/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
