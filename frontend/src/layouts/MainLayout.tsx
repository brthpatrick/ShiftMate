import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function MainLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems = [
        { label: 'Dashboard', path: '/' },
        { label: 'Employees', path: '/employees' },
        { label: 'Shifts', path: '/shifts' },
        { label: 'Assignments', path: '/assignments' },
        { label: 'Availability', path: '/availability' },
        { label: 'Leave Requests', path: '/leave-requests' },
        { label: 'Employee Preferences', path: '/employee-preferences' },
        { label: 'Employee Day Preferences', path: '/employee-day-preferences' },
        { label: 'Roles', path: '/roles' },
        { label: 'Employee Roles', path: '/employee-roles' },
        { label: 'Departments', path: '/departments' },
        { label: 'Locations', path: '/locations' },
    ]

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="flex w-64 flex-col border-r bg-white">
                <div className="border-b px-6 py-5">
                    <h1 className="text-xl font-bold text-gray-900">
                        ShiftMate
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Workforce Management
                    </p>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `block rounded-lg px-4 py-3 text-sm font-medium transition ${isActive
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t p-4">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="border-b bg-white px-8 py-5">
                    <h2 className="text-lg font-semibolt text-gray-900">
                        ShiftMate
                    </h2>
                </header>

                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout