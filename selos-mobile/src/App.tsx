import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Stock } from './pages/Stock';
import { CreateDeliveryNote } from './pages/CreateDeliveryNote';
import { ReviewDeliveryNote } from './pages/ReviewDeliveryNote';
import { DeliveryNotesList } from './pages/DeliveryNotesList';
import { DeliveryNotesByDate } from './pages/DeliveryNotesByDate';
import { SalesByDate } from './pages/SalesByDate';
import { Profile } from './pages/Profile';
import { ProductPrices } from './pages/ProductPrices';
import { CreateReturnInvoice } from './pages/CreateReturnInvoice';
import { ReturnInvoicesList } from './pages/ReturnInvoicesList';
import { ReturnInvoiceDetail } from './pages/ReturnInvoiceDetail';
import { BottomNav } from './components/BottomNav';
import { useEffect } from 'react';
import { onOnline, onOffline } from './lib/api';
import { useAppStore } from './store/appStore';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

function App() {
  const { setOnline } = useAppStore();

  // Configurer la StatusBar pour les plateformes natives
  useEffect(() => {
    const initStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
          await StatusBar.show();
        } catch (error) {
          console.log('StatusBar not available:', error);
        }
      }
    };
    initStatusBar();
  }, []);

  useEffect(() => {
    // Écouter les changements de connectivité
    const unsubscribeOnline = onOnline(() => {
      setOnline(true);
    });

    const unsubscribeOffline = onOffline(() => {
      setOnline(false);
    });

    // Initialiser l'état
    setOnline(navigator.onLine);

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [setOnline]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Stock />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-notes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DeliveryNotesList />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-notes/by-date"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DeliveryNotesByDate />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-notes/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateDeliveryNote />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-notes/review"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ReviewDeliveryNote />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/product-prices"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProductPrices />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/return-invoices"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ReturnInvoicesList />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/return-invoices/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateReturnInvoice />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/return-invoices/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ReturnInvoiceDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/by-date"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SalesByDate />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
