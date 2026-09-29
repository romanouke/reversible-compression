import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout.jsx'
import { LandingPage } from './pages/LandingPage.jsx'
import { CompressPage } from './pages/CompressPage.jsx'
import { DecompressPage } from './pages/DecompressPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { AboutPage } from './pages/AboutPage.jsx'
import { DocsPage } from './pages/DocsPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="compress" element={<CompressPage />} />
        <Route path="decompress" element={<DecompressPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App