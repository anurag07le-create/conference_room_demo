import React, { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../assets/pucho_logo_login.png";

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Hidden on mobile by default */}
            <div className={`
                fixed inset-y-0 left-0 lg:relative z-[200] lg:z-[200]
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Responsive Header */}
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Scrollable Content Area */}

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10 custom-scrollbar">
                    <div className="w-full max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
