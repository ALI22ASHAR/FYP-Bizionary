import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    Search,
    Moon,
    Sun,
    ChevronDown,
    LogOut,
    User,
    Settings,
    History,
    Sliders,
    Bell,
    AlertCircle,
    TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import api from '../../services/api';
import Logo from '../common/Logo';

const Topbar = () => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { isCollapsed, toggleCollapsed, setMobileOpen } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();
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
                
                // Process demand alerts
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
                
                // Process stock alerts
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

    const getActiveWorkspaceName = () => {
        const path = location.pathname;
        if (path === '/') return 'Home';
        if (path.startsWith('/accounts')) return 'Accounting';
        if (path.startsWith('/products')) return 'Products';
        if (path.startsWith('/inventory-managment')) return 'Stock';
        if (path.startsWith('/sales')) return 'Selling';
        if (path.startsWith('/ordered-slips')) return 'Buying';
        if (path.startsWith('/chatbot')) return 'AI Chatbot';
        if (path.startsWith('/user-management')) return 'Admin';
        return 'Home';
    };

    const isAccountant = user?.role_name === 'Accountant';

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

    return (
        <header className="h-12 flex items-center justify-between px-4 md:px-6 bg-page border-b border-card shrink-0 z-30 print:hidden">

            {/* Left — hamburger toggle */}
            <div className="flex items-center gap-2">
                {/* Desktop toggle button + Logo (only visible when sidebar is collapsed) */}
                {isCollapsed && (
                    <div className="hidden lg:flex items-center gap-2 mr-2">
                        <button
                            onClick={toggleCollapsed}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-active-pill/30 rounded-xl transition-colors cursor-pointer"
                            aria-label="Open navigation"
                        >
                            <Menu className="w-4.5 h-4.5" />
                        </button>
                        <Logo className="h-6 w-auto text-primary shrink-0" />
                        <span className="text-sm font-black text-primary tracking-wider uppercase">
                            Bizionary
                        </span>
                    </div>
                )}
                {/* Mobile hamburger */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden p-1.5 text-secondary hover:text-primary hover:bg-active-pill/30 rounded-xl transition-colors"
                    aria-label="Open navigation"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Show page title in topbar when collapsed */}
                {isCollapsed && (
                    <span className="hidden lg:inline text-base font-bold text-primary ml-1">
                        {getActiveWorkspaceName()}
                    </span>
                )}
            </div>

            {/* Center — search */}
            <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm bg-card border border-card rounded-xl text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-active-pill focus:border-active-pill transition-all"
                    />
                </div>
            </div>

            {/* Right — profile */}
            <div className="flex items-center gap-2">
                {/* Notifications Bell Widget */}
                <div className="relative mr-1">
                    {isAlertsOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsAlertsOpen(false)}
                        />
                    )}
                    
                    <button
                        onClick={() => setIsAlertsOpen(prev => !prev)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-active-pill/30 rounded-full transition-colors relative cursor-pointer focus:outline-none flex items-center justify-center"
                        aria-label="Notifications"
                    >
                        <Bell className="w-4.5 h-4.5 text-primary" />
                        {alerts.length > 0 && (
                            <span className="absolute top-1 right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        )}
                    </button>
                    
                    {/* Alerts Dropdown Card */}
                    <div className={`
                        absolute right-0 mt-2.5 w-[calc(100vw-2.5rem)] sm:w-96 max-w-md
                        bg-card border border-card
                        rounded-2xl shadow-2xl
                        p-4 text-primary
                        z-50 flex flex-col gap-3
                        transition-all duration-200 origin-top-right
                        ${isAlertsOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible pointer-events-none'}
                    `}>
                        <div className="flex items-center justify-between border-b border-card pb-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-secondary">Active ERP Alerts</span>
                            {alerts.length > 0 && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2.5 py-0.5 rounded-full">
                                    {alerts.length} Total
                                </span>
                            )}
                        </div>

                        {/* Dropdown Tabs Filter Bar */}
                        <div className="flex items-center gap-1 bg-page/80 dark:bg-slate-900/60 p-1 rounded-full w-full border border-card">
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
                                <div className="text-center py-6 text-xs text-textMuted font-semibold">
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
                                <div className="text-center py-6 text-xs text-textMuted font-semibold">
                                    No warnings in this section.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                    {isDropdownOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsDropdownOpen(false)}
                        />
                    )}

                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-active-pill/30 transition-colors cursor-pointer select-none focus:outline-none relative z-50"
                    >
                        <div className="w-7 h-7 rounded-full bg-active-pill text-primary flex items-center justify-center font-bold text-xs uppercase">
                            {initials}
                        </div>
                        <span className="hidden sm:inline text-xs font-semibold text-primary max-w-[100px] truncate">
                            {user?.first_name || user?.username || 'User'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-secondary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    <div className={`
                        absolute right-0 mt-2 w-64 sm:w-72
                        bg-card border border-card
                        rounded-2xl shadow-2xl
                        p-4 text-primary
                        z-50 flex flex-col gap-3.5
                        transition-all duration-200 origin-top-right
                        ${isDropdownOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible pointer-events-none'}
                    `}>
                        {/* User summary */}
                        <div className="px-2 pb-3 border-b border-card flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-active-pill text-primary flex items-center justify-center font-bold text-sm uppercase">
                                {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm text-primary truncate">{displayName}</span>
                                <span className="text-[10px] text-secondary truncate">{user?.email || '—'}</span>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-secondary uppercase tracking-wider px-2 mb-1">Quick Actions</span>
                            {[
                                { icon: User, label: 'My Profile', to: '/settings' },
                                { icon: Settings, label: 'Account Settings', to: '/settings' },
                                { icon: History, label: 'Activity Log', to: isAccountant ? '/settings' : '/user-management' },
                            ].map(({ icon: Icon, label, to }) => (
                                <button
                                    key={label}
                                    onClick={() => { setIsDropdownOpen(false); navigate(to); }}
                                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left text-xs font-semibold text-primary hover:bg-active-pill/20 hover:pl-4 transition-all duration-200"
                                >
                                    <Icon className="h-3.5 w-3.5 text-secondary" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Preferences */}
                        {!isAccountant && (
                            <div className="flex flex-col gap-1.5 border-t border-card pt-3">
                                <span className="text-[9px] font-bold text-secondary uppercase tracking-wider px-2 mb-0.5">Preferences</span>
                                <button
                                    onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}
                                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left text-xs font-semibold text-primary hover:bg-active-pill/20 hover:pl-4 transition-all duration-200"
                                >
                                    <Sliders className="h-3.5 w-3.5 text-secondary" />
                                    <span>API Configuration</span>
                                </button>
                            </div>
                        )}

                        {/* Logout */}
                        <div className="border-t border-card pt-3">
                            <button
                                onClick={() => { setIsDropdownOpen(false); logout(); }}
                                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left text-xs font-bold text-status-info hover:bg-active-pill/20 hover:pl-4 transition-all duration-200"
                            >
                                <LogOut className="h-3.5 w-3.5 text-status-info" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
