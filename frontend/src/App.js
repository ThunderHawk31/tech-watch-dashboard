import { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from 'react-helmet-async';
import { OfflineIndicator } from './components/InstallPrompt';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import { InstallPWA } from './components/InstallPWA';
import { ThemeProvider } from './contexts/ThemeContext';
import { LangProvider } from './contexts/LangContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { HeaderNew as Header } from './components/HeaderNew';
import MentionsLegales from './MentionsLegales';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FavoritesPage from './pages/FavoritesPage';
import TendancesPage from './pages/TendancesPage';
import ChatWidget from './components/ChatWidget';
import ErrorBoundary from './components/ErrorBoundary';
import NotFoundPage from './pages/NotFoundPage';

const StatsPage      = lazy(() => import('./StatsPage'));
const MonitoringPage = lazy(() => import('./pages/MonitoringPage'));

function App() {

  return (
    <div className="App min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/stats"
            element={
              <Suspense fallback={
                <div className="container mx-auto px-4 py-8">
                  <div className="animate-pulse">
                    <div className="h-10 w-64 bg-gray-700 rounded mb-8"></div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="h-80 bg-gray-700 rounded"></div>
                      <div className="h-80 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              }>
                <StatsPage />
              </Suspense>
            }
          />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/tendances" element={<TendancesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route
            path="/monitoring"
            element={
              <Suspense fallback={
                <div className="container mx-auto px-4 py-8">
                  <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-gray-700 rounded" />
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="h-40 bg-gray-700 rounded-xl" />
                      <div className="h-40 bg-gray-700 rounded-xl" />
                    </div>
                    <div className="h-64 bg-gray-700 rounded-xl" />
                  </div>
                </div>
              }>
                <MonitoringPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function AppWrapper() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <OfflineIndicator />
        <ThemeProvider>
          <LangProvider>
            <FavoritesProvider>
              <IOSInstallPrompt />
              <InstallPWA />
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
              <Toaster position="top-right" richColors />
              <ChatWidget />
            </FavoritesProvider>
          </LangProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default AppWrapper;
