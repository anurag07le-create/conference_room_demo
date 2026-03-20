import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { User, Lock, ArrowRight, Moon, Sparkles, Circle } from 'lucide-react';
import mascot1 from '../assets/mascot_1.png';
import mascot3 from '../assets/mascot_3.png';
import mascot4 from '../assets/mascot_4.png';
import mascot5 from '../assets/mascot_5.png';
import logo from '../assets/pucho_logo_login.png';


// Floating Mascot Component (Individual Images)
// Floating Mascot Component (Individual Images)
// Floating Mascot Component (Individual Images) with Gaze Tracking
const Mascot = ({ imageSrc, delay, x, y, size = "w-10 h-10 lg:w-14 lg:h-14", cursorColor = "text-blue-500", cursorRotation = "0deg" }) => {
    return (
        <div
            className={`absolute ${x} ${y} z-20 animate-float transition-all duration-300 hover:scale-110 hover:rotate-6 cursor-pointer pointer-events-auto`}
            style={{
                animationDelay: `${delay}s`
            }}
        >
            <div className={`${size} rounded-full overflow-hidden shadow-lg relative bg-white/50 backdrop-blur-sm border border-white/40`}>
                <img
                    src={imageSrc}
                    alt="User"
                    className="w-full h-full object-cover"
                />
            </div>
            <div
                className={`absolute -bottom-2 -right-2 lg:-bottom-3 lg:-right-3 ${cursorColor} drop-shadow-md`}
                style={{ transform: `rotate(${cursorRotation})` }}
            >
                <svg className="w-4 h-4 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 3.5L10.5 20.5L13.5 13.5L20.5 10.5L3.5 3.5Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

const Login = () => {
    const { login, user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && profile) {
            const role = profile.role?.toUpperCase();
            if (role === 'ADMIN') {
                navigate('/admin');
            } else if (role === 'EMPLOYEE') {
                navigate('/user');
            } else {
                setLoading(false); // Safeguard if user has no role
            }
        }
    }, [user, profile, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const result = await login(email, password);
            if (!result.success) {
                setError(result.message || 'Invalid email or password');
                setLoading(false);
            }
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white relative flex items-center justify-center p-4 overflow-hidden font-sans">
            {/* Grid Pattern - Hide on small mobile */}
            <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none hidden sm:block"
                style={{
                    backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}>
            </div>

            {/* Ambient Gradients */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>

            {/* Floating Mascots - Visible on all devices */}
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

            <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-24 relative z-10 items-center pb-8 pt-4 lg:py-0">
                {/* Left Side - Marketing (Visible on all devices) */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8 lg:pl-16 mb-2 lg:mb-0">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Pucho.ai" className="h-10 md:h-11" />
                    </div>
                    <div className="space-y-4 md:space-y-6">
                        <div className="space-y-1">
                            <div className="text-sm md:text-base font-bold text-[#111834]">Conference Room Booking Application</div>
                            <div className="text-[8px] md:text-[10px] font-black text-purple-600 tracking-[0.2em] uppercase">POWERED BY AI AGENTS</div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-[#111834] leading-[0.95] tracking-tighter">
                            Build.<br />
                            <span className="text-[#8b5cf6]">Automate.</span><br />
                            Scale.
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-md">
                            From data to working intelligence. Access your command center to manage automated customer communication flows.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4 pt-2">
                        <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#FAF9FE] border border-[#F0EDFF] rounded-full text-xs font-semibold text-[#6B46C1]">
                            <Sparkles size={14} fill="currentColor" />
                            AI Powered
                        </div>
                        <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#F0FFF4] border border-[#C6F6D5] rounded-full text-xs font-semibold text-[#2F855A]">
                            <div className="w-2 h-2 bg-[#48BB78] rounded-full animate-pulse"></div>
                            System Live
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="flex justify-center lg:justify-end">
                    <div className="bg-white p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] w-full max-w-[400px] md:max-w-[440px] border border-gray-50 relative overflow-hidden">
                        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-bold text-[#111834]">Welcome Back</h2>
                                <p className="text-gray-400 text-sm md:text-base mt-1">Log in to manage your flows.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-xs md:text-sm font-semibold text-gray-500 ml-1">Email</label>
                                <Input
                                    type="text"
                                    placeholder="admin@pucho.ai"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="!gap-0"
                                />
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-xs md:text-sm font-semibold text-gray-500 ml-1">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="!gap-0"
                                />
                            </div>

                            {error && (
                                <div className="p-3 md:p-4 rounded-xl bg-red-50 text-red-600 text-xs md:text-sm font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 md:h-[56px] flex items-center justify-center gap-2 rounded-xl md:rounded-[16px] transition-all duration-300 font-bold text-base md:text-lg text-white shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(180deg, #4F27E9 0%, #2A09B5 100%)',
                                    boxShadow: '0 10px 25px -5px rgba(79, 39, 233, 0.4)'
                                }}
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                                {!loading && <ArrowRight className="w-4 md:w-5 h-4 md:h-5" strokeWidth={3} />}
                            </button>
                        </form>

                        <div className="mt-6 md:mt-8 md:mt-10 text-center">
                            <p className="text-gray-500 text-sm font-medium">
                                Don't have an account? <Link to="/register" className="text-[#4F27E9] font-bold hover:underline">Sign up</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
