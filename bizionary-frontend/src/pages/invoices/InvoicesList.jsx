import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Download, Printer, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Skeleton from '../../components/ui/Skeleton';
import { formatPKR } from '../../utils/currency';
import api from '../../services/api';

const InvoicesList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('invoices/');
            let data = res.data.data || res.data;
            setInvoices(data);
        } catch (error) {
            console.warn('Failed to fetch invoices from backend.');
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (id) => {
        // Mock export functionality
        alert(`Starting download for invoice ID: ${id}. In production, this would hit /api/invoices/${id}/export/`);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredInvoices = invoices.filter(inv =>
        (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status, isOverdue) => {
        if (isOverdue) return 'text-text-secondary';
        switch (status?.toLowerCase()) {
            case 'paid': return 'text-status-success';
            case 'sent': return 'text-status-info';
            case 'draft':
            default: return 'text-text-secondary';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Invoices" subtitle="Manage customer invoices and payment tracking." />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-secondary" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-card rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-surface shadow-sm text-textMain placeholder-textMuted"
                        placeholder="Search by invoice number or client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center justify-center px-4 py-2 border border-card text-textMuted bg-surface rounded-full hover:bg-page text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center px-4 py-2 bg-card border border-card text-textMain rounded-full hover:bg-page text-sm font-bold transition-all shadow-sm w-full sm:w-auto"
                    >
                        <Printer className="h-4 w-4 mr-2 text-textMuted" />
                        Print View
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-bg-card rounded-2xl border border-border-card shadow-sm overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-6">
                        <Skeleton.TableRows count={7} cols={8} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-text-secondary text-xs uppercase tracking-wider border-b border-border-card">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Invoice #</th>
                                    <th className="px-6 py-4 font-semibold">Client</th>
                                    <th className="px-6 py-4 font-semibold">Issue Date</th>
                                    <th className="px-6 py-4 font-semibold">Due Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
                                    <th className="px-6 py-4 font-semibold text-right">Balance Due</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-card">
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button 
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="font-bold text-primary text-xs hover:underline cursor-pointer focus:outline-none"
                                            >
                                                {inv.invoice_number}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-textMain">{inv.customer_name}</td>
                                        <td className="px-6 py-4 text-textMuted">{inv.invoice_date}</td>
                                        <td className="px-6 py-4 text-textMuted">{inv.due_date}</td>
                                        <td className="px-6 py-4 font-bold text-textMain text-right">{formatPKR(inv.total_amount)}</td>
                                        <td className="px-6 py-4 font-bold text-text-primary text-right">{formatPKR(inv.balance_due)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-bold ${getStatusColor(inv.status, inv.is_overdue)}`}>
                                                {inv.is_overdue ? 'OVERDUE' : (inv.status || 'N/A').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    className="inline-flex items-center justify-center p-1.5 text-secondary hover:text-primary bg-page hover:bg-active-pill/20 rounded-xl transition-colors border border-card"
                                                    title="View Details"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleExport(inv.id)}
                                                    className="inline-flex items-center justify-center p-1.5 text-secondary hover:text-primary bg-page hover:bg-sky-50 rounded-xl transition-colors border border-card hover:border-sky-100"
                                                    title="Download PDF"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-textMuted">
                                            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p>No invoices found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invoice Details Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-card flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-card flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-primary">Invoice Details</h3>
                                <p className="text-xs text-secondary mt-0.5">#{selectedInvoice.invoice_number}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedInvoice(null)}
                                className="p-1.5 hover:bg-page rounded-lg text-secondary hover:text-primary transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-6 text-sm text-primary">
                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-page p-4 rounded-xl border border-card">
                                <div>
                                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Status</span>
                                    <div className="mt-1">
                                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                                            selectedInvoice.status === 'PAID' ? 'bg-status-success/15 text-status-success' : 'bg-rose-500/15 text-rose-500'
                                        }`}>
                                            {selectedInvoice.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Issue Date</span>
                                    <p className="font-semibold text-textMain mt-0.5">{selectedInvoice.invoice_date}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Due Date</span>
                                    <p className="font-semibold text-textMain mt-0.5">{selectedInvoice.due_date}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Balance Due</span>
                                    <p className="font-extrabold text-rose-500 mt-0.5">{formatPKR(selectedInvoice.balance_due)}</p>
                                </div>
                            </div>
                            
                            {/* Client & Billing Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">Billed To</h4>
                                    <p className="font-bold text-textMain">{selectedInvoice.customer_name}</p>
                                    {selectedInvoice.customer_email && <p className="text-secondary mt-1">{selectedInvoice.customer_email}</p>}
                                    {selectedInvoice.customer_phone && <p className="text-secondary mt-0.5">{selectedInvoice.customer_phone}</p>}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">Payment Details</h4>
                                    <p className="text-secondary">Method: <strong className="text-textMain font-semibold">Bank Transfer / Cash</strong></p>
                                    <p className="text-secondary mt-1">Paid: <strong className="text-status-success font-semibold">{formatPKR(selectedInvoice.amount_paid)}</strong></p>
                                    <p className="text-secondary mt-1">Total: <strong className="text-textMain font-semibold">{formatPKR(selectedInvoice.total_amount)}</strong></p>
                                </div>
                            </div>

                            {/* Summary Items list */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">Items Summary</h4>
                                <div className="border border-card rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-page text-secondary uppercase font-bold text-[10px] border-b border-card">
                                            <tr>
                                                <th className="px-4 py-2.5">Description</th>
                                                <th className="px-4 py-2.5 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-card">
                                            <tr>
                                                <td className="px-4 py-3 font-semibold text-textMain">
                                                    Sales Transaction Details - {selectedInvoice.notes || 'No description provided.'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-textMain">
                                                    {formatPKR(selectedInvoice.total_amount)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* Breakdown */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-1.5 border-t border-card pt-3 text-xs">
                                    <div className="flex justify-between text-secondary">
                                        <span>Subtotal</span>
                                        <span className="font-semibold">{formatPKR(selectedInvoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-secondary">
                                        <span>Discount</span>
                                        <span className="font-semibold">- {formatPKR(selectedInvoice.discount_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-secondary">
                                        <span>Tax</span>
                                        <span className="font-semibold">{formatPKR(selectedInvoice.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-textMain border-t border-card/45 pt-2 text-sm">
                                        <span>Total Amount</span>
                                        <span>{formatPKR(selectedInvoice.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-page border-t border-card flex justify-end gap-3 rounded-b-2xl">
                            <button 
                                onClick={() => setSelectedInvoice(null)}
                                className="px-4 py-2 border border-card rounded-full text-xs font-semibold text-textMuted bg-surface hover:bg-page transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedInvoice(null);
                                    handleExport(selectedInvoice.id);
                                }}
                                className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold transition-all shadow-xs hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicesList;
