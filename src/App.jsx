import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useSession } from './lib/auth.jsx';
import { LangProvider } from './lib/i18n.jsx';
import Layout from './components/Layout.jsx';
import { LightboxProvider } from './components/Lightbox.jsx';
import { Loading } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Competitors from './pages/Competitors.jsx';
import AppPage from './pages/AppPage.jsx';
import Changes from './pages/Changes.jsx';

function Gate() {
  const session = useSession();
  if (session === undefined) return <Loading />;
  if (!session) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Competitors />} />
        <Route path="app/:id" element={<AppPage />} />
        <Route path="changes" element={<Changes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <LightboxProvider>
            <Gate />
          </LightboxProvider>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
