import React, { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import ChatWidget from "../components/dashboard/ChatWidget";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";

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
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center gap-4 p-4 bg-white border-b border-gray-100 z-[150]">
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <img src="/src/assets/pucho_logo_login.png" alt="Logo" className="h-8" />
                </div>

                {/* Desktop Header: Sticky Top */}
                <div className="hidden lg:block relative z-[150]">
                    <Header />
                </div>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10 custom-scrollbar">
                    <div className="w-full max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Chat Bot Widget */}
                <ChatWidget />
            </div>
        </div>
    );
};

export default AdminDashboard;
