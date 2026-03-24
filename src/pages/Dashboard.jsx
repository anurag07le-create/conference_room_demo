import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { NavLink } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
    Calendar, Users, CheckCircle, XCircle, TrendingUp, 
    Activity, ShieldAlert, Clock, Bell, Plus, Info, Bot, Wand2, FileText, Settings
} from 'lucide-react';
import BookingModal from '../components/dashboard/BookingModal';
import MoMModal from '../components/dashboard/MoMModal';
import { supabase } from '../lib/supabase';

const CalendarGrid = ({ isAdmin, rooms: roomsData, bookings: todayBookings, onQuickBook, selectedDate, onDateChange }) => {
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    const getStatus = (roomId, time) => {
        if (!todayBookings || todayBookings.length === 0) return 'green';
        
        const slotStart = time;
        const slotEnd = `${String(parseInt(time.split(':')[0]) + 1).padStart(2, '0')}:00`;
        
        const booking = todayBookings.find(b => {
            if (b.room_id !== roomId && b.rooms?.id !== roomId) return false;
            if (b.status !== 'CONFIRMED') return false;
            return b.start_time < slotEnd && b.end_time > slotStart;
        });

        if (booking) return 'red';

        // Add 'Soon' state logic if the date is today
        const todayStr = new Date().toISOString().split('T')[0];
        if (selectedDate === todayStr) {
            const now = new Date();
            const currentHour = now.getHours();
            const slotHour = parseInt(time.split(':')[0]);
            if (slotHour === currentHour + 1) return 'orange';
        }

        return 'green';
    };

    const colors = {
        green: 'bg-[#F0FFF4] border-[#C6F6D5] text-[#2F855A]',
        red: 'bg-[#FFF5F5] border-[#FED7D7] text-[#C53030]',
        orange: 'bg-[#FFFAF0] border-[#FEEBC8] text-[#9C4221]',
        grey: 'bg-gray-50 border-gray-100 text-gray-400'
    };

    // Mobile View - Card List
    const MobileCalendarView = () => (
        <div className="md:hidden space-y-4">
            {(roomsData || []).map((room, roomIdx) => (
                <div key={room.id || `room-${roomIdx}`} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-900">{room.room_name}</h4>
                        <span className="text-xs text-gray-500">{room.floor_location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {timeSlots.map((time, timeIdx) => {
                            const status = getStatus(room.id, time);
                            const slotBooking = todayBookings?.find(b => (b.room_id === room.id || b.rooms?.id === room.id) && b.status === 'CONFIRMED' && b.start_time <= time && b.end_time > time);
                            return (
                                <button
                                    key={`${room.id}-${time}`}
                                    onClick={() => status === 'green' && onQuickBook?.({ 
                                        room_id: room.id, 
                                        room_name: room.room_name, 
                                        time, 
                                        date: selectedDate 
                                    })}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${colors[status]} ${status === 'green' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'}`}
                                >
                                    {time}
                                    {status === 'red' && <span className="block text-[8px] truncate max-w-[60px]">{slotBooking?.title || 'Booked'}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            {(!roomsData || roomsData.length === 0) && (
                <div className="text-center py-8 text-gray-400 text-sm">No rooms found</div>
            )}
        </div>
    );

    const scrollContainerRef = React.useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const amount = direction === 'left' ? -250 : 250;
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const scrollToCurrentTime = React.useCallback(() => {
        if (scrollContainerRef.current) {
            const now = new Date();
            const currentHour = now.getHours();
            
            // Find slot or default to first if too early
            let slotIndex = timeSlots.findIndex(t => parseInt(t.split(':')[0]) === currentHour);
            if (slotIndex === -1 && currentHour < 9) slotIndex = 0; // Morning view
            if (slotIndex === -1 && currentHour > 17) slotIndex = timeSlots.length - 1; // EOD view
            
            if (slotIndex !== -1) {
                const scrollOffset = Math.max(0, (slotIndex - 1) * 120); 
                scrollContainerRef.current.scrollLeft = scrollOffset;
            }
        }
    }, [timeSlots]);

    React.useEffect(() => {
        const timer = setTimeout(scrollToCurrentTime, 1000);
        return () => clearTimeout(timer);
    }, [scrollToCurrentTime]);

    // Desktop View - Table Grid
    const DesktopCalendarView = () => (
        <div className="hidden md:block relative group/scroll">
            {/* Scroll Buttons Overlay */}
            <div className="absolute inset-y-0 -left-4 flex items-center z-20 pointer-events-none">
                <button 
                    onClick={() => scroll('left')}
                    className="p-2 bg-white/90 border border-gray-100 rounded-full shadow-xl text-gray-400 hover:text-[#4F27E9] hover:scale-110 pointer-events-auto transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
            
            <div className="absolute inset-y-0 -right-4 flex items-center z-20 pointer-events-none">
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => scroll('right')}
                        className="p-2 bg-white/90 border border-gray-100 rounded-full shadow-xl text-gray-400 hover:text-[#4F27E9] hover:scale-110 pointer-events-auto transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button 
                        onClick={scrollToCurrentTime}
                        className="p-2 bg-[#4F27E9]/10 border border-[#4F27E9]/20 rounded-full shadow-lg text-[#4F27E9] hover:bg-[#4F27E9] hover:text-white pointer-events-auto transition-all"
                        title="Today's View"
                    >
                        <Clock size={16} />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollContainerRef}
                className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent scroll-smooth px-2"
            >
                <table className="w-full border-separate border-spacing-2 min-w-[1000px]">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {timeSlots.map(time => (
                                <th key={time} className="p-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{time}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(roomsData || []).map((room, roomIdx) => (
                            <tr key={room.id || `droom-${roomIdx}`}>
                                <td className="p-2 text-sm font-bold text-gray-900 whitespace-nowrap min-w-[140px]">{room.room_name}</td>
                                {timeSlots.map((time, timeIdx) => {
                                    const status = getStatus(room.id, time);
                                    const slotBooking = todayBookings?.find(b => (b.room_id === room.id || b.rooms?.id === room.id) && b.status === 'CONFIRMED' && b.start_time <= time && b.end_time > time);
                                    
                                    return (
                                        <td key={`${room.id}-${time}`} className="p-0">
                                            <div 
                                                onClick={() => status === 'green' && onQuickBook?.({ 
                                                    room_id: room.id, 
                                                    room_name: room.room_name, 
                                                    time, 
                                                    date: selectedDate 
                                                })}
                                                className={`h-12 w-full rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:scale-[1.02] ${colors[status]}`}
                                            >
                                                {status === 'red' && isAdmin && <span className="text-[10px] font-bold px-1 text-center truncate">{slotBooking?.title || 'Booked'}</span>}
                                                {status === 'green' && <Plus size={14} className="opacity-40" />}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {(!roomsData || roomsData.length === 0) && (
                            <tr>
                                <td colSpan={timeSlots.length + 1} className="py-10 text-center text-gray-400 text-sm">No rooms found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h3 className="font-bold text-gray-900">Room Availability</h3>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-[#4F27E9] focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 md:gap-4 text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#F0FFF4] border border-[#C6F6D5]"></div> <span className="hidden sm:inline">Available</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#FFF5F5] border border-[#FED7D7]"></div> <span className="hidden sm:inline">Booked</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#FFFAF0] border border-[#FEEBC8]"></div> <span className="hidden sm:inline">Soon</span></div>
                </div>
            </div>
            <div className="p-4 md:p-6">
                <MobileCalendarView />
                <DesktopCalendarView />
            </div>
        </div>
    );
};
const Dashboard = () => {
    const { user, profile } = useAuth();
    const { bookings: globalBookings, rooms: globalRooms, loading: dataLoading, refreshAll, searchQuery } = useData();
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
    const [bookingInitialData, setBookingInitialData] = React.useState(null);
    const isAdmin = profile?.role?.toUpperCase() === 'ADMIN';

    const [isMoMModalOpen, setIsMoMModalOpen] = React.useState(false);
    const [selectedBookingForMoM, setSelectedBookingForMoM] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('Overview');
    const [todayBookings, setTodayBookings] = React.useState([]);
    const [stats, setStats] = React.useState({
        totalToday: 0,
        activeRooms: 0,
        cancellations: 0,
        peakRoom: 'N/A',
        health: { engine: 'Operational', notifs: 'Operational' },
        rooms: [],
        heatmap: [],
        upcoming: [],
        allBookings: [],
        nextAvailable: null,
        attendeeCount: 0
    });
    const [loading, setLoading] = React.useState(false);
    const [selectedGridDate, setSelectedGridDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [gridBookings, setGridBookings] = React.useState([]);

    React.useEffect(() => {
        if (!user || globalBookings.length === 0 || globalRooms.length === 0) return;

        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = yesterdayDate.toISOString().split('T')[0];

            const mappedRooms = globalRooms;
            
            // 🚀 ROLE & SEARCH BASED DATA FILTERING
            const userEmail = user.email?.toLowerCase();
            const q = (searchQuery || '').toLowerCase();
            
            const bookingsData = globalBookings.filter(b => {
                // 1. Role Check
                const isOwner = b.user_email?.toLowerCase() === userEmail || 
                               b.attendee_emails?.toLowerCase().includes(userEmail);
                if (!isAdmin && !isOwner) return false;

                // 2. Search Filter
                if (!q) return true;
                return (
                    b.title?.toLowerCase().includes(q) ||
                    b.user_email?.toLowerCase().includes(q) ||
                    b.room_name?.toLowerCase().includes(q)
                );
            });

            // Separate Today vs Yesterday for KPI comparison
            const todayList = (bookingsData || []).filter(b => b.booking_date === today) || [];
            const yesterdayList = (bookingsData || []).filter(b => b.booking_date === yesterday) || [];
            
            // 3. Heatmap Calculation (Real 30-day historical average)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];
            
            const recentBookings = bookingsData?.filter(b => b.booking_date >= thirtyDaysStr) || [];
            const totalWorkMinutesMonth = 30 * 9 * 60; 

            const heatmap = mappedRooms.map(room => {
                const roomHistory = recentBookings.filter(b => (b.room_id === room.id) && b.status === 'CONFIRMED');
                let bookedMinutes = 0;
                roomHistory.forEach(b => {
                    if (b.start_time && b.end_time) {
                        try {
                            const start = b.start_time.split(':').map(Number);
                            const end = b.end_time.split(':').map(Number);
                            if (start.length >= 2 && end.length >= 2) {
                                bookedMinutes += (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
                            }
                        } catch (e) {
                            console.warn("Calculation error for booking:", b.id);
                        }
                    }
                });
                const utilization = Math.min(100, Math.round((bookedMinutes / totalWorkMinutesMonth) * 100 * 10)); // Adjusted scaling
                return {
                    name: room.name,
                    val: utilization,
                    color: utilization > 60 ? 'bg-rose-500' : utilization > 30 ? 'bg-[#4F27E9]' : 'bg-indigo-300'
                };
            });

            // 4. Filter bookings for the selected grid date
            const gridList = bookingsData?.filter(b => b.booking_date === selectedGridDate) || [];
            setGridBookings(gridList);
            setTodayBookings(todayList);

            // 5. Live Stats calculation
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            const currentlyActive = todayList.filter(b => 
                b.status === 'CONFIRMED' && 
                b.start_time <= currentTime && 
                b.end_time >= currentTime
            ).length;

            const roomCounts = {};
            bookingsData?.forEach(b => {
                const rName = b.rooms?.room_name || b.room || 'Unknown';
                if (rName) roomCounts[rName] = (roomCounts[rName] || 0) + 1;
            });
            const peak = Object.entries(roomCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

            // Find "Next Available Room" for quick booking
            const nextAvailable = mappedRooms?.find(r => {
                return !todayList.some(b => 
                    (b.room_id === r.id) && 
                    b.status === 'CONFIRMED' && 
                    b.start_time <= currentTime && 
                    b.end_time > currentTime
                );
            }) || mappedRooms?.[0];
            
            setStats(prev => ({
                ...prev,
                totalToday: todayList.length,
                totalYesterday: yesterdayList.length,
                activeRooms: currentlyActive,
                cancellations: todayList.filter(b => b.status === 'CANCELLED').length,
                peakRoom: peak,
                rooms: mappedRooms,
                heatmap: heatmap,
                allBookings: bookingsData,
                upcoming: todayList.filter(b => b.status === 'CONFIRMED' && b.start_time > currentTime).sort((a,b) => a.start_time.localeCompare(b.start_time)),
                nextAvailable: nextAvailable,
                health: {
                    engine: bookingsData.length > 0 ? 'Operational' : 'Idle',
                    notifs: bookingsData.some(b => b.summary_sent) ? 'Active' : 'Operational'
                }
            }));
        } catch (err) {
            console.error("Dashboard stats error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, globalBookings, globalRooms, selectedGridDate]);

    const handleOpenBooking = (data = null) => {
        setBookingInitialData(data);
        setIsBookingModalOpen(true);
    };

    const handleOpenMoM = (booking) => {
        setSelectedBookingForMoM(booking);
        setIsMoMModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in group/dashboard">
            {isAdmin ? (
                <AdminDashboardView 
                    onOpenBooking={handleOpenBooking} 
                    stats={stats} 
                    gridBookings={gridBookings} 
                    selectedGridDate={selectedGridDate}
                    setSelectedGridDate={setSelectedGridDate}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            ) : (
                <UserDashboardView 
                    user={user} 
                    profile={profile}
                    onOpenBooking={handleOpenBooking} 
                    gridBookings={gridBookings}
                    todayBookings={todayBookings}
                    selectedGridDate={selectedGridDate}
                    setSelectedGridDate={setSelectedGridDate}
                    onOpenMoM={handleOpenMoM}
                    loadingToday={loading}
                    stats={stats}
                />
            )}

            <BookingModal 
                isOpen={isBookingModalOpen} 
                onClose={() => setIsBookingModalOpen(false)}
                initialData={bookingInitialData}
                onSuccess={() => {
                    refreshAll();
                }}
            />

            <MoMModal 
                isOpen={isMoMModalOpen}
                onClose={() => setIsMoMModalOpen(false)}
                booking={selectedBookingForMoM}
                onSuccess={refreshAll}
            />
        </div>
    );
};

const AdminDashboardView = ({ onOpenBooking, stats, gridBookings, selectedGridDate, setSelectedGridDate, activeTab, setActiveTab }) => {
    const getTrend = (current, previous) => {
        if (previous === undefined || previous === null || previous === 0) {
            if (current > 0) return { value: 100, isUp: true };
            return null;
        }
        const diff = ((current - previous) / previous) * 100;
        return {
            value: Math.abs(Math.round(diff)),
            isUp: diff >= 0
        };
    };

    const bookingTrend = getTrend(stats.totalToday, stats.totalYesterday);
    const cancellationTrend = getTrend(stats.cancellations, stats.yesterdayCancellations);

    const kpis = [
        { 
            title: 'Total Bookings Today', 
            value: stats?.totalToday ?? '0', 
            icon: <Calendar className="w-5 h-5" />, 
            color: 'bg-blue-50 text-blue-600',
            trend: bookingTrend ? `${bookingTrend.isUp ? '+' : '-'}${bookingTrend.value}% vs yesterday` : 'No past data'
        },
        { 
            title: 'Currently Active', 
            value: stats?.activeRooms ?? '0', 
            icon: <Activity className="w-5 h-5" />, 
            color: 'bg-green-50 text-green-600' 
        },
        { 
            title: 'Cancellations Today', 
            value: stats?.cancellations ?? '0', 
            icon: <XCircle className="w-5 h-5" />, 
            color: 'bg-red-50 text-red-600',
            trend: cancellationTrend ? `${cancellationTrend.isUp ? '+' : '-'}${cancellationTrend.value}% vs yesterday` : '0% vs yesterday'
        },
        { 
            title: 'Peak Usage Room', 
            value: stats?.peakRoom ?? 'N/A', 
            icon: <TrendingUp className="w-5 h-5" />, 
            color: 'bg-indigo-50 text-indigo-600' 
        },
    ];

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Live Monitoring Hub</h2>
                    {/* Tabs Navigation */}
                    <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-100 w-fit">
                        <button 
                            onClick={() => setActiveTab('Overview')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'Overview' ? 'bg-white shadow-sm text-[#4F27E9]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('Analytics')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'Analytics' ? 'bg-white shadow-sm text-[#4F27E9]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Analytics
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                    {/* Primary actions removed as per request for clean UI */}
                </div>
            </div>
            
            {/* KPI Cards - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {kpis.map((kpi, kpiIdx) => (
                    <div key={kpi.title || kpiIdx} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${kpi.color}`}>
                                {kpi.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-tight truncate">{kpi.title}</p>
                                <p className="text-lg md:text-2xl font-black text-gray-900 truncate">{kpi.value}</p>
                            </div>
                        </div>
                        {kpi.trend && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                                <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.trend.includes('+') ? 'bg-green-50 text-green-600' : kpi.trend.includes('-') ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                    {kpi.trend}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Conditional Content based on Active Tab */}
            {activeTab === 'Overview' ? (
                <>
                    {/* Availability Grid - Responsive */}
                    <CalendarGrid 
                        isAdmin={true} 
                        rooms={stats.rooms} 
                        bookings={gridBookings} 
                        onQuickBook={onOpenBooking} 
                        selectedDate={selectedGridDate}
                        onDateChange={setSelectedGridDate}
                    />

                    {/* Recent Activity Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h3 className="font-bold text-gray-900">Recent Activity</h3>
                            <button className="text-xs text-[#4F27E9] font-bold hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest hidden md:table-header-group">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Room</th>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {(stats.allBookings || []).slice(0, 5).map((booking, i) => (
                                        <tr key={booking.id || i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 md:px-6 py-4 flex items-center gap-3">
                                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${booking.id}`} className="w-8 h-8 rounded-full bg-gray-100" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900 truncate max-w-[120px] md:max-w-none hover:text-[#4F27E9] cursor-default transition-colors">{booking.title || 'Untitled Meeting'}</span>
                                                    {booking.mom_notes && (
                                                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-tighter opacity-80 animate-pulse">AI Summary Ready</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-gray-600 font-medium text-xs md:text-sm">{booking.room_name}</td>
                                            <td className="px-4 md:px-6 py-4 text-gray-500 font-medium text-xs">
                                                {booking.booking_date}<br className="md:hidden" />
                                                <span className="text-gray-400">{booking.start_time?.substring(0, 5)}</span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                <Badge status={booking.status?.toLowerCase()}>{booking.status}</Badge>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {booking.mom_notes && (
                                                        <button 
                                                            className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-400 hover:text-purple-600 transition-all" 
                                                            title="View Summary"
                                                            onClick={() => {
                                                                // Future-proof: Trigger MoM read-only modal here
                                                                showToast('AI Summary for: ' + booking.title, 'info');
                                                            }}
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                    )}
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#4F27E9]" title="Details">
                                                        <Info size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats.allBookings || stats.allBookings.length === 0) && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-medium">No recent activity found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ring-1 ring-gray-50">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#4F27E9]" />
                            Room Heatmap
                        </h3>
                        <div className="space-y-5">
                            {(stats.heatmap || []).map((room, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                        <span className="text-gray-500">{room.name}</span>
                                        <span className="text-[#4F27E9]">{room.val}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${room.color} rounded-full transition-all duration-1000`} style={{ width: `${room.val}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            {(!stats.heatmap || stats.heatmap.length === 0) && (
                                <p className="text-xs text-center text-gray-400 font-medium py-10">No data available for heatmap</p>
                            )}
                        </div>
                        <p className="mt-6 text-[10px] text-gray-400 font-medium italic">Data based on past 30 days utilisation.</p>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#111834] rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6 text-indigo-400" />
                                Core Analytics
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400">Monthly Usage Target</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black">78%</span>
                                        <span className="text-green-400 text-xs mb-1 font-bold">▲ 12%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '78%' }}></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400">Total Operational Efficiency</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black">94%</span>
                                        <span className="text-green-400 text-xs mb-1 font-bold">Stable</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-medium tracking-tight">Engine Health (WF-01)</span>
                                    <span className={`px-2 py-0.5 ${stats.health?.engine === 'Operational' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} rounded text-[9px] font-black uppercase tracking-widest border`}>{stats.health?.engine || 'Idle'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-medium tracking-tight">Notif Cluster (WF-11)</span>
                                    <span className={`px-2 py-0.5 ${stats.health?.notifs === 'Active' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'} rounded text-[9px] font-black uppercase tracking-widest border`}>{stats.health?.notifs || 'Operational'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-medium tracking-tight">Last Data Sync</span>
                                    <span className="text-gray-300 font-bold">{new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        <Activity className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5 group-hover:text-white/10 transition-colors" />
                    </div>
                </div>
            )}
        </div>
    );
};

const UserDashboardView = ({ user, profile, onOpenBooking, gridBookings, todayBookings, onOpenMoM, loadingToday, stats, selectedGridDate, setSelectedGridDate }) => {
    const { notifications } = useData();
    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content (3 cols) */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Welcome Banner */}
                    <div className="bg-[#4F27E9] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 max-w-lg">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                                <Bot size={14} className="text-white" />
                                Pucho OS · Employee Portal
                            </div>
                            <h2 className="text-4xl font-black mb-3 tracking-tight">Hello, {user?.full_name?.split(' ')?.[0] || 'User'}!</h2>
                            <p className="text-white/70 mb-10 font-medium text-lg leading-relaxed">Ready to automate your next meeting? Your personal assistant is ready in the bottom corner.</p>
                            <div className="flex items-center gap-4">
                                <Button 
                                    onClick={() => onOpenBooking()}
                                    className="!bg-white !text-[#4F27E9] hover:!bg-gray-100 border-none px-10 h-14 font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-sm"
                                    style={{ textShadow: 'none' }}
                                >
                                    Quick Book Room
                                </Button>
                                {stats?.attendeeCount > 0 && (
                                    <div className="flex -space-x-3 items-center ml-4">
                                        {(stats?.attendeeList || []).slice(0, 3).map((email, i) => (
                                            <img key={i} src={`https://api.dicebear.com/7.x/initials/svg?seed=${email}`} className="w-10 h-10 rounded-full border-2 border-[#4F27E9] bg-white shadow-sm" alt="Attendee" title={email} />
                                        ))}
                                        {stats?.attendeeCount > 3 && (
                                            <div className="w-10 h-10 rounded-full border-2 border-[#4F27E9] bg-indigo-300 flex items-center justify-center text-[10px] font-black text-white">+{stats?.attendeeCount - 3}</div>
                                        )}
                                        <p className="text-xs font-bold text-white/50 ml-6 tracking-tight">Today's Attendees</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Calendar className="absolute -bottom-16 -right-16 w-80 h-80 text-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 opacity-20" />
                        <div className="absolute top-12 right-12 w-48 h-48 bg-white/5 rounded-full blur-[80px]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Quick Book Panel */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
                            <div>
                                <h3 className="font-black text-[#111834] mb-2 flex items-center gap-3 text-lg">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F27E9]">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    Quick Book
                                </h3>
                                <p className="text-xs font-medium text-gray-400 mb-8 leading-relaxed">Instantly reserve the best available room for your immediate team sync or 1-on-1.</p>
                                
                                <div className="space-y-4">
                                    {stats.nextAvailable ? (
                                        <div className="p-4 rounded-2xl bg-[#FAF9FE] border border-[#F0EDFF] hover:border-[#4F27E9] transition-all cursor-pointer group flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 group-hover:text-[#4F27E9]">Next Available Room</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{stats?.nextAvailable?.room_name} · {stats?.nextAvailable?.floor_location}</p>
                                            </div>
                                            <Button 
                                                onClick={() => onOpenBooking({ room_id: stats?.nextAvailable?.id, title: 'Quick Team Meeting' })}
                                                className="h-8 px-4 text-[10px] font-black bg-[#4F27E9] rounded-xl hover:bg-[#3D1DB3]"
                                            >
                                                BOOK NOW
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 font-medium italic">All rooms currently occupied.</p>
                                    )}
                                </div>
                            </div>
                            <NavLink 
                                to={profile?.role?.toUpperCase() === 'ADMIN' ? "/admin/rooms" : "/user/rooms"}
                                className="w-full mt-6 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 hover:text-[#4F27E9] hover:border-[#4F27E9] hover:bg-indigo-50/50 transition-all uppercase tracking-widest flex items-center justify-center"
                            >
                                EXPLORE ALL ROOMS
                            </NavLink>
                        </div>

                        {/* My Today Panel */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-[#111834] flex items-center gap-3 text-lg">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    My Today
                                </h3>
                                <button className="text-[10px] font-black text-[#4F27E9] hover:underline uppercase tracking-widest">HISTORY</button>
                            </div>
                            <div className="space-y-4">
                                {(() => {
                                    if (loadingToday) {
                                        return (
                                            <div className="flex justify-center py-10">
                                                <div className="w-8 h-8 border-4 border-[#4F27E9]/20 border-t-[#4F27E9] rounded-full animate-spin"></div>
                                            </div>
                                        );
                                    }

                                    const myBookings = (todayBookings || []).filter(b => b && b.user_id === user?.id);
                                    if (myBookings.length > 0) {
                                        return myBookings.map((booking) => (
                                            <div key={booking.id || Math.random()} className="p-5 rounded-2xl bg-[#FAF9FE] border border-[#F0EDFF] shadow-sm group/item">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-[#111834] text-sm leading-tight mb-1">{booking.title || 'Untitled Meeting'}</h4>
                                                        <p className="text-xs font-bold text-gray-400">{booking.startTime || '--:--'} - {booking.endTime || '--:--'}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge status={booking.status?.toLowerCase() || 'confirmed'}>{booking.status || 'Confirmed'}</Badge>
                                                        {booking.summary_sent && (
                                                            <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">
                                                                <CheckCircle size={10} /> Summary Sent
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-gray-200/50">
                                                    <span className="text-[11px] font-bold text-gray-500">{booking.room || 'Unknown Room'}</span>
                                                    <div className="flex gap-4">
                                                        <button 
                                                            onClick={() => onOpenMoM(booking)}
                                                            className="text-[10px] font-black text-[#4F27E9] hover:underline uppercase tracking-widest flex items-center gap-1"
                                                        >
                                                            <Wand2 size={12} /> MoM
                                                        </button>
                                                        <button className="text-[10px] font-black text-gray-400 hover:text-[#4F27E9] uppercase tracking-widest">Edit</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    }

                                    return (
                                        <div className="bg-gray-50 rounded-2xl p-8 text-center">
                                            <Calendar className="mx-auto w-10 h-10 text-gray-200 mb-2" />
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No meetings booked for today</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Availability Grid */}
                    <div className="space-y-4">
                        <CalendarGrid 
                            isAdmin={false} 
                            rooms={stats.rooms} 
                            bookings={gridBookings} 
                            onQuickBook={onOpenBooking}
                            selectedDate={selectedGridDate}
                            onDateChange={setSelectedGridDate}
                        />
                    </div>
                </div>

                {/* Sidebar (1 col) */}
                <div className="space-y-8 lg:mt-0">
                    {/* User Profile Info */}
                    <div className="bg-[#111834] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name}`} className="w-20 h-20 rounded-[28px] border-4 border-white/10 bg-white/5 mb-6 shadow-2xl" alt="Profile" />
                            <h3 className="text-xl font-bold mb-1">{user?.full_name}</h3>
                            <p className="text-xs font-black text-[#4F27E9] uppercase tracking-[0.2em] mb-4">Account Verified</p>
                            
                            <div className="space-y-4 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Department</span>
                                    <span className="text-xs font-bold">{user?.department || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Role</span>
                                    <span className="text-xs font-bold uppercase tracking-tighter bg-white/10 px-2 py-0.5 rounded-lg border border-white/5">{user?.role}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <NavLink 
                                    to={profile?.role?.toUpperCase() === 'ADMIN' ? "/admin/settings" : "/user/settings"}
                                    className="flex items-center justify-between group/opt cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors text-[#4F27E9]"
                                >
                                    <span className="text-xs font-black uppercase tracking-widest">Notification Settings</span>
                                    <Settings size={14} />
                                </NavLink>
                            </div>
                        </div>
                        <ShieldAlert className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 group-hover:text-white/10 transition-all duration-700" />
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                        <h3 className="font-black text-[#111834] mb-8 flex items-center gap-3 tracking-tight">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F27E9]">
                                <Clock className="w-5 h-5" />
                            </div>
                            Upcoming
                        </h3>
                        <div className="space-y-8">
                            {stats.upcoming && stats.upcoming.length > 0 ? (
                                stats.upcoming
                                    .filter(b => b.user_id === user?.id)
                                    .slice(0, 3)
                                    .map((b, i) => (
                                        <div key={b.id} className="flex gap-5 relative group cursor-pointer">
                                            <div className={`w-1.5 h-12 rounded-full transition-all group-hover:h-14 ${i === 0 ? 'bg-[#4F27E9]' : 'bg-indigo-100'}`}></div>
                                            <div className="py-0.5">
                                                <p className="text-sm font-bold text-[#111834] group-hover:text-[#4F27E9] transition-colors">{b.title}</p>
                                                <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{b.booking_date} • {b.startTime}</p>
                                            </div>
                                            {i === 0 && <div className="absolute top-1 right-0 w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>}
                                        </div>
                                    ))
                            ) : (
                                <p className="text-xs text-gray-400 font-medium">No upcoming meetings.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="font-black text-[#111834] flex items-center gap-3 tracking-tight">
                                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Bell className="w-5 h-5" />
                                </div>
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="bg-[#4F27E9] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-lg shadow-lg">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="space-y-6">
                            {notifications && notifications.length > 0 ? (
                                notifications
                                    .slice(0, 3)
                                    .map((notif, i) => (
                                        <div key={notif.id || i} className="group cursor-pointer">
                                            <p className={`text-[11px] font-black ${!notif.is_read ? 'text-[#4F27E9]' : 'text-gray-400'} uppercase tracking-[0.2em] mb-1`}>
                                                {notif.type || 'Alert'}
                                            </p>
                                            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <p className="text-[9px] font-black text-gray-300 mt-2 uppercase tracking-tight">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-xs text-gray-400 font-medium">No recent notifications.</p>
                            )}
                        </div>
                        <NavLink 
                            to={profile?.role?.toUpperCase() === 'ADMIN' ? "/admin/notifications" : "/user/notifications"}
                            className="w-full mt-10 bg-[#4F27E9] text-white hover:bg-[#3D1DB3] border-none text-[11px] font-black tracking-widest h-12 rounded-2xl flex items-center justify-center transition-all shadow-[0_8px_20px_-5px_rgba(79,39,233,0.4)]"
                        >
                            VIEW ALL ALERTS
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
