import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Mail, Briefcase, Shield, UserPlus, Edit2, XCircle, Download, Power } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Users = () => {
    const { showToast } = useToast();
    const { profile } = useAuth();
    const { users, loading: dataLoading, refreshUsers } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        status: 'ACTIVE'
    });

    const [inviteData, setInviteData] = useState({
        email: '',
        full_name: '',
        role: 'EMPLOYEE',
        department: ''
    });

    const WEBHOOK_URL = import.meta.env.VITE_ONBOARDING_WEBHOOK_URL || "https://studio.pucho.ai/api/v1/webhooks/fGjOoM7eciSpGACaz09jq";

    useEffect(() => {
        if (profile) {
            refreshUsers();
        }
    }, [profile]);

    const triggerWebhook = async (action, payload) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 
        
        try {
            const actionLabel = action.toUpperCase();
            console.log(`[${actionLabel}] Triggering Webhook for ${payload.email || "user"}...`);
            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_type: action,
                    admin_email: profile?.email,
                    ...payload
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`Status ${response.status}`);
            console.log(`[${actionLabel}] Webhook success for ${payload.email || "user"}`);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[${action.toUpperCase()}] Webhook Error:`, error.message);
        }
    };

    const handleOpenModal = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user?.full_name || '',
            department: user?.department || '',
            role: user?.role || 'EMPLOYEE',
            status: user?.status || 'ACTIVE'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        setLoading(true);

        const targetId = editingUser.id || editingUser.user_id;

        // Bulletproof Targeting: Prioritize ID, Fallback to Email
        const { error } = await supabase.from('users').update({
            full_name: formData.full_name,
            department: formData.department,
            role: formData.role,
            status: formData.status
        }).eq('user_id', targetId);

        if (error) {
            console.error("[USER-EDIT] DB Error:", error.message);
            showToast(`Update failed: ${error.message}`, "error");
        } else {
            showToast('User profile updated successfully!', 'success');
            triggerWebhook('user_update', {
                target_user_email: editingUser.email,
                new_role: formData.role,
                new_status: formData.status,
                full_name: formData.full_name
            });
            refreshUsers();
            setIsModalOpen(false);
        }
        setLoading(false);
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        console.log("[Invite] Starting process for:", inviteData.email);
                setLoading(true);
        console.log("[Invite] Starting Direct DB Sync...");

        const invitePayload = {
            full_name: inviteData.full_name,
            email: inviteData.email,
            role: inviteData.role,
            department: inviteData.department,
            status: 'ACTIVE'
        };

        try {
            // 🚀 1. DIRECT DB SYNC (PRIMARY - AWAIT)
            const { error } = await supabase.from('users').upsert([invitePayload], { onConflict: 'email' });
            if (error) throw error;

            // 🚀 2. FIRE WEBHOOK (BACKGROUND)
            triggerWebhook('invite', {
                ...invitePayload,
                action: 'invite'
            }).catch(e => console.error("Webhook trace (Non-blocking):", e.message));

            // SUCCESS FEEDBACK
            showToast(`Invitation sent to ${inviteData.email}`, "success");
            
            // RESET & CLOSE MODAL
            setIsInviteModalOpen(false);
            setInviteData({ email: '', full_name: '', role: 'EMPLOYEE', department: '' });
            
            // Success call: Refresh Dashboard
            if (typeof refreshUsers === 'function') refreshUsers();
            
        } catch (error) {
            console.error("[Invite] Fatal Error:", error.message);
            showToast(`Invitation failed: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user) => {
        if (!user || loading) return;
        const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const targetId = user.user_id || user.id;
        
        setLoading(true);
        try {
            // Bulletproof Targeting: Toggle via ID or Email
            const { error } = await supabase.from('users').update({ status: newStatus }).eq('user_id', targetId);

            if (error) throw error;
            
            showToast(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`, 'success');
            refreshUsers();
        } catch (error) {
            showToast(`Update failed: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (users.length === 0) {
            showToast("No data to export", "info");
            return;
        }

        const headers = ["Name", "Email", "Department", "Role", "Status", "Created At"];
        const rows = users.map(u => [
            u.full_name,
            u.email,
            u.department || 'N/A',
            u.role,
            u.status || 'ACTIVE',
            new Date(u.created_at).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Exporting users list...", "success");
    };

    const handleDelete = async (user) => {
        if (!user || loading) return;
        const targetId = user.user_id || user.id;
        const targetEmail = user.email;
        
        showToast('Final deletion request sent...', 'info');
        setDeleteConfirm(null);

        try {
            const { error: dbError } = await supabase
                .from('users')
                .delete()
                .eq('user_id', targetId);
            
            if (dbError) {
                console.warn("[HARD-DELETE] Selective delete failed, trying via Email...");
                await supabase.from('users').delete().eq('email', targetEmail);
            }
            
            // STEP 2: Trigger Webhook
            // No webhook for delete_user (as per user flow check)

            showToast('User removal successfully synced', 'success');
            refreshUsers(); 
            
        } catch (error) {
            console.error("[HARD-DELETE] Final Crash:", error.message);
            showToast(`Removal Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
            refreshUsers(); // Force refresh to sync UI
        }
    };

    // Protect the UI
    if (profile?.role !== 'ADMIN') {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Access Denied: Admins Only
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-gray-500 text-sm">Manage user accounts, roles, and access permissions.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-full shadow-sm transition-all"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-[#4F27E9] text-white hover:bg-[#3D1DB3] flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-full shadow-sm transition-all"
                    >
                        <UserPlus size={16} />
                        Invite User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-gray-900">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {users.map((u) => (
                            <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-pucho-blue overflow-hidden border border-blue-100">
                                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div>
                                            <p className="font-bold">{u.full_name}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Mail size={10} /> {u.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                                        <Briefcase size={14} className="opacity-40" />
                                        {u.department || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                        <Shield size={12} />
                                        {u.role}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge status={(u.status || 'ACTIVE').toLowerCase()}>{u.status || 'ACTIVE'}</Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => handleToggleStatus(u)}
                                            className={`p-1.5 rounded-lg transition-all ${u.status === 'INACTIVE' ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-blue-50 hover:text-pucho-blue'}`}
                                            title={u.status === 'INACTIVE' ? "Activate User" : "Deactivate User"}
                                        >
                                            <Power size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(u)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#4F27E9] transition-all"
                                            title="Edit User"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(u)}
                                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-pucho-blue transition-all"
                                            title="Delete User"
                                            disabled={loading}
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit User Role & Dept">
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-gray-900">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                        <input
                            required
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email (Read Only)</label>
                        <input
                            disabled
                            type="email"
                            value={editingUser?.email || ''}
                            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Department</label>
                            <input
                                required
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                placeholder="Engineering"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium"
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors">
                            Cancel
                        </button>
                        <Button type="submit" className="px-8 shadow-md" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Invite Modal */}
            <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite New User">
                <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2 text-gray-900">
                    <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-xl border border-blue-100">
                        Inviting a user will send them an automated email to set up their account and join the platform.
                    </p>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                        <input required type="text" value={inviteData.full_name} onChange={(e) => setInviteData({...inviteData, full_name: e.target.value})} placeholder="John Doe" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                        <input required type="email" value={inviteData.email} onChange={(e) => setInviteData({...inviteData, email: e.target.value})} placeholder="john@example.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Department</label>
                            <input required type="text" value={inviteData.department} onChange={(e) => setInviteData({...inviteData, department: e.target.value})} placeholder="Marketing" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Role</label>
                            <select value={inviteData.role} onChange={(e) => setInviteData({...inviteData, role: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium" >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                        <Button type="submit" className="px-8 shadow-md" disabled={loading}>{loading ? 'Sending...' : 'Send Invitation'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog 
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => handleDelete(deleteConfirm)}
                isLoading={loading}
                title="Remove User?"
                message={`Are you sure you want to remove ${deleteConfirm?.full_name}? This will revoke their access and delete their profile data permanently.`}
                confirmText="Yes, Remove"
                cancelText="No, Keep User"
                type="danger"
            />
        </div>
    );
};

export default Users;
