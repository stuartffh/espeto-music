import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home';
import AdminTheme from './pages/AdminTheme';
import Payment from './pages/Payment';

// App principal com ThemeProvider e React Router
function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/admin/theme" element={<AdminTheme />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
