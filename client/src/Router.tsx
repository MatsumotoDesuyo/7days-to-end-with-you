import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import { I18nProvider } from './i18n';

export default function Router() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
