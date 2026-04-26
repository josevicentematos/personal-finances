import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { SummaryPage } from './pages/SummaryPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AccountsPage } from './pages/AccountsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { RecurringPage } from './pages/RecurringPage'
import { ProductsPage } from './pages/ProductsPage'
import { SettingsPage } from './pages/SettingsPage'
import { CalendarPage } from './pages/CalendarPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ErrorBoundary><SummaryPage /></ErrorBoundary>} />
        <Route path="transactions" element={<ErrorBoundary><TransactionsPage /></ErrorBoundary>} />
        <Route path="accounts" element={<ErrorBoundary><AccountsPage /></ErrorBoundary>} />
        <Route path="categories" element={<ErrorBoundary><CategoriesPage /></ErrorBoundary>} />
        <Route path="recurrents" element={<ErrorBoundary><RecurringPage /></ErrorBoundary>} />
        <Route path="products" element={<ErrorBoundary><ProductsPage /></ErrorBoundary>} />
        <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
        <Route path="calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
