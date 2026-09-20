import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import ShiftsPage from './pages/ShiftsPage'
import AssignmentsPage from './pages/AssignmentsPage'
import AvailabilityPage from './pages/AvailabilityPage'
import LeaveRequestsPage from './pages/LeaveRequestsPage'
import EmployeePreferencesPage from './pages/EmployeePreferencesPage'
import EmployeeDayPreferencesPage from './pages/EmployeeDayPreferencesPage'

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
            element={<AvailabilityPage />}
          />

          <Route
            path="/leave-requests"
            element={<LeaveRequestsPage />}
          />

          <Route
            path="/employee-preferences"
            element={<EmployeePreferencesPage />}
          />

          <Route
            path="/employee-day-preferences"
            element={<EmployeeDayPreferencesPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App