import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import ShiftsPage from './pages/ShiftsPage'
import AssignmentsPage from './pages/AssignmentsPage'


function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {title}
      </h1>

      <p className="mt-2 text-gray-500">
        This page is under development.
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />

          <Route
            path="/employees"
            element={<EmployeesPage />}
          />

          <Route
            path="/shifts"
            element={<ShiftsPage />}
          />

          <Route
            path="/assignments"
            element={<AssignmentsPage />}
          />

          <Route
            path="/availability"
            element={<PlaceholderPage title="Availability" />}
          />

          <Route
            path="/leave-requests"
            element={<PlaceholderPage title="Leave Requests" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App