import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Plus, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

const Header = ({ onMenuClick }) => {
    const { user, profile, logout } = useAuth();
    const { notifications } = useData();
    const navigate = useNavigate();
    const [logoutLoading, setLogoutLoading] = useState(false);
    const isAdmin = (user?.role?.toUpperCase() === 'ADMIN') || (profile?.role?.toUpperCase() === 'ADMIN');

    const handleLogout = async () => {
        if (logoutLoading) return;
        setLogoutLoading(true);
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("[Header] Logout error:", error);
            navigate('/login');
        } finally {
            setLogoutLoading(false);
        }
    };

    // Derived state for performance and real-time accuracy
    const notifCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[150] w-full gap-2">
            <div className="flex items-center min-w-0 flex-1">
                {/* Mobile Menu Button */}
                <button 
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-1 mr-2 hover:bg-gray-100 rounded-xl text-gray-500 shrink-0"
                >
                    <Menu size={24} />
                </button>

                {/* Greeting & Subtext */}
                <div className="flex flex-col min-w-0">
                    <h2 className="text-base md:text-xl font-black text-[#111834] tracking-tight truncate">
                        Good Morning, <span className="text-[#4F27E9]">{user?.full_name?.split(' ')[0] || 'Member'}!</span>
                    </h2>
                    <p className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Here's what's happening at Conference Room today.
                    </p>
                </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <button
                    onClick={() => {
                        if (isAdmin) {
                            navigate('/admin/rooms');
                            // Delay slightly to ensure page transition if needed
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('open-room-modal'));
                            }, 100);
                        } else {
                            window.dispatchEvent(new CustomEvent('open-booking-modal'));
                        }
                    }}
                    className="hidden sm:flex bg-[#4F27E9] text-white hover:bg-[#3D1DB3] h-10 px-6 items-center gap-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={16} />
                    <span className="hidden lg:inline">{isAdmin ? 'Add Room' : 'Quick Book'}</span>
                </button>

                <div className="relative">
                    <button
                        onClick={() => navigate('/user/notifications')}
                        className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#4F27E9] rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm"
                    >
                        <Bell size={20} />
                    </button>
                    {notifCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4F27E9] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                            {notifCount > 9 ? '9+' : notifCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-3 ml-1 md:ml-2 pl-2 md:pl-4 border-l border-gray-100">
                    <button
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 rounded-xl border border-red-100 transition-all"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
