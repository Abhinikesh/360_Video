import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage      from './pages/HomePage'
import LoginPage     from './pages/LoginPage'
import SignupPage    from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import CreatePage    from './pages/CreatePage'
import SettingsPage  from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/signup"    element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create"    element={<CreatePage />} />
        <Route path="/settings"  element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
