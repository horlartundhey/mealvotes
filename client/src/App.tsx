import { Route, Routes } from 'react-router-dom';
import Create from './pages/Create';
import Dashboard from './pages/Dashboard';
import Join from './pages/Join';
import History from './pages/History';
import Landing from './pages/Landing';
import MealLibrary from './pages/MealLibrary';
import Preview from './pages/Preview';
import Today from './pages/Today';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<Create />} />
      <Route path="/join/:token" element={<Join />} />
      <Route path="/household/:householdId" element={<Dashboard />} />
      <Route path="/household/:householdId/meals" element={<MealLibrary />} />
      <Route path="/household/:householdId/today" element={<Today />} />
      <Route path="/household/:householdId/history" element={<History />} />
      <Route path="/preview" element={<Preview />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
