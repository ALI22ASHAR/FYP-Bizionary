import React, { useState, useEffect, useMemo } from 'react';
import { Download, Printer, RefreshCw, FileText, BarChart2 } from 'lucide-react';
import { accountsApi } from '../../../services/accountsApi';
import { formatPKR } from '../../../utils/currency';
import Logo from '../../../components/common/Logo';

const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, monthIndex, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const FinancialReportsTab = ({ refreshTrigger, dateRange, startDate, endDate }) => {
    const [reportType, setReportType] = useState('profit-loss'); // 'profit-loss' | 'balance-sheet'
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Custom Columns State (Isolated by Section)
    const [customColumns, setCustomColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_custom_columns_reports_v2');
            return saved ? JSON.parse(saved) : { assets: [], liabilities: [], equity: [] };
        } catch {
            return { assets: [], liabilities: [], equity: [] };
        }
    });

    // Custom Rows State (Isolated by Section)
    const [customRows, setCustomRows] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_custom_rows_reports_v2');
            return saved ? JSON.parse(saved) : { assets: [], liabilities: [], equity: [] };
        } catch {
            return { assets: [], liabilities: [], equity: [] };
        }
    });

    // Balance Overrides State
    const [balanceOverrides, setBalanceOverrides] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_balance_overrides');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Custom Cell Values State
    const [customCellValues, setCustomCellValues] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_custom_cells');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Active edit state
    const [editingCell, setEditingCell] = useState(null); // { code, column }
    const [editingValue, setEditingValue] = useState('');

    useEffect(() => {
        localStorage.setItem('bizionary_custom_columns_reports_v2', JSON.stringify(customColumns));
    }, [customColumns]);

    useEffect(() => {
        localStorage.setItem('bizionary_custom_rows_reports_v2', JSON.stringify(customRows));
    }, [customRows]);

    useEffect(() => {
        localStorage.setItem('bizionary_balance_overrides', JSON.stringify(balanceOverrides));
    }, [balanceOverrides]);

    useEffect(() => {
        localStorage.setItem('bizionary_custom_cells', JSON.stringify(customCellValues));
    }, [customCellValues]);

    const handleAddColumn = (section) => {
        const colName = prompt(`Enter new column name for ${section.toUpperCase()}:`);
        if (colName && colName.trim()) {
            const trimmed = colName.trim();
            const cols = customColumns[section] || [];
            if (!cols.includes(trimmed) && trimmed !== 'Account Code' && trimmed !== 'Account Name' && trimmed !== 'Balance') {
                setCustomColumns({
                    ...customColumns,
                    [section]: [...cols, trimmed]
                });
            }
        }
    };

    const handleDeleteColumn = (section, colName) => {
        if (window.confirm(`Are you sure you want to delete column "${colName}" from ${section.toUpperCase()}?`)) {
            const cols = customColumns[section] || [];
            setCustomColumns({
                ...customColumns,
                [section]: cols.filter(c => c !== colName)
            });
            const newCells = { ...customCellValues };
            Object.keys(newCells).forEach(key => {
                if (key.endsWith(`_${colName}`)) {
                    delete newCells[key];
                }
            });
            setCustomCellValues(newCells);
        }
    };

    const handleAddRow = (section) => {
        const code = prompt(`Enter unique account code for new ${section.toUpperCase()}:`);
        if (!code || !code.trim()) return;
        const trimmedCode = code.trim();

        const standardRows = (reportData && reportData[section]) || [];
        const existingRows = customRows[section] || [];
        if (existingRows.some(r => r.code === trimmedCode) || standardRows.some(r => r.code === trimmedCode)) {
            alert("An account with that code already exists!");
            return;
        }

        const name = prompt(`Enter name for new row:`);
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();

        const balStr = prompt(`Enter initial balance (PKR):`, "0");
        const balance = parseFloat(balStr) || 0.0;

        const newRow = {
            code: trimmedCode,
            name: trimmedName,
            balance: balance,
            isCustom: true
        };

        setCustomRows({
            ...customRows,
            [section]: [...existingRows, newRow]
        });
    };

    const handleDeleteRow = (section, code) => {
        if (window.confirm(`Are you sure you want to delete row "${code}"?`)) {
            const existingRows = customRows[section] || [];
            setCustomRows({
                ...customRows,
                [section]: existingRows.filter(r => r.code !== code)
            });
            
            const newOverrides = { ...balanceOverrides };
            delete newOverrides[code];
            setBalanceOverrides(newOverrides);

            const newCells = { ...customCellValues };
            Object.keys(newCells).forEach(key => {
                if (key.startsWith(`${code}_`)) {
                    delete newCells[key];
                }
            });
            setCustomCellValues(newCells);
        }
    };

    const getActiveBalance = (item) => {
        if (balanceOverrides[item.code] !== undefined) {
            return parseFloat(balanceOverrides[item.code]) || 0.0;
        }
        return parseFloat(item.balance) || 0.0;
    };

    // Merged Lists
    const mergedAssets = useMemo(() => {
        if (!reportData) return [];
        const standard = reportData.assets || [];
        const custom = customRows.assets || [];
        return [...standard, ...custom].sort((a, b) => a.code.localeCompare(b.code));
    }, [reportData, customRows.assets]);

    const mergedLiabilities = useMemo(() => {
        if (!reportData) return [];
        const standard = reportData.liabilities || [];
        const custom = customRows.liabilities || [];
        return [...standard, ...custom].sort((a, b) => a.code.localeCompare(b.code));
    }, [reportData, customRows.liabilities]);

    const mergedEquity = useMemo(() => {
        if (!reportData) return [];
        const standard = reportData.equity || [];
        const custom = customRows.equity || [];
        return [...standard, ...custom].sort((a, b) => a.code.localeCompare(b.code));
    }, [reportData, customRows.equity]);

    // Calculate dynamic totals for Balance Sheet
    const dynamicTotals = useMemo(() => {
        if (!reportData || reportType !== 'balance-sheet') return null;

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        mergedAssets.forEach(item => {
            totalAssets += getActiveBalance(item);
        });

        mergedLiabilities.forEach(item => {
            totalLiabilities += getActiveBalance(item);
        });

        mergedEquity.forEach(item => {
            totalEquity += getActiveBalance(item);
        });

        return {
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            total_equity: totalEquity,
            total_liabilities_and_equity: totalLiabilities + totalEquity
        };
    }, [reportData, reportType, balanceOverrides, mergedAssets, mergedLiabilities, mergedEquity]);

    const startEditing = (code, column, currentValue) => {
        setEditingCell({ code, column });
        setEditingValue(currentValue.toString());
    };

    const handleSaveEdit = () => {
        if (!editingCell) return;
        const { code, column } = editingCell;
        
        if (column === 'balance') {
            const val = parseFloat(editingValue);
            if (isNaN(val)) {
                const newOverrides = { ...balanceOverrides };
                delete newOverrides[code];
                setBalanceOverrides(newOverrides);
            } else {
                setBalanceOverrides({
                    ...balanceOverrides,
                    [code]: val
                });
            }
        } else {
            setCustomCellValues({
                ...customCellValues,
                [`${code}_${column}`]: editingValue
            });
        }
        setEditingCell(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const renderCell = (item, column) => {
        const isEditing = editingCell && editingCell.code === item.code && editingCell.column === column;
        const isBalanceCol = column === 'balance';
        
        const currentValue = isBalanceCol 
            ? (balanceOverrides[item.code] !== undefined ? balanceOverrides[item.code] : item.balance)
            : (customCellValues[`${item.code}_${column}`] || '');

        if (isEditing) {
            return (
                <input
                    type={isBalanceCol ? "number" : "text"}
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-page border border-primary text-primary px-2 py-0.5 rounded text-xs text-right font-mono"
                    autoFocus
                />
            );
        }

        const isOverridden = isBalanceCol && balanceOverrides[item.code] !== undefined;

        return (
            <div 
                onClick={() => startEditing(item.code, column, currentValue)}
                className={`cursor-pointer hover:bg-page/75 px-2 py-0.5 rounded transition-colors group flex justify-end items-center gap-1.5 ${isBalanceCol ? 'font-mono text-right font-bold text-primary' : 'text-secondary'}`}
            >
                <span>
                    {isBalanceCol ? formatPKR(currentValue) : (currentValue || <span className="text-secondary/40 italic">Add...</span>)}
                </span>
                {isOverridden && isBalanceCol && (
                    <span 
                        title="Manual override active. Click to edit or clear." 
                        className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            const newOverrides = { ...balanceOverrides };
                            delete newOverrides[item.code];
                            setBalanceOverrides(newOverrides);
                        }}
                    />
                )}
            </div>
        );
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            let res;
            if (reportType === 'profit-loss') {
                res = await accountsApi.getProfitLoss(dateRange, startDate, endDate);
            } else {
                res = await accountsApi.getBalanceSheet(dateRange, startDate, endDate);
            }
            if (res.data?.success) {
                setReportData(res.data.data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${reportType} report:`, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [refreshTrigger, dateRange, reportType, startDate, endDate]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        if (!reportData) return;
        
        let csvRows = [];
        let filename = '';

        if (reportType === 'profit-loss') {
            filename = `Profit_and_Loss_${startDate || 'custom'}_to_${endDate || 'custom'}.csv`;
            csvRows.push(`Profit & Loss Statement - Period: ${startDate || ''} to ${endDate || ''}`);
            csvRows.push('');
            csvRows.push('Account Code,Account Name,Balance (PKR)');
            csvRows.push('REVENUE');
            (reportData.revenue_lines || []).forEach(item => {
                csvRows.push(`${item.code},"${item.name}",${item.balance}`);
            });
            csvRows.push(`,Total Revenue,${reportData.total_revenue}`);
            csvRows.push('');
            csvRows.push('COST OF GOODS SOLD (COGS)');
            (reportData.cogs_lines || []).forEach(item => {
                csvRows.push(`${item.code},"${item.name}",${item.balance}`);
            });
            csvRows.push(`,Total COGS,${reportData.total_cogs}`);
            csvRows.push('');
            csvRows.push(`,GROSS PROFIT (${reportData.gross_profit_margin?.toFixed(1)}% margin),${reportData.gross_profit}`);
            csvRows.push('');
            csvRows.push('OPERATING EXPENSES');
            (reportData.expense_lines || []).forEach(item => {
                csvRows.push(`${item.code},"${item.name}",${item.balance}`);
            });
            csvRows.push(`,Total Operating Expenses,${reportData.total_expense}`);
            csvRows.push('');
            csvRows.push(`,NET PROFIT (${reportData.net_profit_margin?.toFixed(1)}% margin),${reportData.net_profit}`);
        } else {
            filename = `Balance_Sheet_${endDate || 'custom'}.csv`;
            csvRows.push(`Balance Sheet - As of Date: ${reportData.as_of_date || endDate || 'Current'}`);
            csvRows.push('');
            csvRows.push('Account Code,Account Name,Balance (PKR)');
            csvRows.push('ASSETS');
            (reportData.assets || []).forEach(item => {
                csvRows.push(`${item.code},"${item.name}",${item.balance}`);
            });
            csvRows.push(`,Total Assets,${reportData.total_assets}`);
            csvRows.push('');
            csvRows.push('LIABILITIES');
            (reportData.liabilities || []).forEach(item => {
                csvRows.push(`${item.code},"${item.name}",${item.balance}`);
            });
            csvRows.push(`,Total Liabilities,${reportData.total_liabilities}`);
            csvRows.push('');
            csvRows.push('EQUITY');
            (reportData.equity || []).forEach(item => {
                csvRows.push(`${item.code},"${item.name}",${item.balance}`);
            });
            csvRows.push(`,Total Equity,${reportData.total_equity}`);
            csvRows.push('');
            csvRows.push(`,TOTAL LIABILITIES & EQUITY,${reportData.total_liabilities_and_equity}`);
        }

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 print:space-y-2 print:p-0">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-3 rounded-2xl border border-card shadow-sm gap-3 print:hidden">
                <div className="flex bg-page p-1 rounded-xl">
                    <button 
                        onClick={() => setReportType('profit-loss')}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${reportType === 'profit-loss' ? 'bg-card text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                    >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Profit & Loss
                    </button>
                    <button 
                        onClick={() => setReportType('balance-sheet')}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${reportType === 'balance-sheet' ? 'bg-card text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Balance Sheet
                    </button>
                </div>
                <div className="flex gap-2">

                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 bg-page hover:bg-active-pill text-primary px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 bg-page hover:bg-active-pill text-primary px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Print Report
                    </button>
                    <button 
                        onClick={fetchReport}
                        className="flex items-center justify-center p-2 bg-page hover:bg-active-pill text-secondary rounded-xl transition-all cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-secondary font-bold">Compiling ledger balances and report lines...</p>
                </div>
            ) : (!reportData || (reportType === 'profit-loss' && (reportData.revenue || []).length === 0 && (reportData.expense || []).length === 0)) ? (
                <div className="empty-state-message text-center py-20 font-bold text-secondary bg-card rounded-2xl border border-card p-6">
                    No matching database records found for this period.
                </div>
            ) : (
                <div className="bg-card p-8 rounded-2xl border border-card shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
                    {/* Report Header */}
                    <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 print:border-b-2 print:border-slate-900">
                        <div className="flex justify-between items-center text-[10px] font-mono text-secondary uppercase tracking-widest print:text-secondary">
                            <span>Bizionary ERP Financial Reporting</span>
                            <span>Confidential - For Internal Use Only</span>
                        </div>
                        <div className="flex items-center justify-center gap-2.5 py-1">
                            <Logo className="h-9 w-auto text-primary dark:text-slate-200 print:text-primary" />
                            <span className="text-3xl font-black text-primary dark:text-slate-50 tracking-tight uppercase print:text-primary">
                                Bizionary
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-primary uppercase tracking-wide">
                            {reportType === 'profit-loss' ? 'Profit & Loss Statement' : 'Balance Sheet'}
                        </h2>
                        <p className="text-xs font-bold text-secondary uppercase tracking-wider">
                            {reportType === 'profit-loss' 
                                ? (reportData.start_date && reportData.end_date 
                                    ? `For the Period: ${formatDateLabel(reportData.start_date)} - ${formatDateLabel(reportData.end_date)}`
                                    : `For the Period: ${dateRange.replace(/_/g, ' ')}`) 
                                : `As of Date: ${reportData.as_of_date ? formatDateLabel(reportData.as_of_date) : 'Current'}`}
                        </p>
                    </div>

                    {reportType === 'profit-loss' ? (
                        /* ERP PROFIT & LOSS VIEW */
                        <div className="space-y-6">
                            {/* Section 1: Revenue */}
                            <div className="space-y-2">
                                <div className="bg-status-info text-card px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded">
                                    1. Revenue (from Sales)
                                </div>
                                <div className="border border-card/60 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-card bg-page/70 text-secondary font-bold uppercase tracking-wider">
                                                <th className="py-2 pl-4 w-24">Code</th>
                                                <th className="py-2">Account</th>
                                                <th className="py-2 pr-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(reportData.revenue_lines || []).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-page/50">
                                                    <td className="py-2.5 pl-4 font-mono text-secondary font-semibold">{item.code}</td>
                                                    <td className="py-2.5 text-primary font-bold">{item.name}</td>
                                                    <td className="py-2.5 pr-4 text-right font-mono text-status-info font-bold">{formatPKR(item.balance)}</td>
                                                </tr>
                                            ))}
                                            <tr className="border-t-2 border-blue-200 bg-active-pill/20/50 font-bold">
                                                <td className="py-3 pl-4"></td>
                                                <td className="py-3 text-blue-900 uppercase">Total Revenue</td>
                                                <td className="py-3 pr-4 text-right font-mono text-blue-900 text-sm">{formatPKR(reportData.total_revenue)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section 2: COGS */}
                            <div className="space-y-2">
                                <div className="bg-orange-500 text-card px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded">
                                    2. Cost of Goods Sold (COGS)
                                </div>
                                <div className="border border-card/60 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-card bg-page/70 text-secondary font-bold uppercase tracking-wider">
                                                <th className="py-2 pl-4 w-24">Code</th>
                                                <th className="py-2">Account</th>
                                                <th className="py-2 pr-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(reportData.cogs_lines || []).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-page/50">
                                                    <td className="py-2.5 pl-4 font-mono text-secondary font-semibold">{item.code}</td>
                                                    <td className="py-2.5 text-primary font-bold">{item.name}</td>
                                                    <td className="py-2.5 pr-4 text-right font-mono text-status-info font-bold">{formatPKR(item.balance)}</td>
                                                </tr>
                                            ))}
                                            <tr className="border-t-2 border-orange-200 bg-orange-50/50 font-bold">
                                                <td className="py-3 pl-4"></td>
                                                <td className="py-3 text-orange-900 uppercase">Total COGS</td>
                                                <td className="py-3 pr-4 text-right font-mono text-orange-900 text-sm">{formatPKR(reportData.total_cogs)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section 3: Gross Profit Subtotal */}
                            <div className={`rounded-xl p-4 flex justify-between items-center border-2 ${reportData.gross_profit >= 0 ? 'bg-status-success/10 border-card' : 'bg-status-info/10 border-card'}`}>
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-wider ${reportData.gross_profit >= 0 ? 'text-status-success' : 'text-status-info'}`}>
                                        3. Gross Profit
                                    </p>
                                    <p className="text-[10px] text-secondary mt-0.5">Revenue minus Cost of Goods Sold</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-black font-mono ${reportData.gross_profit >= 0 ? 'text-status-success' : 'text-status-info'}`}>
                                        {formatPKR(reportData.gross_profit)}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${reportData.gross_profit >= 0 ? 'bg-status-success/20 text-status-success' : 'bg-status-info/20 text-rose-800'}`}>
                                        {reportData.gross_profit_margin?.toFixed(1)}% margin
                                    </span>
                                </div>
                            </div>

                            {/* Section 4: Operating Expenses */}
                            <div className="space-y-2">
                                <div className="bg-status-info text-card px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded">
                                    4. Operating Expenses
                                </div>
                                <div className="border border-card/60 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-card bg-page/70 text-secondary font-bold uppercase tracking-wider">
                                                <th className="py-2 pl-4 w-24">Category</th>
                                                <th className="py-2">Expense Type</th>
                                                <th className="py-2 pr-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(reportData.expense_lines || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="py-4 text-center text-secondary text-xs italic">No operating expenses recorded for this period.</td>
                                                </tr>
                                            ) : (
                                                (reportData.expense_lines || []).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-page/50">
                                                        <td className="py-2.5 pl-4 font-mono text-secondary font-semibold text-[10px]">{item.code}</td>
                                                        <td className="py-2.5 text-primary font-bold">{item.name}</td>
                                                        <td className="py-2.5 pr-4 text-right font-mono text-status-info font-bold">{formatPKR(item.balance)}</td>
                                                    </tr>
                                                ))
                                            )}
                                            <tr className="border-t-2 border-card bg-status-info/10/50 font-bold">
                                                <td className="py-3 pl-4"></td>
                                                <td className="py-3 text-rose-900 uppercase">Total Operating Expenses</td>
                                                <td className="py-3 pr-4 text-right font-mono text-rose-900 text-sm">{formatPKR(reportData.total_expense)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section 5: Net Profit */}
                            <div className={`rounded-xl p-5 flex justify-between items-center border-2 ${reportData.net_profit >= 0 ? 'bg-status-success border-emerald-700' : 'bg-status-info border-rose-700'}`}>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider text-card/80">
                                        5. Net Profit / Loss
                                    </p>
                                    <p className="text-[10px] text-card/60 mt-0.5">Gross Profit minus Operating Expenses</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black font-mono text-card">
                                        {formatPKR(reportData.net_profit)}
                                    </p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-card/20 text-card">
                                        {reportData.net_profit_margin?.toFixed(1)}% net margin
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* BALANCE SHEET VIEW */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2">
                            {/* Left Column: Assets */}
                            <div className="space-y-4">
                                <div className="bg-[#003A6B] text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded print:bg-page print:text-primary">
                                    Assets
                                </div>
                                <div className="border border-card/60 rounded-2xl overflow-hidden bg-card shadow-xs print:border-card">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-card bg-page/70 text-secondary font-bold uppercase tracking-wider print:bg-page print:text-secondary">
                                                <th className="py-2 pl-4 w-24">Account Code</th>
                                                <th className="py-2">Account Name</th>
                                                {customColumns.map((col, idx) => (
                                                    <th key={idx} className="py-2 text-right relative group pr-4 w-28">
                                                        <span>{col}</span>
                                                        <button 
                                                            onClick={() => handleDeleteColumn(col)}
                                                            className="ml-1 text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0.5 right-0.5 text-[10px]"
                                                        >
                                                            ×
                                                        </button>
                                                    </th>
                                                ))}
                                                <th className="py-2 pr-4 text-right">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(reportData.assets || []).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-page/50">
                                                    <td className="py-2.5 pl-4 font-mono text-secondary font-semibold">{item.code}</td>
                                                    <td className="py-2.5 text-primary font-bold">{item.name}</td>
                                                    {customColumns.map((col, cIdx) => (
                                                        <td key={cIdx} className="py-2.5 text-right">
                                                            {renderCell(item, col)}
                                                        </td>
                                                    ))}
                                                    <td className="py-2.5 pr-4 text-right">
                                                        {renderCell(item, 'balance')}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="border-t-2 border-card font-bold bg-page/50">
                                                <td className="py-3 pl-4"></td>
                                                <td className="py-3 text-primary uppercase tracking-wide">Total Assets</td>
                                                {customColumns.map((_, idx) => <td key={idx}></td>)}
                                                <td className="py-3 pr-4 text-right font-mono text-primary text-sm border-double-bottom">
                                                    {formatPKR(dynamicTotals ? dynamicTotals.total_assets : reportData.total_assets)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right Column: Liabilities & Equity */}
                            <div className="space-y-6">
                                {/* Liabilities Section */}
                                <div className="space-y-4">
                                    <div className="bg-[#003A6B] text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded print:bg-page print:text-primary">
                                        Liabilities
                                    </div>
                                    <div className="border border-card/60 rounded-2xl overflow-hidden bg-card shadow-xs print:border-card">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-card bg-page/70 text-secondary font-bold uppercase tracking-wider print:bg-page print:text-secondary">
                                                    <th className="py-2 pl-4 w-24">Account Code</th>
                                                    <th className="py-2">Account Name</th>
                                                    {customColumns.map((col, idx) => (
                                                        <th key={idx} className="py-2 text-right relative group pr-4 w-28">
                                                            <span>{col}</span>
                                                            <button 
                                                                onClick={() => handleDeleteColumn(col)}
                                                                className="ml-1 text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0.5 right-0.5 text-[10px]"
                                                            >
                                                                ×
                                                            </button>
                                                        </th>
                                                    ))}
                                                    <th className="py-2 pr-4 text-right">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(reportData.liabilities || []).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-page/50">
                                                        <td className="py-2.5 pl-4 font-mono text-secondary font-semibold">{item.code}</td>
                                                        <td className="py-2.5 text-primary font-bold">{item.name}</td>
                                                        {customColumns.map((col, cIdx) => (
                                                            <td key={cIdx} className="py-2.5 text-right">
                                                                {renderCell(item, col)}
                                                            </td>
                                                        ))}
                                                        <td className="py-2.5 pr-4 text-right">
                                                            {renderCell(item, 'balance')}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-t-2 border-card font-bold bg-page/50">
                                                    <td className="py-3 pl-4"></td>
                                                    <td className="py-3 text-primary uppercase">Total Liabilities</td>
                                                    {customColumns.map((_, idx) => <td key={idx}></td>)}
                                                    <td className="py-3 pr-4 text-right font-mono text-primary">
                                                        {formatPKR(dynamicTotals ? dynamicTotals.total_liabilities : reportData.total_liabilities)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Equity Section */}
                                <div className="space-y-4">
                                    <div className="bg-[#003A6B] text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded print:bg-page print:text-primary">
                                        Owner's Equity
                                    </div>
                                    <div className="border border-card/60 rounded-2xl overflow-hidden bg-card shadow-xs print:border-card">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-card bg-page/70 text-secondary font-bold uppercase tracking-wider print:bg-page print:text-secondary">
                                                    <th className="py-2 pl-4 w-24">Account Code</th>
                                                    <th className="py-2">Account Name</th>
                                                    {customColumns.map((col, idx) => (
                                                        <th key={idx} className="py-2 text-right relative group pr-4 w-28">
                                                            <span>{col}</span>
                                                            <button 
                                                                onClick={() => handleDeleteColumn(col)}
                                                                className="ml-1 text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0.5 right-0.5 text-[10px]"
                                                            >
                                                                ×
                                                            </button>
                                                        </th>
                                                    ))}
                                                    <th className="py-2 pr-4 text-right">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(reportData.equity || []).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-page/50">
                                                        <td className="py-2.5 pl-4 font-mono text-secondary font-semibold">{item.code}</td>
                                                        <td className="py-2.5 text-primary font-bold">{item.name}</td>
                                                        {customColumns.map((col, cIdx) => (
                                                            <td key={cIdx} className="py-2.5 text-right">
                                                                {renderCell(item, col)}
                                                            </td>
                                                        ))}
                                                        <td className="py-2.5 pr-4 text-right">
                                                            {renderCell(item, 'balance')}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-t-2 border-card font-bold bg-page/50">
                                                    <td className="py-3 pl-4"></td>
                                                    <td className="py-3 text-primary uppercase">Total Equity</td>
                                                    {customColumns.map((_, idx) => <td key={idx}></td>)}
                                                    <td className="py-3 pr-4 text-right font-mono text-primary">
                                                        {formatPKR(dynamicTotals ? dynamicTotals.total_equity : reportData.total_equity)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Total Liabilities & Equity Summary */}
                                <div className="border border-card/60 rounded-xl overflow-hidden bg-page text-primary print:border-card">
                                    <table className="w-full border-collapse text-xs font-bold">
                                        <tbody>
                                            <tr>
                                                <td className="py-3.5 pl-4 uppercase tracking-wider">Total Liabilities & Owner's Equity</td>
                                                {customColumns.map((_, idx) => <td key={idx}></td>)}
                                                <td className="py-3.5 pr-4 text-right font-mono text-sm border-double-bottom">
                                                    {formatPKR(dynamicTotals ? dynamicTotals.total_liabilities_and_equity : reportData.total_liabilities_and_equity)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FinancialReportsTab;
