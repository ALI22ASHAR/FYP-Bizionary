import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Package, 
    Boxes, 
    FileText, 
    CreditCard, 
    ShoppingCart, 
    Lock, 
    LogOut, 
    Menu,
    ClipboardList,
    Bot,
    ChevronDown,
    User,
    Settings,
    History,
    TrendingUp,
    Bell,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [activeAlertTab, setActiveAlertTab] = useState('all');

    const handleAlertClick = (type, productName) => {
        setIsAlertsOpen(false);
        navigate(`/products?search=${encodeURIComponent(productName)}`);
    };

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const [demandRes, stockRes] = await Promise.all([
                    api.get('insights/demand-alerts/'),
                    api.get('insights/stock-warnings/')
                ]);
                
                const loadedAlerts = [];
                
                if (demandRes.data && Array.isArray(demandRes.data.data)) {
                    demandRes.data.data.forEach(item => {
                        loadedAlerts.push({
                            id: `demand-${item.product_id}`,
                            productId: item.product_id,
                            productName: item.product_name,
                            type: 'demand',
                            title: 'High Demand Signal',
                            description: `${item.product_name}: ${item.recommendation || 'Rising sales velocity detected.'}`,
                            time: 'Just now'
                        });
                    });
                }
                
                if (stockRes.data && Array.isArray(stockRes.data.data)) {
                    stockRes.data.data.forEach(item => {
                        loadedAlerts.push({
                            id: `stock-${item.product_id}`,
                            productId: item.product_id,
                            productName: item.product_name,
                            type: 'stock',
                            title: 'Low Stock Warning',
                            description: `${item.product_name} is low on stock (${item.current_stock} left, min threshold ${item.reorder_level}).`,
                            time: 'Urgent'
                        });
                    });
                }
                
                setAlerts(loadedAlerts);
            } catch (err) {
                console.error("Failed to load alerts for bell widget:", err);
            }
        };
        
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);
    const location = useLocation();
    const navigate = useNavigate();

    // Resolve display name from backend payload fields (first_name, last_name, username)
    // Works universally for every role — Admin, Accountant, Sales Manager, Inventory Manager
    const displayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : (user?.username || 'User');

    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    const isInventoryManager = user?.role_name === 'Inventory Manager';
    const isSalesManager = user?.role_name === 'Sales Manager';
    const isAccountant = user?.role_name === 'Accountant';
    const isUserAdmin = user?.role_name === 'Admin' || user?.role_level === 'ADMIN';

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Accounts', path: '/accounts', icon: CreditCard },
        { label: 'Products', path: '/products', icon: Package },
        { label: 'Stock', path: '/inventory-managment', icon: Boxes },
        { label: 'Sales', path: '/sales', icon: ShoppingCart },
        { label: 'Create Order', path: '/ordered-slips', icon: ClipboardList },
        { label: 'AI Chatbot', path: '/chatbot', icon: Bot },
        { label: 'Admin', path: '/user-management', icon: Lock }
    ].filter(item => {
        if (isInventoryManager) {
            return !['Accounts', 'Sales', 'Admin'].includes(item.label);
        }
        if (isSalesManager) {
            return !['Accounts', 'Stock', 'Admin'].includes(item.label);
        }
        if (isAccountant) {
            return !['Products', 'Stock', 'Create Order', 'Admin'].includes(item.label);
        }
        if (item.label === 'Admin') {
            return isUserAdmin;
        }
        return true;
    });

    return (
        <header className="h-16 text-card flex items-center justify-between px-3 md:px-6 z-40 sticky top-0 transition-colors duration-300 relative">
            {/* Custom Hanging Tab Background */}
            <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
                {/* Left hanging tab & slope background */}
                <svg className="absolute left-0 top-0 h-[96px] w-[240px] text-[var(--color-topbar)]" viewBox="0 0 240 96" fill="currentColor">
                    <path d="M 0 0 L 240 0 L 240 64 L 200 96 L 0 96 Z" />
                    <path d="M 0 96 L 200 96 L 240 64" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                </svg>
                {/* Right horizontal header background */}
                <div className="absolute left-[239px] right-0 top-0 h-16 bg-[var(--color-topbar)] border-b border-card/50"></div>
            </div>

            {/* Left Brand: Absolute positioned to hang down centered in the tab */}
            <div className="absolute left-0 top-0 h-24 flex items-center pl-3 md:pl-6 pr-4 gap-2.5 cursor-pointer text-card z-10" onClick={() => navigate('/')}>
                <Logo className="h-12 w-auto text-card" />
                <span className="text-base font-black text-card tracking-wider uppercase">Bizionary</span>
            </div>

            {/* Spacer to push menu and links past the logo tab */}
            <div className="w-[200px] sm:w-[240px] shrink-0 h-full pointer-events-none"></div>

            {/* Mobile Sidebar Toggle - only show on tablet/mobile */}
            <div className="flex justify-center items-center lg:hidden mr-4">
                <button 
                    onClick={onToggleSidebar}
                    aria-label="Toggle navigation menu"
                    className="p-2 text-card/80 hover:text-card hover:bg-card/10 rounded-lg transition-all"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Desktop Navigation Links - matching the screenshot exactly */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center max-w-4xl px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                isActive 
                                ? 'bg-card/20 text-card font-bold' 
                                : 'text-card/80 hover:text-card hover:bg-card/10'
                            }`}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Notifications Bell Widget */}
            <div className="relative mr-2">
                {isAlertsOpen && (
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsAlertsOpen(false)} 
                    />
                )}
                
                <button
                    onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                    className="p-2 text-card/85 hover:text-card hover:bg-card/10 rounded-full transition-all relative cursor-pointer focus:outline-none flex items-center justify-center"
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5 text-card" />
                    {alerts.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                    )}
                </button>
                
                {/* Alerts Dropdown Card */}
                <div className={`
                    absolute right-0 mt-2.5 w-[calc(100vw-2.5rem)] sm:w-96 max-w-md
                    bg-card border border-card
                    rounded-2xl shadow-2xl
                    p-4 text-primary dark:text-slate-200
                    z-50 flex flex-col gap-3
                    transition-all duration-200 origin-top-right
                    ${isAlertsOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible pointer-events-none'}
                `}>
                    <div className="flex items-center justify-between border-b border-card dark:border-slate-800 pb-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-secondary">Active ERP Alerts</span>
                        {alerts.length > 0 && (
                            <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2.5 py-0.5 rounded-full">
                                {alerts.length} Total
                            </span>
                        )}
                    </div>

                    {/* Dropdown Tabs Filter Bar */}
                    <div className="flex items-center gap-1 bg-page/80 dark:bg-slate-900/60 p-1 rounded-full w-full border border-card dark:border-slate-800">
                        <button
                            onClick={() => setActiveAlertTab('all')}
                            className={`flex-1 text-center py-1.5 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer ${
                                activeAlertTab === 'all'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-textMuted hover:text-primary hover:bg-active-pill/20'
                            }`}
                        >
                            All ({alerts.length})
                        </button>
                        <button
                            onClick={() => setActiveAlertTab('stock')}
                            className={`flex-1 text-center py-1.5 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer ${
                                activeAlertTab === 'stock'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-textMuted hover:text-rose-500 hover:bg-rose-500/5'
                            }`}
                        >
                            Stock ({alerts.filter(a => a.type === 'stock').length})
                        </button>
                        <button
                            onClick={() => setActiveAlertTab('demand')}
                            className={`flex-1 text-center py-1.5 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer ${
                                activeAlertTab === 'demand'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-textMuted hover:text-primary hover:bg-active-pill/20'
                            }`}
                        >
                            Demand ({alerts.filter(a => a.type === 'demand').length})
                        </button>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-0.5">
                        {alerts.length === 0 ? (
                            <div className="text-center py-6 text-xs text-textMuted dark:text-slate-400 font-semibold">
                                All systems operational. No warnings!
                            </div>
                        ) : (
                            alerts
                                .filter(alert => {
                                    if (activeAlertTab === 'stock') return alert.type === 'stock';
                                    if (activeAlertTab === 'demand') return alert.type === 'demand';
                                    return true;
                                })
                                .map(alert => (
                                    <div 
                                        key={alert.id} 
                                        onClick={() => handleAlertClick(alert.type, alert.productName)}
                                        className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all duration-150 cursor-pointer select-none active:scale-[0.99] ${
                                            alert.type === 'stock' 
                                            ? 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/8 hover:-translate-y-0.5 hover:shadow-xs' 
                                            : 'bg-primary/5 border-primary/10 hover:bg-primary/8 hover:-translate-y-0.5 hover:shadow-xs'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                            alert.type === 'stock' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'
                                        }`}>
                                            {alert.type === 'stock' ? <AlertCircle className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-primary truncate">{alert.title}</span>
                                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                                    alert.type === 'stock' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'
                                                }`}>{alert.time}</span>
                                            </div>
                                            <p className="text-secondary text-[11px] mt-1 leading-relaxed whitespace-normal break-words">
                                                {alert.description}
                                            </p>
                                        </div>
                                    </div>
                                ))
                        )}
                        {alerts.length > 0 && alerts.filter(alert => {
                            if (activeAlertTab === 'stock') return alert.type === 'stock';
                            if (activeAlertTab === 'demand') return alert.type === 'demand';
                            return true;
                        }).length === 0 && (
                            <div className="text-center py-6 text-xs text-textMuted dark:text-slate-400 font-semibold">
                                No warnings in this section.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Profile Dropdown Block */}
            <div className="relative">
                {/* Backdrop to close dropdown on click outside */}
                {isDropdownOpen && (
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsDropdownOpen(false)} 
                    />
                )}

                {/* Profile row trigger */}
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-card/10 transition-all duration-300 ease-in-out cursor-pointer select-none text-xs font-semibold focus:outline-none z-50 relative"
                >
                    <div className="w-8 h-8 rounded-full bg-card/20 text-card flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-card/50">
                        {initials}
                    </div>
                    <span className="hidden sm:inline text-card/90">Welcome, <strong>{user?.first_name || user?.username || 'User'}</strong></span>
                    <ChevronDown className={`h-4 w-4 text-card/80 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Card */}
                <div 
                    className={`absolute right-0 mt-2 w-64 sm:w-72 bg-card dark:bg-[color:var(--dm-surface,#243348)] rounded-2xl shadow-2xl border border-card dark:border-card/[0.08] p-4 text-primary dark:text-slate-200 z-50 flex flex-col gap-3.5 transition-all duration-200 origin-top-right ${
                        isDropdownOpen 
                            ? 'scale-100 opacity-100 visible' 
                            : 'scale-95 opacity-0 invisible pointer-events-none'
                    }`}
                >
                    {/* Section 1: User Profile Summary */}
                    <div className="px-2 py-1 border-b border-card dark:border-slate-800/80 pb-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-active-pill/30 text-[#2B2620] dark:bg-sky-500/10 dark:text-sky-450 flex items-center justify-center font-bold text-sm uppercase">
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-primary dark:text-card truncate">{displayName}</span>
                            <span className="text-[10px] text-secondary dark:text-secondary truncate">{user?.email || '—'}</span>
                        </div>
                    </div>

                    {/* Section 2: Quick Actions */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary dark:text-secondary uppercase tracking-wider px-2 mb-1">Quick Actions</span>
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                navigate('/settings');
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs font-semibold text-primary dark:text-slate-350 hover:bg-page dark:hover:bg-primary/60 hover:text-primary dark:hover:text-card hover:pl-4 transition-all duration-200 ease-in-out"
                        >
                            <User className="h-3.5 w-3.5 text-secondary" />
                            <span>My Profile</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                navigate('/settings');
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs font-semibold text-primary dark:text-slate-350 hover:bg-page dark:hover:bg-primary/60 hover:text-primary dark:hover:text-card hover:pl-4 transition-all duration-200 ease-in-out"
                        >
                            <Settings className="h-3.5 w-3.5 text-secondary" />
                            <span>Account Settings</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                navigate(isAccountant ? '/settings' : '/user-management');
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs font-semibold text-primary dark:text-slate-350 hover:bg-page dark:hover:bg-primary/60 hover:text-primary dark:hover:text-card hover:pl-4 transition-all duration-200 ease-in-out"
                        >
                            <History className="h-3.5 w-3.5 text-secondary" />
                            <span>Activity Log</span>
                        </button>
                    </div>



                    {/* Section 4: Danger Zone */}
                    <div className="border-t border-card dark:border-slate-800/80 pt-3">
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs font-bold text-status-info hover:bg-status-info/10 dark:hover:bg-rose-950/35 hover:pl-4 transition-all duration-200 ease-in-out"
                        >
                            <LogOut className="h-3.5 w-3.5 text-rose-500" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
