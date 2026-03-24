import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Rooms from "./pages/Rooms";
import Users from "./pages/Users";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import MeetingMinutes from "./pages/MeetingMinutes";
import { DataProvider } from "./context/DataContext";

const LoadingScreen = () => (
    <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fc',
        gap: '20px'
    }}>
        <img src="/src/assets/pucho_logo_login.png" alt="Logo" style={{ height: '40px' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #4F27E920',
            borderTopColor: '#4F27E9',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
    </div>
);

const ProtectedRoute = ({ children, allowedRole = null }) => {
    const { user, profile, loading } = useAuth();

    // Wait for auth to finish initializing before making any routing decisions
    if (loading) return <LoadingScreen />;

    if (!user) return <Navigate to="/login" replace />;
    
    // If a specific role is required (e.g. ADMIN), wait for profile to load too
    if (allowedRole) {
        if (!profile) return <LoadingScreen />; // Profile still being fetched
        if (profile.role?.toUpperCase() !== allowedRole.toUpperCase()) {
            return <Navigate to="/user" replace />;
        }
    }
    
    return children;
};

const PublicRoute = ({ children }) => {
    const { user, profile, loading } = useAuth();

    // Wait for auth to finish initializing
    if (loading) return <LoadingScreen />;
    
    if (user && profile) {
        // Only redirect once we know the profile (and thus the role)
        const target = profile.role?.toUpperCase() === 'ADMIN' ? "/admin" : "/user";
        return <Navigate to={target} replace />;
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <DataProvider>
                        <Routes>
                            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                            
                            {/* Admin Routes */}
                            <Route path="/admin" element={
                                <ProtectedRoute allowedRole="ADMIN">
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }>
                                <Route index element={<Dashboard />} />
                                <Route path="bookings" element={<Bookings />} />
                                <Route path="rooms" element={<Rooms />} />
                                <Route path="users" element={<Users />} />
                                <Route path="minutes" element={<MeetingMinutes />} />
                                <Route path="notifications" element={<Notifications />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>

                            {/* Employee Routes */}
                            <Route path="/user" element={
                                <ProtectedRoute>
                                    <AdminDashboard /> {/* Reusing AdminDashboardLayout for sidebar/header, its components handle role visibility */}
                                </ProtectedRoute>
                            }>
                                <Route index element={<Dashboard />} />
                                <Route path="bookings" element={<Bookings />} />
                                <Route path="rooms" element={<Rooms />} />
                                <Route path="minutes" element={<MeetingMinutes />} />
                                <Route path="notifications" element={<Notifications />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>

                            <Route path="/dashboard" element={<Navigate to="/user" replace />} />
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </DataProvider>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}

export default App;
