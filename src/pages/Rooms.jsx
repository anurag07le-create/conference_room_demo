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
    const { user } = useAuth();
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

        const roomObj = {
            room_name: formData.name,
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

    const handleDeactivate = async (room) => {
        setLoading(true);
        try {
            const targetId = room.room_id || room.id;
            const { error } = await supabase.from('rooms').update({ status: 'INACTIVE' }).eq('room_id', targetId);
            if (error) throw error;
            showToast('Room deactivated', 'warning');
            triggerWebhook('deactivate_room', { room_id: targetId, status: 'INACTIVE' });
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
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
                <div>
                    <h1 className="text-2xl font-bold">Rooms Management</h1>
                    <p className="text-gray-500 text-sm">Add, edit, or deactivate conference rooms.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => refreshRooms()} variant="outline" className="flex items-center gap-2">
                        <RefreshCw size={18} className={dataLoading ? "animate-spin" : ""} />
                        Refresh
                    </Button>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <Plus size={18} />
                        Add New Room
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-gray-900">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Room Details</th>
                            <th className="px-6 py-4">Capacity</th>
                            <th className="px-6 py-4">Utilisation</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
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
                                <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{name}</span>
                                            <div className="relative group/info">
                                                <Info size={14} className="text-gray-300 cursor-help hover:text-[#4F27E9]" />
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover/info:block z-50 w-64 bg-white p-4 rounded-xl shadow-2xl border border-gray-100">
                                                    <p className="text-xs text-gray-900 font-bold mb-1">{loc}</p>
                                                    <p className="text-xs text-gray-600 leading-relaxed">{room.amenities || 'No amenities'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-600">
                                        {room.capacity}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 min-w-[100px]">
                                            <div className="flex justify-between text-[9px] font-black text-gray-400">
                                                <span>USAGE</span>
                                                <span className="text-[#4F27E9]">{uti}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#4F27E9]" style={{ width: `${uti}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    const ns = isActive ? 'INACTIVE' : 'ACTIVE';
                                                    handleDeactivate({ room_id: id, id: id, status: ns === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
                                                }} 
                                                className={`p-2 rounded-xl transition-all ${isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-blue-50'}`}
                                                title={isActive ? "Deactivate Room" : "Activate Room"}
                                            >
                                                <Power size={18} />
                                            </button>
                                            <button onClick={() => handleOpenModal(room)} className="p-2 text-gray-500 hover:text-pucho-blue">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(room)} className="p-2 text-gray-400 hover:text-red-500">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
