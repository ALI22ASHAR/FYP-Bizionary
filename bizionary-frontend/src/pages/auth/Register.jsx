import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    Lock,
    Mail,
    UserCheck,
    Eye,
    EyeOff,
    Package,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import Logo from '../../components/common/Logo';
import { API_BASE_URL } from '../../services/api';

const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleName, setRoleName] = useState('Admin');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            // Using standard axios directly
            const response = await fetch(`${API_BASE_URL}auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    username,
                    email,
                    password,
                    role_name: roleName
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('Account registered successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                if (data.errors) {
                    const msgs = Object.entries(data.errors)
                        .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
                        .join('; ');
                    setError(msgs);
                } else {
                    setError(data.error || 'Registration failed. Please check details and try again.');
                }
            }
        } catch (err) {
            setError('Registration failed. Connection error.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex bg-card font-sans overflow-hidden">
            {/* Left Column — solid black brand panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-[#111111] relative text-card flex-col justify-between p-10 overflow-hidden select-none h-full">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none"></div>
                <div className="absolute top-[20%] -right-28 w-[480px] h-[480px] pointer-events-none select-none opacity-[0.04]">
                    <Logo className="w-full h-full stroke-current" />
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <Logo className="h-9 w-auto text-card" />
                    <span className="text-base font-black tracking-widest uppercase text-card">Bizionary</span>
                </div>
                <div className="my-auto relative z-10 max-w-md space-y-4">
                    <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-card">
                        Create Your<br />Bizionary ERP Account
                    </h1>
                    <p className="text-xs text-card/60 leading-relaxed font-medium">
                        Setup your store, manage inventory, handle accountant general ledger statements, and configure sales registers.
                    </p>
                </div>
                <div className="space-y-4 relative z-10">
                    {[
                        { icon: Package, title: 'Role-Based Access Control', desc: 'Secure modules mapped to your exact designation.' },
                        { icon: TrendingUp, title: 'Real-time Analytics', desc: 'Track sales, invoices, and purchases reports instantly.' },
                        { icon: ShieldCheck, title: 'Local Device Security', desc: 'Data is securely stored and managed on your local database.' },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3">
                            <div className="bg-card/10 p-2 rounded-xl border border-card/8 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-card" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-card">{title}</h3>
                                <p className="text-[11px] text-card/50 mt-0.5 font-medium">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column — white form panel */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-6 md:px-12 lg:px-16 bg-card relative h-full overflow-y-auto">
                <div className="w-full max-w-md space-y-6 my-auto">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-3">
                            <Logo className="h-10 w-auto text-primary" />
                            <span className="text-xl font-black text-primary tracking-widest uppercase">Bizionary</span>
                        </div>
                        <h2 className="text-lg font-bold text-primary mt-4 tracking-tight">
                            Register a new account
                        </h2>
                        <p className="text-secondary mt-1.5 text-xs font-semibold">
                            Select your screen designation to configure access permissions.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3.5 rounded-xl bg-status-info/10 text-status-info border border-rose-100 text-xs font-semibold">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-primary uppercase tracking-wider pl-0.5">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="block w-full px-4 py-3 border border-card rounded-xl outline-none bg-page focus:bg-card text-primary shadow-sm text-sm"
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-primary uppercase tracking-wider pl-0.5">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="block w-full px-4 py-3 border border-card rounded-xl outline-none bg-page focus:bg-card text-primary shadow-sm text-sm"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-primary uppercase tracking-wider pl-0.5">Username</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-4 pr-12 py-3 border border-card rounded-xl outline-none bg-page focus:bg-card text-primary shadow-sm text-sm"
                                    placeholder="johndoe"
                                    required
                                />
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-primary uppercase tracking-wider pl-0.5">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-4 pr-12 py-3 border border-card rounded-xl outline-none bg-page focus:bg-card text-primary shadow-sm text-sm"
                                    placeholder="john@example.com"
                                    required
                                />
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-primary uppercase tracking-wider pl-0.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-4 pr-20 py-3 border border-card rounded-xl outline-none bg-page focus:bg-card text-primary shadow-sm text-sm"
                                    placeholder="••••••••"
                                    required
                                    minLength="6"
                                />
                                <Lock className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-secondary p-1 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-primary uppercase tracking-wider pl-0.5">Register Designation (Role)</label>
                            <div className="relative">
                                <select
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    className="block w-full pl-4 pr-12 py-3 border border-card rounded-xl outline-none bg-page focus:bg-card text-primary shadow-sm text-sm cursor-pointer"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Inventory Manager">Inventory Manager</option>
                                    <option value="Sales Manager">Sales Manager</option>
                                    <option value="Accountant">Accountant</option>
                                </select>
                                <UserCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#111111] hover:bg-black text-white py-3.5 px-4 rounded-xl font-bold transition-all shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
                        >
                            {isLoading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-xs text-secondary font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-bold">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
