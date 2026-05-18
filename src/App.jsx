import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './screens/Landing.jsx';
import MoodSelection from './screens/MoodSelection.jsx';
import Results from './screens/Results.jsx';
import PreferenceFlow from './screens/PreferenceFlow.jsx';
import Menu from './screens/Menu.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Staff from './screens/Staff.jsx';
import StaffOrders from './screens/StaffOrders.jsx';
import StockOpname from './screens/StockOpname.jsx';
import Login from './screens/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mood" element={<ProtectedRoute><MoodSelection /></ProtectedRoute>} />
      <Route path="/preferences" element={<ProtectedRoute><PreferenceFlow /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/stock" element={<ProtectedRoute role="admin"><StockOpname layout="admin" /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute role={["admin","owner"]}><Staff /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute role="staff"><StaffOrders /></ProtectedRoute>} />
      <Route path="/staff/orders" element={<ProtectedRoute role="staff"><StaffOrders /></ProtectedRoute>} />
      <Route path="/staff/stock" element={<ProtectedRoute role="staff"><StockOpname /></ProtectedRoute>} />
    </Routes>
  );
}