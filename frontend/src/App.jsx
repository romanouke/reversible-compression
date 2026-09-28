import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LandingPage } from './pages/LandingPage'
import { CompressPage } from './pages/CompressPage'
import { DecompressPage } from './pages/DecompressPage'
import { HistoryPage } from './pages/HistoryPage'
import { AboutPage } from './pages/AboutPage'
import { DocsPage } from './pages/DocsPage'
import { SettingsPage } from './pages/SettingsPage'

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