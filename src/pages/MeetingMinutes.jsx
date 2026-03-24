import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, MapPin, Search, ChevronRight, MessageSquare, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

const MeetingMinutes = () => {
    const { bookings, loading: dataLoading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMinutes, setSelectedMinutes] = useState(null);

    // Filter bookings that have MoM notes
    const minutesList = (bookings || []).filter(b => b.mom_notes);
    
    const filteredMinutes = minutesList.filter(m => 
        (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.room || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-gray-900 pb-10">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#4F27E9]">Meeting Minutes</h1>
                    <p className="text-gray-500 text-sm font-medium">Browse AI-summarized discussions and decisions.</p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search summaries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
                {/* List Section */}
                <div className="lg:col-span-4 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {dataLoading ? (
                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex justify-center">
                            <div className="w-8 h-8 border-4 border-[#4F27E9]/20 border-t-[#4F27E9] rounded-full animate-spin"></div>
                        </div>
                    ) : filteredMinutes.length > 0 ? (
                        filteredMinutes.map((m) => (
                            <div 
                                key={m.id}
                                onClick={() => setSelectedMinutes(m)}
                                className={`p-4 rounded-[28px] border transition-all cursor-pointer group flex items-center gap-4 ${selectedMinutes?.id === m.id ? 'bg-[#4F27E9] border-[#4F27E9] text-white shadow-lg lg:translate-x-1' : 'bg-white border-gray-50 hover:border-[#4F27E9]/30 hover:shadow-md'}`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${selectedMinutes?.id === m.id ? 'bg-white/20' : 'bg-indigo-50 text-[#4F27E9]'}`}>
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm truncate ${selectedMinutes?.id === m.id ? 'text-white' : 'text-gray-900'}`}>{m.title}</h3>
                                    <p className={`text-[10px] mt-1 font-medium ${selectedMinutes?.id === m.id ? 'text-white/70' : 'text-gray-400'}`}>
                                        {m.date} • {m.room}
                                    </p>
                                </div>
                                <ChevronRight size={16} className={`transition-transform ${selectedMinutes?.id === m.id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-10 rounded-[32px] border border-gray-100 text-center">
                            <MessageSquare className="mx-auto w-10 h-10 text-gray-200 mb-2" />
                            <p className="text-gray-500 font-bold text-sm">No minutes found</p>
                            <p className="text-gray-400 text-[10px] mt-1">AI summaries will appear here once generated.</p>
                        </div>
                    )}
                </div>

                {/* Detail Content Section */}
                <div className="lg:col-span-8">
                    {selectedMinutes ? (
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4">
                            <div className="p-8 border-b border-gray-50 space-y-4 bg-gray-50/20">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-100">Verified by AI</span>
                                    <span className="text-xs text-gray-400 font-medium ml-auto">{selectedMinutes.startTime} - {selectedMinutes.endTime}</span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedMinutes.title}</h2>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                        <Calendar size={13} className="text-[#4F27E9]" /> {selectedMinutes.date}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                        <MapPin size={13} className="text-[#4F27E9]" /> {selectedMinutes.room}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="max-w-none">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 bg-[#4F27E9] rounded-full"></div>
                                        <h3 className="text-sm font-black text-gray-900 m-0 uppercase tracking-widest">Discussion Summary</h3>
                                    </div>
                                    
                                    {/* The MoM content itself rendered properly */}
                                    <div 
                                        className="text-gray-700 leading-relaxed space-y-4 font-medium text-sm p-6 bg-gray-50/50 rounded-3xl border border-gray-50"
                                        dangerouslySetInnerHTML={{ __html: selectedMinutes.mom_notes }}
                                    ></div>
                                </div>
                                
                                <div className="mt-8 flex items-center gap-4 p-4 bg-indigo-50/30 rounded-3xl border border-indigo-50">
                                    <Info size={16} className="text-[#4F27E9] shrink-0" />
                                    <p className="text-[11px] font-bold text-indigo-700 leading-tight">
                                        This summary was automatically sent to all {selectedMinutes.attendees} participants via email.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px] bg-white rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center p-10 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                <FileText size={28} className="text-gray-200" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Select a Meeting</h3>
                            <p className="text-gray-400 text-xs max-w-xs mt-2 font-medium">Select a completed session from the left to view the key decisions and summary report.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingMinutes;
