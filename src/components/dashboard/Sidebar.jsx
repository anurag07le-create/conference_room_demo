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
import { Settings as SettingsIcon, X, Mail, Building, Shield, Calendar, User } from 'lucide-react';

const Sidebar = ({ onClose }) => {
    const navigate = useNavigate();
    const { user, logout, profile } = useAuth();
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

    const userEmail = user?.email || 'admin@pucho.ai';
    const userName = profile?.full_name || user?.full_name || 'Admin User';
    const userDepartment = profile?.department || 'Not Set';
    const userRole = profile?.role || 'EMPLOYEE';
    const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

    const isAdmin = profile?.role?.toUpperCase() === 'ADMIN';
    const basePath = isAdmin ? '/admin' : '/user';

    const menuItems = [
        { name: 'Dashboard', icon: HomeIcon, path: `${basePath}` },
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
            <aside className="w-[240px] h-screen bg-white border-r border-gray-100 flex flex-col shadow-lg lg:shadow-sm">
                {/* Mobile Close Button */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
                    <img src={logo} alt="Logo" className="h-8" />
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Desktop Logo Section */}
                <div className="hidden lg:flex px-6 h-[76px] items-center border-b border-gray-100/50">
                    <img src={logo} alt="Conference Room Booking" className="h-[34px] w-auto" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredMenuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={onClose}
                            end={item.path === basePath}
                            className={({ isActive }) => `
                                flex items-center gap-[10px] px-[12px] h-[40px] rounded-[22px] text-[14px] font-medium transition-all duration-200 border
                                ${isActive
                                    ? 'bg-[rgba(79,39,233,0.08)] border-[rgba(79,39,233,0.15)] text-[#4F27E9] font-semibold'
                                    : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-100 hover:text-gray-900'
                                }
                            `}
                        >
                            {item.isLucide ? (() => {
                                const Icon = item.icon;
                                return <Icon size={20} className="opacity-70 transition-all text-current" />;
                            })() : (
                                <img
                                    src={item.icon}
                                    alt={item.name}
                                    className={`w-5 h-5 object-contain transition-all`}
                                    style={{ opacity: 0.7 }}
                                />
                            )}
                            <span className="truncate">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile (Bottom) */}
                <div className="p-4 border-t border-gray-100 space-y-2">
                    <button
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-3xl text-[14px] font-medium text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                    >
                        <img src={LogoutIcon} alt="Logout" className="w-5 h-5 object-contain opacity-80 pointer-events-none" />
                        <span className="truncate">{logoutLoading ? 'Signing out...' : 'Log out'}</span>
                    </button>

                    <div 
                        onClick={() => setShowProfile(true)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                    >
                        <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
                            alt="User"
                            className="w-8 h-8 rounded-full bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
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
