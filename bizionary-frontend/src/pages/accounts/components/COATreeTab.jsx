import React, { useState, useEffect, useMemo } from 'react';
import { Folder, FolderOpen, FileText, ChevronDown, ChevronRight, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { accountsApi } from '../../../services/accountsApi';
import { formatPKR } from '../../../utils/currency';

const AccountNode = ({ 
    node, 
    level = 0, 
    expandedNodes, 
    toggleExpand,
    customColumns,
    balanceOverrides,
    customCellValues,
    editingCell,
    startEditing,
    renderCell,
    getAccountBalance,
    handleDeleteAccount
}) => {
    const isGroup = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    
    // Color scheme based on account type
    const getTypeColor = (type) => {
        switch(type) {
            case 'ASSET': return 'text-status-success bg-status-success/10 border-emerald-100';
            case 'LIABILITY': return 'text-rose-750 bg-status-info/10 border-rose-100';
            case 'EQUITY': return 'text-violet-750 bg-violet-50 border-violet-100';
            case 'REVENUE': return 'text-blue-750 bg-active-pill/20 border-blue-100';
            case 'EXPENSE': return 'text-amber-750 bg-amber-50 border-amber-100';
            default: return 'text-slate-650 bg-page border-card';
        }
    };

    const currentBalance = getAccountBalance(node);

    return (
        <div className="select-none">
            <div 
                className={`grid items-center gap-4 p-2.5 my-1 rounded-xl transition-all border border-transparent hover:border-card/60 hover:bg-page/85 cursor-pointer`}
                style={{ 
                    gridTemplateColumns: `1fr 100px 140px ${customColumns.map(() => '120px').join(' ')}` 
                }}
                onClick={(e) => {
                    if (isGroup) {
                        toggleExpand(node.id);
                    }
                }}
            >
                {/* Column 1: Account Code & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <div style={{ width: `${level * 20}px` }} className="flex-shrink-0" />
                    {isGroup ? (
                        <button className="text-secondary hover:text-primary p-0.5 rounded transition-colors flex-shrink-0">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    ) : (
                        <div className="w-5 flex-shrink-0" />
                    )}
                    
                    {isGroup ? (
                        isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                            <Folder className="w-4 h-4 text-primary/80 flex-shrink-0" />
                        )
                    ) : (
                        <FileText className="w-4 h-4 text-secondary flex-shrink-0" />
                    )}

                    <span className="text-[10px] font-bold font-mono text-secondary bg-page px-1.5 py-0.5 rounded flex-shrink-0">
                        {node.code}
                    </span>
                    <span className={`text-sm font-bold truncate ${isGroup ? 'text-primary' : 'text-secondary'} flex items-center`}>
                        <span className="truncate">{node.name}</span>
                        {node.isCustom && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteAccount(node.code); }}
                                className="ml-2 text-rose-500 hover:text-rose-700 font-bold transition-all text-[10px] cursor-pointer"
                                title="Delete custom account"
                            >
                                🗑️
                            </button>
                        )}
                    </span>
                </div>

                {/* Column 2: Account Type */}
                <div className="flex items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(node.account_type)}`}>
                        {node.account_type}
                    </span>
                </div>

                {/* Column 3: Balance */}
                <div className="text-right">
                    {renderCell(node, 'balance')}
                </div>

                {/* Additional dynamic columns */}
                {customColumns.map((col, idx) => (
                    <div key={idx} className="text-right">
                        {renderCell(node, col)}
                    </div>
                ))}
            </div>

            {isGroup && isExpanded && (
                <div className="transition-all duration-300 animate-in slide-in-from-top-2">
                    {node.children.map(child => (
                        <AccountNode 
                            key={child.id} 
                            node={child} 
                            level={level + 1} 
                            expandedNodes={expandedNodes} 
                            toggleExpand={toggleExpand}
                            customColumns={customColumns}
                            balanceOverrides={balanceOverrides}
                            customCellValues={customCellValues}
                            editingCell={editingCell}
                            startEditing={startEditing}
                            renderCell={renderCell}
                            getAccountBalance={getAccountBalance}
                            handleDeleteAccount={handleDeleteAccount}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const filterNonZeroAccounts = (nodes) => {
    if (!nodes) return [];
    return nodes
        .map(node => {
            if (node.children && node.children.length > 0) {
                const filteredChildren = filterNonZeroAccounts(node.children);
                if (filteredChildren.length > 0 || Number(node.balance || 0) !== 0 || node.isCustom) {
                    return {
                        ...node,
                        children: filteredChildren
                    };
                }
                return null;
            } else {
                return (Number(node.balance || 0) !== 0 || node.isCustom) ? node : null;
            }
        })
        .filter(Boolean);
};

const mergeCustomAccounts = (tree, customAccts) => {
    if (!customAccts || customAccts.length === 0) return tree;

    const clonedTree = JSON.parse(JSON.stringify(tree));
    const nodeMap = {};
    
    const buildMap = (nodes) => {
        nodes.forEach(node => {
            nodeMap[node.code] = node;
            if (node.children) {
                buildMap(node.children);
            }
        });
    };
    buildMap(clonedTree);

    const sortedCustom = [...customAccts].sort((a, b) => a.code.localeCompare(b.code));

    sortedCustom.forEach(acct => {
        const node = {
            id: `custom-${acct.code}`,
            code: acct.code,
            name: acct.name,
            account_type: acct.account_type,
            balance: acct.balance,
            isCustom: true,
            children: []
        };
        
        nodeMap[acct.code] = node;

        if (acct.parent_code && nodeMap[acct.parent_code]) {
            const parent = nodeMap[acct.parent_code];
            if (!parent.children) parent.children = [];
            if (!parent.children.some(c => c.code === acct.code)) {
                parent.children.push(node);
                parent.children.sort((a, b) => a.code.localeCompare(b.code));
            }
        } else {
            if (!clonedTree.some(r => r.code === acct.code)) {
                clonedTree.push(node);
            }
        }
    });

    clonedTree.sort((a, b) => a.code.localeCompare(b.code));
    return clonedTree;
};

const COATreeTab = ({ refreshTrigger, dateRange, startDate, endDate }) => {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState({});

    // Custom columns state
    const [customColumns, setCustomColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_custom_columns_coa');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Custom accounts / rows state
    const [customAccounts, setCustomAccounts] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_custom_accounts_coa');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Balance overrides state
    const [balanceOverrides, setBalanceOverrides] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_coa_balance_overrides');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Custom cell values state
    const [customCellValues, setCustomCellValues] = useState(() => {
        try {
            const saved = localStorage.getItem('bizionary_coa_custom_cells');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Editing states
    const [editingCell, setEditingCell] = useState(null); // { code, column }
    const [editingValue, setEditingValue] = useState('');

    useEffect(() => {
        localStorage.setItem('bizionary_custom_columns_coa', JSON.stringify(customColumns));
    }, [customColumns]);

    useEffect(() => {
        localStorage.setItem('bizionary_custom_accounts_coa', JSON.stringify(customAccounts));
    }, [customAccounts]);

    useEffect(() => {
        localStorage.setItem('bizionary_coa_balance_overrides', JSON.stringify(balanceOverrides));
    }, [balanceOverrides]);

    useEffect(() => {
        localStorage.setItem('bizionary_coa_custom_cells', JSON.stringify(customCellValues));
    }, [customCellValues]);

    const handleAddColumn = () => {
        const colName = prompt("Enter new column name:");
        if (colName && colName.trim()) {
            const trimmed = colName.trim();
            if (!customColumns.includes(trimmed) && trimmed !== 'Account Code' && trimmed !== 'Account Name' && trimmed !== 'Balance') {
                setCustomColumns([...customColumns, trimmed]);
            }
        }
    };

    const handleDeleteColumn = (colName) => {
        if (window.confirm(`Are you sure you want to delete the column "${colName}"?`)) {
            setCustomColumns(customColumns.filter(c => c !== colName));
            const newCells = { ...customCellValues };
            Object.keys(newCells).forEach(key => {
                if (key.endsWith(`_${colName}`)) {
                    delete newCells[key];
                }
            });
            setCustomCellValues(newCells);
        }
    };

    const handleAddAccount = () => {
        const code = prompt("Enter unique account code (e.g. 1020):");
        if (!code || !code.trim()) return;
        const trimmedCode = code.trim();

        if (customAccounts.some(a => a.code === trimmedCode)) {
            alert("An account with that code already exists!");
            return;
        }

        const name = prompt("Enter account name (e.g. Petty Cash):");
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();

        const type = prompt("Enter account type (ASSET, LIABILITY, EQUITY, REVENUE, or EXPENSE):", "ASSET");
        if (!type) return;
        const upperType = type.trim().toUpperCase();
        if (!['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].includes(upperType)) {
            alert("Invalid account type! Must be ASSET, LIABILITY, EQUITY, REVENUE, or EXPENSE.");
            return;
        }

        const parentCode = prompt("Enter parent account code (optional, e.g. 1000):");
        const trimmedParent = parentCode ? parentCode.trim() : "";

        const balStr = prompt("Enter initial balance (PKR):", "0");
        const balance = parseFloat(balStr) || 0.0;

        const newAccount = {
            code: trimmedCode,
            name: trimmedName,
            account_type: upperType,
            parent_code: trimmedParent,
            balance: balance,
            isCustom: true
        };

        setCustomAccounts([...customAccounts, newAccount]);
    };

    const handleDeleteAccount = (code) => {
        if (window.confirm(`Are you sure you want to delete custom account "${code}"?`)) {
            setCustomAccounts(customAccounts.filter(a => a.code !== code));
            
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

    const getAccountBalance = (node) => {
        const hasOverride = balanceOverrides[node.code] !== undefined;
        if (hasOverride) {
            return parseFloat(balanceOverrides[node.code]) || 0;
        }
        if (node.children && node.children.length > 0) {
            return node.children.reduce((sum, child) => sum + getAccountBalance(child), 0);
        }
        return parseFloat(node.balance) || 0;
    };

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

    const renderCell = (node, column) => {
        const isEditing = editingCell && editingCell.code === node.code && editingCell.column === column;
        const isBalanceCol = column === 'balance';
        const isGroup = node.children && node.children.length > 0;
        
        const currentValue = isBalanceCol 
            ? getAccountBalance(node)
            : (customCellValues[`${node.code}_${column}`] || '');

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
                    onClick={(e) => e.stopPropagation()}
                />
            );
        }

        const isOverridden = isBalanceCol && balanceOverrides[node.code] !== undefined;

        return (
            <div 
                onClick={(e) => {
                    if (isBalanceCol && isGroup) return;
                    e.stopPropagation();
                    startEditing(node.code, column, currentValue);
                }}
                className={`px-2 py-0.5 rounded transition-colors group flex justify-end items-center gap-1.5 ${isBalanceCol ? 'font-mono text-right font-bold text-primary' : 'text-secondary'} ${(!isBalanceCol || !isGroup) ? 'cursor-pointer hover:bg-page/75' : ''}`}
            >
                <span>
                    {isBalanceCol ? formatPKR(currentValue) : (currentValue || <span className="text-secondary/40 italic">Add...</span>)}
                </span>
                {isOverridden && isBalanceCol && (
                    <span 
                        title="Manual override active. Click to edit or clear." 
                        className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block cursor-pointer animate-pulse"
                        onClick={(e) => {
                            e.stopPropagation();
                            const newOverrides = { ...balanceOverrides };
                            delete newOverrides[node.code];
                            setBalanceOverrides(newOverrides);
                        }}
                    />
                )}
            </div>
        );
    };

    // Merge dynamic custom accounts into standard tree hierarchy
    const mergedTreeData = useMemo(() => {
        return mergeCustomAccounts(treeData, customAccounts);
    }, [treeData, customAccounts]);

    // Memoize the filtered active accounts tree
    const activeTreeData = useMemo(() => filterNonZeroAccounts(mergedTreeData), [mergedTreeData]);

    const fetchTree = async () => {
        try {
            setLoading(true);
            const res = await accountsApi.getCOATree(dateRange, startDate, endDate);
            if (res.data?.success) {
                const rawData = res.data.data || [];
                setTreeData(rawData);
                
                const activeTree = filterNonZeroAccounts(mergeCustomAccounts(rawData, customAccounts));
                const defaultExpanded = {};
                activeTree.forEach(node => {
                    defaultExpanded[node.id] = true;
                });
                setExpandedNodes(defaultExpanded);
            }
        } catch (error) {
            console.error('Failed to fetch CoA tree:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTree();
    }, [refreshTrigger, dateRange, startDate, endDate]);

    const toggleExpand = (id) => {
        setExpandedNodes(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const expandAll = () => {
        const expanded = {};
        const recurse = (nodes) => {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    expanded[node.id] = true;
                    recurse(node.children);
                }
            });
        };
        recurse(activeTreeData);
        setExpandedNodes(expanded);
    };

    const collapseAll = () => {
        setExpandedNodes({});
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-3 rounded-2xl border border-card shadow-sm">
                <div className="flex gap-2">
                    <button 
                        onClick={handleAddColumn}
                        className="flex items-center gap-1.5 bg-page hover:bg-active-pill text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        + Add Column
                    </button>
                    <button 
                        onClick={handleAddAccount}
                        className="flex items-center gap-1.5 bg-[#003A6B] hover:bg-[#002b50] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        + Add Row
                    </button>
                    <button 
                        onClick={expandAll}
                        className="flex items-center gap-1.5 bg-page hover:bg-active-pill text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Expand All
                    </button>
                    <button 
                        onClick={collapseAll}
                        className="flex items-center gap-1.5 bg-page hover:bg-active-pill text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <EyeOff className="w-3.5 h-3.5" />
                        Collapse All
                    </button>
                </div>
                <button 
                    onClick={fetchTree}
                    className="flex items-center justify-center p-1.5 bg-page hover:bg-active-pill text-secondary rounded-xl transition-all cursor-pointer"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-secondary font-bold">Compiling Chart of Accounts ledger balances...</p>
                </div>
            ) : activeTreeData.length === 0 ? (
                <div className="empty-state-message text-center py-20 font-bold text-secondary bg-card rounded-2xl border border-card p-6">
                    No matching database records found for this period.
                </div>
            ) : (
                <div className="bg-card p-6 rounded-2xl border border-card shadow-sm space-y-1 overflow-x-auto">
                    {/* Header Row for Tree Grid */}
                    <div 
                        className="grid gap-4 px-4 py-2 border-b border-card bg-page/70 text-secondary font-bold text-xs uppercase tracking-wider rounded-t-xl mb-2"
                        style={{
                            gridTemplateColumns: `1fr 100px 140px ${customColumns.map(() => '120px').join(' ')}`
                        }}
                    >
                        <div className="pl-4">Account Code & Name</div>
                        <div>Type</div>
                        <div className="text-right pr-4">Balance</div>
                        {customColumns.map((col, idx) => (
                            <div key={idx} className="text-right relative group pr-4">
                                <span>{col}</span>
                                <button 
                                    onClick={() => handleDeleteColumn(col)}
                                    className="ml-1 text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0.5 right-0.5 text-[10px] cursor-pointer"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {activeTreeData.map(node => (
                        <AccountNode 
                            key={node.id} 
                            node={node} 
                            expandedNodes={expandedNodes} 
                            toggleExpand={toggleExpand} 
                            customColumns={customColumns}
                            balanceOverrides={balanceOverrides}
                            customCellValues={customCellValues}
                            editingCell={editingCell}
                            startEditing={startEditing}
                            renderCell={renderCell}
                            getAccountBalance={getAccountBalance}
                            handleDeleteAccount={handleDeleteAccount}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default COATreeTab;
