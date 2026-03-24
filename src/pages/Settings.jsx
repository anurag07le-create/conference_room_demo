import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Save, Clock, Calendar, CheckCircle, User, Mail, Phone, Lock, Camera, UploadCloud } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

const Settings = () => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    // Profile Information
    const [profileInfo, setProfileInfo] = useState({
        full_name: '',
        email: '',
        phone: '',
        department: '',
        bio: '',
        avatar_url: ''
    });

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Default Rules (UC-7)
    const [rules, setRules] = useState({
        max_duration: 120, // minutes
        min_duration: 15,
        advance_booking_days: 14,
        buffer_time: 10,
        require_approval: false
    });

    // Notification Preferences (UC-5) - synced with Supabase
    const [notifications, setNotifications] = useState({
        email_alerts: true,
        slack_sync: false,
        reminder_30min: true,
        daily_report: true
    });

    useEffect(() => {
        // Load settings from local storage
        const savedRules = localStorage.getItem('booking_rules');
        if (savedRules) setRules(JSON.parse(savedRules));

        // Sync with Auth session data immediately
        if (user) {
            setUserId(user.id);
            setProfileInfo(prev => ({
                ...prev,
                full_name: user.full_name || prev.full_name,
                email: user.email || '',
                department: user.department || prev.department
            }));
        }
    }, [user]);

    // Fetch profile and notification preferences from Supabase for latest data
    const fetchUserData = async () => {
        if (!userId) return;
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (data && !error) {
                setProfileInfo({
                    full_name: data.full_name || '',
                    email: user?.email || data.email || '',
                    phone: data.phone || '',
                    department: data.department || '',
                    bio: data.bio || '',
                    avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${data.full_name}`
                });
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    useEffect(() => {
        if (userId) fetchUserData();
    }, [userId]);

    const handleSaveProfile = async () => {
        setLoading(true);
        if (userId) {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: profileInfo.full_name,
                    phone: profileInfo.phone,
                    department: profileInfo.department,
                    bio: profileInfo.bio,
                    avatar_url: profileInfo.avatar_url
                })
                .eq('user_id', userId);
            
            if (error) {
                showToast("Failed to update profile", "error");
            } else {
                showToast("Profile updated successfully", "success");
            }
        }
        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (!passwords.newPassword || passwords.newPassword !== passwords.confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }
        
        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            password: passwords.newPassword
        });

        if (error) {
            showToast(error.message, "error");
        } else {
            showToast("Password updated successfully", "success");
            setPasswords({ newPassword: '', confirmPassword: '' });
        }
        setLoading(false);
    };

    const handleAvatarUpload = (e) => {
        // In a real app, you'd upload to Supabase Storage
        // For now, we simulate with a temporary URL or just show toast
        showToast("Photo upload simulation: In production, this would save to Supabase Storage", "info");
    };

    const handleSaveRules = () => {
        setLoading(true);
        localStorage.setItem('booking_rules', JSON.stringify(rules));
        setTimeout(() => {
            showToast("Global booking rules updated", "success");
            setLoading(false);
        }, 800);
    };

    const handleSaveNotifications = async () => {
        setLoading(true);
        
        // Save to localStorage as backup
        localStorage.setItem('user_notifications', JSON.stringify(notifications));
        
        // Save to Supabase for Pucho workflows to read
        if (userId) {
            const { error } = await supabase
                .from('users')
                .update({
                    email_alerts: notifications.email_alerts,
                    slack_sync: notifications.slack_sync,
                    reminder_30min: notifications.reminder_30min,
                    daily_report: notifications.daily_report
                })
                .eq('user_id', userId);
            
            if (error) {
                showToast("Failed to save preferences to server", "error");
                console.error("Supabase update error:", error);
            } else {
                showToast("Notification preferences saved", "success");
            }
        } else {
            showToast("Notification preferences saved locally", "success");
        }
        
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-gray-900">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F27E9]">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        Settings
                    </h1>
                    <p className="text-gray-500 font-medium ml-1">Manage your professional profile and workspace rules.</p>
                </div>
            </div>

            {/* Profile Settings Section */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Personal Profile</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Update your identity</p>
                        </div>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={loading} className="!bg-[#4F27E9] !text-white h-10 px-6 rounded-xl gap-2 font-bold text-xs uppercase tracking-widest">
                        <Save size={14} />
                        Update Profile
                    </Button>
                </div>
                
                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-10">
                        {/* Avatar Column */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer">
                                <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative">
                                    <img 
                                        src={profileInfo.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profileInfo.full_name}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="text-white w-8 h-8" />
                                    </div>
                                </div>
                                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#4F27E9] text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                    <UploadCloud size={18} />
                                    <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                                </label>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Avatar (2MB Max)</p>
                        </div>

                        {/* Fields Column */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <User size={12} className="text-blue-500" /> Full Name
                                </label>
                                <input 
                                    type="text" 
                                    value={profileInfo.full_name}
                                    onChange={(e) => setProfileInfo({...profileInfo, full_name: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#4F27E9]/10 outline-none font-medium transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={12} className="text-blue-500" /> Email Address
                                </label>
                                <input 
                                    type="email" 
                                    value={profileInfo.email}
                                    disabled
                                    className="w-full px-5 py-3 bg-gray-100 border border-gray-100 rounded-2xl cursor-not-allowed opacity-60 font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={12} className="text-blue-500" /> Phone Number
                                </label>
                                <input 
                                    type="text" 
                                    value={profileInfo.phone}
                                    onChange={(e) => setProfileInfo({...profileInfo, phone: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#4F27E9]/10 outline-none font-medium transition-all"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={12} className="text-blue-500" /> Department
                                </label>
                                <input 
                                    type="text" 
                                    value={profileInfo.department}
                                    onChange={(e) => setProfileInfo({...profileInfo, department: e.target.value})}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#4F27E9]/10 outline-none font-medium transition-all"
                                    placeholder="Engineering"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <SettingsIcon size={12} className="text-blue-500" /> Professional Bio
                                </label>
                                <textarea 
                                    value={profileInfo.bio}
                                    onChange={(e) => setProfileInfo({...profileInfo, bio: e.target.value})}
                                    rows="3"
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#4F27E9]/10 outline-none font-medium transition-all resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Update Sub-section */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                            <Lock size={16} />
                        </div>
                        <h3 className="font-bold text-gray-900">Security & Credentials</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                            <input 
                                type="password" 
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F27E9]/10 outline-none font-medium transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                            <div className="flex gap-4">
                                <input 
                                    type="password" 
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                    className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#4F27E9]/10 outline-none font-medium transition-all"
                                    placeholder="••••••••"
                                />
                                <Button 
                                    onClick={handleUpdatePassword} 
                                    disabled={loading || !passwords.newPassword}
                                    className="!bg-gray-900 !text-white h-[52px] px-8 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:!bg-black transition-all"
                                >
                                    Update
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Rules Section (UC-7) */}
            {profile?.role === 'ADMIN' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield size={20} className="text-purple-600" />
                            <h2 className="font-bold">Global Booking Rules</h2>
                        </div>
                        <Button onClick={handleSaveRules} disabled={loading} className="py-1.5 h-auto text-xs gap-2">
                            <Save size={14} />
                            Save Rules
                        </Button>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Clock size={14} /> Max Meeting Duration (mins)
                            </label>
                            <input 
                                type="number" 
                                value={rules.max_duration}
                                onChange={(e) => setRules({...rules, max_duration: parseInt(e.target.value)})}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#4F27E9]/20 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Calendar size={14} /> Advance Booking Limit (days)
                            </label>
                            <input 
                                type="number" 
                                value={rules.advance_booking_days}
                                onChange={(e) => setRules({...rules, advance_booking_days: parseInt(e.target.value)})}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#4F27E9]/20 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Clock size={14} /> Buffer Between Meetings (mins)
                            </label>
                            <input 
                                type="number" 
                                value={rules.buffer_time}
                                onChange={(e) => setRules({...rules, buffer_time: parseInt(e.target.value)})}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#4F27E9]/20 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <input 
                                type="checkbox" 
                                checked={rules.require_approval}
                                onChange={(e) => setRules({...rules, require_approval: e.target.checked})}
                                className="w-5 h-5 accent-[#4F27E9]"
                            />
                            <label className="text-sm font-semibold text-gray-700">Require Admin Approval</label>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;
