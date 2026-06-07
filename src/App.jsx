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
import Stock from './screens/Stock.jsx';
import StokMasuk from './screens/StokMasuk.jsx';
import Login from './screens/Login.jsx';
import Register from './screens/Register.jsx';
import OrderSummary from './screens/OrderSummary.jsx';
import OrderConfirm from './screens/OrderConfirm.jsx';
import OrderTracking from './screens/OrderTracking.jsx';
import Profile from './screens/Profile.jsx';
import Laporan from './screens/Laporan.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastProvider } from './components/Toast.jsx';

export default function App() {
  return (
    <ToastProvider>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/mood" element={<MoodSelection />} />
      <Route path="/preferences" element={<PreferenceFlow />} />
      <Route path="/results" element={<Results />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/order" element={<ProtectedRoute><OrderSummary /></ProtectedRoute>} />
      <Route path="/order/confirm" element={<ProtectedRoute><OrderConfirm /></ProtectedRoute>} />
      <Route path="/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role={["admin","owner"]}><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/stock" element={<ProtectedRoute role={["admin","owner"]}><Stock layout="admin" /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute role={["admin","owner"]}><Staff /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute role="staff"><StaffOrders /></ProtectedRoute>} />
      <Route path="/staff/orders" element={<ProtectedRoute role="staff"><StaffOrders /></ProtectedRoute>} />
      <Route path="/staff/stok-masuk" element={<ProtectedRoute role="staff"><StokMasuk /></ProtectedRoute>} />
      <Route path="/staff/stock" element={<ProtectedRoute role="staff"><Stock /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/staff/profile" element={<ProtectedRoute role="staff"><Profile /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute role={["admin","owner"]}><Profile /></ProtectedRoute>} />
      <Route path="/owner/laporan" element={<ProtectedRoute role="owner"><Laporan /></ProtectedRoute>} />
    </Routes>
    </ToastProvider>
  );
}