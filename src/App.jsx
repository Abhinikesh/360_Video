import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary        from './components/ErrorBoundary'
import { ToastProvider }    from './components/ToastProvider'
import HomePage             from './pages/HomePage'
import LoginPage            from './pages/LoginPage'
import SignupPage           from './pages/SignupPage'
import DashboardPage        from './pages/DashboardPage'
import CreatePage           from './pages/CreatePage'
import SettingsPage         from './pages/SettingsPage'
import ProjectsPage         from './pages/ProjectsPage'
import HelpPage             from './pages/HelpPage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
          <Route path="/signup" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
          <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="/create" element={<ErrorBoundary><CreatePage /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          <Route path="/projects" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
          <Route path="/help" element={<ErrorBoundary><HelpPage /></ErrorBoundary>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
