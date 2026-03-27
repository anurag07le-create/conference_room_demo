import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import logo from '../../assets/pucho_logo_login.png';

// Custom Icon Imports
import HomeIcon from '../../assets/icons/Property 2=Grid, Property 1=Default.png';
import AgentsIcon from '../../assets/icons/agents.svg';
import ChatIcon from '../../assets/icons/chat.svg';
import FlowsIcon from '../../assets/icons/flows.svg';
import ActivityIcon from '../../assets/icons/activity.svg';
import McpIcon from '../../assets/icons/mcp.svg';
import KnowledgeIcon from '../../assets/icons/knowledge.svg';
import ToolsIcon from '../../assets/icons/tools.svg';
import MarketplaceIcon from '../../assets/icons/marketplace.svg';
import LogoutIcon from '../../assets/icons/logout.svg';
import BellIcon from '../../assets/icons/search.svg';
import { Settings as SettingsIcon, X, Mail, Building, Shield, Calendar, User, Rocket, LayoutDashboard, LogOut } from 'lucide-react';

const Sidebar = ({ onClose }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const { showToast } = useToast();

    const handleLogout = async () => {
        if (logoutLoading) return;
        setLogoutLoading(true);
        showToast("Signing out...", "info");
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error("[Sidebar] Logout error:", error);
            navigate('/login', { replace: true });
        } finally {
            setLogoutLoading(false);
        }
    };

    const userEmail = user?.email || 'user@pucho.ai';
    const userName = user?.full_name || 'Pucho User';
    const userDepartment = user?.department || 'Member';
    const userRole = user?.role || 'EMPLOYEE';
    const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const basePath = isAdmin ? '/admin' : '/user';

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: `${basePath}`, isLucide: true },
        { name: 'Rooms', icon: AgentsIcon, path: `${basePath}/rooms`, adminOnly: true },
        { name: 'Bookings', icon: FlowsIcon, path: `${basePath}/bookings` },
        { name: 'Meeting Minutes', icon: KnowledgeIcon, path: `${basePath}/minutes` },
        { name: 'Users', icon: ChatIcon, path: `${basePath}/users`, adminOnly: true },
        { name: 'Notifications', icon: BellIcon, path: `${basePath}/notifications` },
        { name: 'Settings', icon: SettingsIcon, path: `${basePath}/settings`, isLucide: true },
    ];

    const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <>
            <aside className="w-[260px] h-screen bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col shadow-sm relative z-30">
                {/* Mobile Close Button */}
                <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-100">
                    <img src={logo} alt="Logo" className="h-8" />
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Desktop Logo Section */}
                <div className="hidden lg:flex px-8 h-20 items-center border-b border-gray-50">
                    <img src={logo} alt="Conference Room Booking" className="h-8 w-auto" />
                </div>

                {/* Navigation */}
                <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Main Menu</p>
                    <nav className="space-y-1">
                        {filteredMenuItems.map((item) => (
                            <NavLink
                                key={item.name}
                                  to={item.path}
                                onClick={onClose}
                                end={item.path === basePath}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 h-[44px] rounded-2xl text-[14px] font-semibold transition-all duration-300
                                    ${isActive
                                        ? 'bg-[#4F27E9] text-white shadow-lg shadow-indigo-100 nav-active-pill'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                `}
                            >
                                {item.isLucide ? (() => {
                                    const Icon = item.icon;
                                    return <Icon size={18} className="transition-all" />;
                                })() : (
                                    <img
                                        src={item.icon}
                                        alt={item.name}
                                        className={`w-[18px] h-[18px] object-contain transition-all ${item.name === 'Dashboard' ? 'brightness-0 invert' : ''}`}
                                        style={item.name === 'Dashboard' ? {} : { opacity: 0.6 }}
                                    />
                                )}
                                <span className="truncate">{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* User Profile (Bottom) */}
                <div className="p-6 border-t border-gray-50 space-y-4">
                    <div 
                        onClick={() => setShowProfile(true)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100 group"
                    >
                        <div className="relative">
                            <img
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
                                alt="User"
                                className="w-10 h-10 rounded-xl bg-white shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                            <p className="text-[11px] text-gray-500 truncate font-medium uppercase tracking-wider">{userRole}</p>
                        </div>
                    </div>

                </div>
            </aside>

            {/* Profile Modal - Use createPortal to break out of sidebar transform container */}
            {showProfile && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowProfile(false)}>
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100" onClick={e => e.stopPropagation()}>
                        {/* Header with Background Gradient */}
                        <div className="bg-[#4F27E9] p-8 text-white relative">
                            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all active:scale-90">
                                <X size={20} className="text-white" />
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt="User" className="w-24 h-24 rounded-[32px] bg-white/20 border-4 border-white/30 shadow-xl" />
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-[#4F27E9] rounded-xl flex items-center justify-center shadow-lg">
                                        <Shield size={16} />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">{userName}</h2>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-3 bg-white/20 backdrop-blur-md">
                                        {userRole}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Info Details */}
                        <div className="p-8 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#4F27E9] shadow-sm">
                                    <Mail size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact Email</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{userEmail}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#4F27E9] shadow-sm">
                                    <Building size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Department</p>
                                    <p className="text-sm font-bold text-gray-900">{userDepartment}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#4F27E9] shadow-sm">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Member Since</p>
                                    <p className="text-sm font-bold text-gray-900">{createdAt}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 pb-8 space-y-3">
                            <button 
                                onClick={() => { setShowProfile(false); navigate(`${basePath}/settings`); }} 
                                className="w-full h-14 bg-[#4F27E9] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-[#3D1DB3] transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Edit System Profile
                            </button>
                            <button 
                                onClick={() => { setShowProfile(false); handleLogout(); }} 
                                className="w-full h-14 border-2 border-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-50 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <img src={LogoutIcon} alt="Logout" className="w-4 h-4 object-contain brightness-0 saturate-100 invert-[21%] sepia-[100%] saturate-[5000%] hue-rotate-[0deg]" />
                                Final Sign Out
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Sidebar;
