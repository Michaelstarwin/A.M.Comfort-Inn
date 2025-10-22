import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Gallery from './pages/Gallery.jsx';
import Booking from './pages/Booking.jsx';
import { PaymentStatus } from './pages/Booking/PaymentStatus.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import { AdminLoginPrompt } from './components/admin/AdminLoginPrompt.jsx';

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/payment-status" element={<PaymentStatus />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
