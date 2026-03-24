import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Mail, Lock, Building, ArrowRight, Sparkles } from 'lucide-react';
import mascot1 from '../assets/mascot_1.png';
import mascot3 from '../assets/mascot_3.png';
import mascot4 from '../assets/mascot_4.png';
import mascot5 from '../assets/mascot_5.png';
import logo from '../assets/pucho_logo_login.png';

// Floating Mascot Component (Consistent with Login)
const Mascot = ({ imageSrc, delay, x, y, size = "w-10 h-10 lg:w-14 lg:h-14", cursorColor = "text-blue-500", cursorRotation = "0deg" }) => {
    return (
        <div
            className={`absolute ${x} ${y} z-20 animate-float transition-all duration-300 hover:scale-110 hover:rotate-6 cursor-pointer pointer-events-auto`}
            style={{ animationDelay: `${delay}s` }}
        >
            <div className={`${size} rounded-full overflow-hidden shadow-lg relative bg-white/50 backdrop-blur-sm border border-white/40`}>
                <img src={imageSrc} alt="User" className="w-full h-full object-cover" />
            </div>
            <div className={`absolute -bottom-2 -right-2 lg:-bottom-3 lg:-right-3 ${cursorColor} drop-shadow-md`} style={{ transform: `rotate(${cursorRotation})` }}>
                <svg className="w-4 h-4 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 3.5L10.5 20.5L13.5 13.5L20.5 10.5L3.5 3.5Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        department: 'Sales',
        role: 'EMPLOYEE' // Default role
    });

    const [showOtherDept, setShowOtherDept] = useState(false);
    const [customDept, setCustomDept] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const finalDept = showOtherDept ? customDept : formData.department;
        if (showOtherDept && !customDept) {
            setError('Please specify your department');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);

        try {
            setLoading(true);
            setError('');

            const result = await signUp(formData.email, formData.password, { 
                full_name: formData.full_name,
                department: finalDept,
                role: formData.role
            });
            
            if (result.success) {
                showToast('Account created! Entering dashboard...', 'success');
            } else {
                setError(result.message || 'Registration failed.');
                showToast(result.message || 'Registration failed', 'error');
            }
        } catch (err) {
            console.error('Unified signup failure:', err);
            setError(err.message || 'An unexpected error occurred during signup');
            showToast('Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white relative flex items-center justify-center p-4 overflow-hidden font-sans text-gray-900">
            {/* Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none hidden sm:block"
                style={{
                    backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}>
            </div>

            {/* Ambient Gradients */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>

            {/* Floating Mascots */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
                <div className="absolute top-[2%] lg:top-[21%] left-[1%] lg:left-[4.5%]">
                    <Mascot imageSrc={mascot1} delay={0} cursorColor="text-blue-500" cursorRotation="-15deg" />
                </div>
                <div className="absolute bottom-[2%] lg:bottom-[16%] left-[2%] lg:left-[8%]">
                    <Mascot imageSrc={mascot3} delay={0.8} cursorColor="text-orange-500" cursorRotation="-5deg" />
                </div>
                <div className="absolute top-[1.5%] lg:top-[18%] right-[2%] lg:right-[8%]">
                    <Mascot imageSrc={mascot5} delay={1.5} cursorColor="text-purple-500" cursorRotation="15deg" />
                </div>
                <div className="absolute bottom-[2%] lg:bottom-[17%] right-[1%] lg:right-[4.5%]">
                    <Mascot imageSrc={mascot4} delay={2.2} cursorColor="text-green-500" cursorRotation="20deg" />
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-24 relative z-10 items-center">
                {/* Left Side - Marketing */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:pl-16">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Pucho.ai" className="h-10 md:h-11" />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="text-sm md:text-base font-bold text-[#111834]">Conference Room Booking Application</div>
                            <div className="text-[8px] md:text-[10px] font-black text-purple-600 tracking-[0.2em] uppercase">POWERED BY AI AGENTS</div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-[#111834] leading-[0.95] tracking-tighter">
                            Build.<br />
                            <span className="text-[#8b5cf6]">Automate.</span><br />
                            Scale.
                        </h1>
                        <p className="text-gray-500 text-sm md:text-lg leading-relaxed max-w-sm md:max-w-md">
                            From data to working intelligence. Access your command center to manage automated customer communication flows.
                        </p>
                    </div>
                </div>

                {/* Right Side - Register Card */}
                <div className="flex justify-center lg:justify-end">
                    <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] w-full max-w-[440px] border border-gray-50 relative overflow-hidden">
                        <div className="mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#111834]">Create Account</h2>
                            <p className="text-gray-400 text-sm mt-1">Join the command center to manage your flows.</p>
                        </div>

                        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Full Name</label>
                                <Input prefix={<User size={18} />} value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="Enter Full Name" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Email</label>
                                <Input prefix={<Mail size={18} />} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Enter Email Address" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 ml-1">Department</label>
                                    <select 
                                        value={showOtherDept ? 'Other' : formData.department} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'Other') {
                                                setShowOtherDept(true);
                                            } else {
                                                setShowOtherDept(false);
                                                setFormData({...formData, department: val});
                                            }
                                        }} 
                                        className="w-full h-12 bg-white border border-gray-200 px-4 rounded-xl text-sm focus:ring-2 focus:ring-pucho-blue outline-none transition-all"
                                    >
                                        <option>Sales</option>
                                        <option>Engineering</option>
                                        <option>Marketing</option>
                                        <option>HR</option>
                                        <option>Design</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 ml-1">Account Type (Role)</label>
                                    <select 
                                        value={formData.role} 
                                        onChange={(e) => setFormData({...formData, role: e.target.value})} 
                                        className="w-full h-12 bg-white border border-gray-200 px-4 rounded-xl text-sm font-bold text-pucho-blue focus:ring-2 focus:ring-pucho-blue outline-none transition-all"
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Password</label>
                                <Input prefix={<Lock size={18} />} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                            </div>

                            {/* Conditional Manual Department Input */}
                            {showOtherDept && (
                                <div className="space-y-1 animate-slide-up">
                                    <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Specify Other Department</label>
                                    <Input 
                                        prefix={<Building size={18} />} 
                                        value={customDept} 
                                        onChange={(e) => setCustomDept(e.target.value)} 
                                        placeholder="e.g. Operations" 
                                        className="border-pucho-blue"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 md:h-14 flex items-center justify-center gap-2 rounded-xl transition-all font-bold text-white shadow-xl disabled:opacity-70 mt-2"
                                style={{ background: 'linear-gradient(180deg, #4F27E9 0%, #2A09B5 100%)', boxShadow: '0 10px 25px -5px rgba(79, 39, 233, 0.4)' }}
                            >
                                {loading ? 'Creating...' : 'Sign Up Free'}
                                {!loading && <ArrowRight className="w-5 h-5" strokeWidth={3} />}
                            </button>
                        </form>

                        <div className="mt-8 text-center border-t pt-6 border-gray-100">
                            <p className="text-gray-500 text-sm font-medium">
                                Already have an account? <Link to="/login" className="text-[#4F27E9] font-bold hover:underline">Log in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
