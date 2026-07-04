import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;