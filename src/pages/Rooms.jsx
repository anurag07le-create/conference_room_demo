import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { MapPin, Users, Info, Plus, Edit2, Power, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { notifyRoomUpdate } from '../services/notification.service';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Rooms = () => {
    const { user, profile } = useAuth();
    const isAdmin = (user?.role?.toUpperCase() === 'ADMIN') || (profile?.role?.toUpperCase() === 'ADMIN');
    const { showToast } = useToast();
    const { rooms, loading: dataLoading, refreshRooms } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [deactivateConfirm, setDeactivateConfirm] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: 10,
        amenities: '',
        status: true
    });

    const WEBHOOK_URL = import.meta.env.VITE_SMART_COMM_WEBHOOK_URL || "https://studio.pucho.ai/api/v1/webhooks/HHRERjvYyx4TblQt65NLD";

    useEffect(() => {
        const handleOpenRoomEvent = () => handleOpenModal();
        window.addEventListener('open-room-modal', handleOpenRoomEvent);
        return () => window.removeEventListener('open-room-modal', handleOpenRoomEvent);
    }, []);

    useEffect(() => {
        const fetchBookings = async () => {
             const startOfWeek = new Date();
             startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
             startOfWeek.setHours(0, 0, 0, 0);

             const { data: bookingData, error: bookingError } = await supabase
                 .from('bookings')
                 .select('*')
                 .gte('booking_date', startOfWeek.toISOString().split('T')[0])
                 .eq('status', 'CONFIRMED');

             if (!bookingError) {
                 setBookings(bookingData || []);
             }
        };
        if (user) fetchBookings();
    }, [user]);

    const getRoomUtilisation = (roomId) => {
        const roomBookings = bookings.filter(b => b.room_id === roomId);
        if (roomBookings.length === 0) return 0;
        const totalMinutes = roomBookings.reduce((acc, b) => {
            const start = new Date(`1970-01-01T${b.start_time}`);
            const end = new Date(`1970-01-01T${b.end_time}`);
            return acc + ((end - start) / (1000 * 60));
        }, 0);
        return Math.min(Math.round((totalMinutes / 2700) * 100), 100);
    };

    const resetForm = () => {
        setFormData({ name: '', location: '', capacity: 10, amenities: '', status: true });
        setEditingRoom(null);
    };

    const handleOpenModal = (room = null) => {
        if (room) {
            setEditingRoom(room);
            const name = room.room_name || room.name || '';
            const loc = room.floor_location || room.location || '';
            setFormData({
                name: name,
                location: loc,
                capacity: room.capacity || 10,
                amenities: room.amenities || '',
                status: String(room.status).toUpperCase() === 'ACTIVE'
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const triggerWebhook = async (action, payload) => {
        try {
            await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_type: action,
                    ...payload,
                    status: (payload.status === true || String(payload.status).toUpperCase() === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'
                })
            });
        } catch (error) {
            console.error("Webhook Error:", error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 🚀 Duplication Guard (Check for existing room names)
        if (!editingRoom) {
            const isDuplicate = rooms.some(r => 
                (r.room_name || r.name || '').toLowerCase() === formData.name.trim().toLowerCase()
            );
            if (isDuplicate) {
                showToast("A room with this name already exists. Please use a unique name.", "error");
                setLoading(false);
                return;
            }
        }

        const roomObj = {
            room_name: formData.name.trim(),
            floor_location: formData.location || 'A1',
            capacity: parseInt(formData.capacity) || 10,
            amenities: formData.amenities || '',
            status: formData.status ? 'ACTIVE' : 'INACTIVE'
        };

        // 🚀 Watchdog Timer (State-independent Force Reset)
        const watchdog = setTimeout(() => {
            console.log("[Watchdog] Force-resetting loading state...");
            setLoading(false);
            // We don't close modal here to let the user see if it eventually succeeds or fails
        }, 3000);

        try {
            console.log("[RoomSave] Starting DB Operation...", roomObj);
            // 🚀 1. DB SAVE (Priority)
            let dbError;
            if (editingRoom) {
                const targetId = editingRoom.room_id || editingRoom.id;
                const { error } = await supabase.from('rooms').update(roomObj).eq('room_id', targetId);
                dbError = error;
            } else {
                const { error } = await supabase.from('rooms').insert([roomObj]);
                dbError = error;
            }

            if (dbError) {
                console.error("[RoomSave] DB Error:", dbError);
                throw dbError;
            }

            // 🚀 2. SUCCESS PATH (Immediate UI Update)
            clearTimeout(watchdog);
            showToast(`Room ${editingRoom ? 'updated' : 'added'} successfully!`, 'success');
            
            // WEBHOOK (Non-blocking background)
            triggerWebhook(editingRoom ? 'edit_room' : 'add_room', {
                ...roomObj,
                room_id: editingRoom ? (editingRoom.id || editingRoom.room_id) : undefined
            }).catch(() => {});

            setIsModalOpen(false);
            resetForm();
            if (refreshRooms) refreshRooms();
        } catch (error) {
            clearTimeout(watchdog);
            console.error("[RoomSave] Fatal Error:", error.message);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (room, newStatus) => {
        setLoading(true);
        try {
            const targetId = room.room_id || room.id;
            const { error } = await supabase.from('rooms').update({ status: newStatus }).eq('room_id', targetId);
            if (error) throw error;
            
            showToast(`Room ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`, newStatus === 'ACTIVE' ? 'success' : 'warning');
            triggerWebhook('toggle_room_status', { room_id: targetId, status: newStatus });
            refreshRooms();
        } catch(error) {
            showToast('Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
            setDeactivateConfirm(null);
        }
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('rooms').delete().eq('room_id', id);
            if (error) throw error;
            showToast('Room deleted', 'error');
            refreshRooms();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-premium">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-[#111834] tracking-tight">Workspace Assets</h1>
                    <p className="text-sm font-medium text-gray-500">Configure and monitor your conference rooms.</p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refreshRooms()}
                            className="w-12 h-12 flex items-center justify-center bg-white text-gray-400 hover:text-[#4F27E9] rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <RefreshCw size={20} className={dataLoading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-[#4F27E9] text-white hover:bg-[#3D1DB3] h-14 px-8 flex items-center gap-3 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={20} />
                            Add New Room
                        </button>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[40px] border border-gray-100 shadow-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Room Identity</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Scale</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Utilization</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                {isAdmin && <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Controls</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {rooms.map((room) => {
                                const name = room.room_name || room.name || 'Unnamed';
                                const loc = room.floor_location || room.location || 'N/A';
                                const status = room.status || 'ACTIVE';
                                const isActive = status.toUpperCase() === 'ACTIVE';
                                const id = room.room_id || room.id;
                                const uti = getRoomUtilisation(id);

                                return (
                                    <tr key={id} className="hover:bg-indigo-50/30 transition-colors group/row">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-indigo-50 text-[#4F27E9]' : 'bg-gray-50 text-gray-400'} border border-transparent group-hover/row:border-indigo-100 transition-all shadow-sm`}>
                                                    <MapPin size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-[15px] text-[#111834] group-hover/row:text-[#4F27E9] transition-colors">{name}</span>
                                                        <button 
                                                            className="relative group/info"
                                                            onClick={() => showToast(`${name}: ${room.amenities || 'No amenities listed.'}`, 'info')}
                                                        >
                                                            <Info size={14} className="text-gray-300 hover:text-[#4F27E9] transition-colors" />
                                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:group-hover/info:block z-50 w-64 bg-white/95 backdrop-blur-md p-6 rounded-[24px] shadow-2xl border border-gray-100 animate-slide-in pointer-events-none">
                                                                <p className="text-[10px] font-black text-[#4F27E9] uppercase tracking-widest mb-2">Location: {loc}</p>
                                                                <p className="text-xs text-gray-600 font-medium leading-relaxed">{room.amenities || 'Fully equipped for digital collaboration.'}</p>
                                                            </div>
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{loc}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <Users size={14} className="text-gray-400" />
                                                <span className="text-sm font-black text-gray-700">{room.capacity}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5 max-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                                    <span className="text-gray-400">Weekly</span>
                                                    <span className="text-[#4F27E9]">{uti}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,39,233,0.3)] transition-all duration-1000" style={{ width: `${uti}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge 
                                                status={status}
                                                className="px-4 py-1.5 uppercase font-black text-[10px] tracking-widest shadow-sm rounded-xl"
                                            >
                                                {status}
                                            </Badge>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            const ns = isActive ? 'INACTIVE' : 'ACTIVE';
                                                            handleToggleStatus(room, ns);
                                                        }} 
                                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border border-transparent hover:shadow-sm ${isActive ? 'text-green-500 bg-green-50/50 hover:bg-green-50 hover:border-green-100' : 'text-gray-400 bg-gray-50/50 hover:bg-indigo-50 hover:text-[#4F27E9] hover:border-indigo-100'}`}
                                                        title={isActive ? "Deactivate Room" : "Activate Room"}
                                                    >
                                                        <Power size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenModal(room)} 
                                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#4F27E9] bg-gray-50/50 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 hover:shadow-sm transition-all"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeleteConfirm(room)} 
                                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 bg-gray-50/50 hover:bg-white rounded-xl border border-transparent hover:border-red-50 hover:shadow-sm transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {rooms.map((room) => {
                    const id = room.room_id || room.id;
                    const isActive = String(room.status).toUpperCase() === 'ACTIVE';
                    const uti = getRoomUtilisation(id);
                    return (
                        <div key={id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-indigo-50 text-[#4F27E9]' : 'bg-gray-50 text-gray-400'} border border-gray-50`}>
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-base text-[#111834] leading-tight">{room.room_name || room.name}</h3>
                                            <button 
                                                onClick={() => showToast(`${room.room_name || room.name}: ${room.amenities || 'No amenities.'}`, 'info')}
                                                className="text-gray-300 hover:text-[#4F27E9]"
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{room.floor_location || 'A1'}</p>
                                    </div>
                                </div>
                                <Badge status={room.status} className="text-[9px] px-3 font-black tracking-widest uppercase">
                                    {room.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Capacity</span>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={12} className="text-gray-400" />
                                        <span className="text-xs font-black text-gray-700">{room.capacity}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-tight mb-1">
                                        <span className="text-gray-400">Weekly</span>
                                        <span className="text-[#4F27E9]">{uti}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${uti}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex items-center gap-2 pt-1">
                                    <button 
                                        onClick={() => handleOpenModal(room)}
                                        className="flex-1 bg-indigo-50 text-[#4F27E9] h-11 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider border border-indigo-100"
                                    >
                                        <Edit2 size={14} /> Edit Room
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const ns = isActive ? 'INACTIVE' : 'ACTIVE';
                                            handleToggleStatus(room, ns);
                                        }}
                                        className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${isActive ? 'bg-green-50 text-green-500 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                                    >
                                        <Power size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirm(room)}
                                        className="w-11 h-11 flex items-center justify-center bg-red-50 text-red-400 rounded-xl border border-red-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoom ? "Edit Room" : "Add New Room"}>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Room Name</label>
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                            <input required type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Capacity</label>
                            <input required type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Amenities</label>
                        <textarea rows="2" value={formData.amenities} onChange={(e) => setFormData({...formData, amenities: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border rounded-xl" />
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={formData.status} onChange={(e) => setFormData({...formData, status: e.target.checked})} className="w-4 h-4" />
                        <span className="text-sm font-bold text-gray-700">Active</span>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Room'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog 
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => handleDelete(deleteConfirm.room_id || deleteConfirm.id)}
                isLoading={loading}
                title="Delete Room?"
                message="This will remove all associated data and cannot be undone."
                confirmText="Yes, Delete"
                cancelText="No, Keep it"
                type="danger"
            />
        </div>
    );
};

export default Rooms;
