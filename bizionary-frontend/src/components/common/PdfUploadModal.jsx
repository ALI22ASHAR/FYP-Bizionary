import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Upload, Check, AlertCircle, Plus, Trash2, Loader2, Download } from 'lucide-react';
import api from '../../services/api';

const PdfUploadModal = ({ isOpen, onClose, onSuccess, actionType = 'stock_in' }) => {
    const [file, setFile] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Metadata fields
    const [metadata, setMetadata] = useState({
        company_name: '',
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        discount: 0,
        tax: 0,
        notes: '',
        delivery_location: 'WAREHOUSE', // for stock_in
        payment_method: 'CASH', // for sales
        category: '' // for product catalog
    });

    // Scanned items list
    const [items, setItems] = useState([]);
    const fileInputRef = useRef(null);

    // Fetch products catalog for matching dropdown
    useEffect(() => {
        if (isOpen) {
            setLoadingProducts(true);
            api.get('products/')
                .then((res) => {
                    setAllProducts(res.data || []);
                })
                .catch((err) => {
                    console.error("Failed to load products for manual match dropdown:", err);
                })
                .finally(() => {
                    setLoadingProducts(false);
                });
        }
    }, [isOpen]);

    // Handle modal close
    const handleClose = () => {
        setFile(null);
        setParsing(false);
        setParseError('');
        setParsedData(null);
        setItems([]);
        setMetadata({
            company_name: '',
            invoice_date: new Date().toISOString().split('T')[0],
            invoice_number: '',
            discount: 0,
            tax: 0,
            notes: '',
            delivery_location: 'WAREHOUSE',
            payment_method: 'CASH',
            category: ''
        });
        onClose();
    };

    // File selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
                setParseError('Please upload a PDF file.');
                return;
            }
            setFile(selectedFile);
            setParseError('');
        }
    };

    // Upload & Parse
    const handleUploadAndParse = async () => {
        if (!file) return;

        setParsing(true);
        setParseError('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action_type', actionType);

        try {
            const res = await api.post('products/parse-invoice-pdf/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const data = res.data;
            setParsedData(data);

            // Populate metadata from AI extraction
            const extractedMeta = data.metadata || {};
            setMetadata((prev) => ({
                ...prev,
                company_name: extractedMeta.company_name || '',
                invoice_date: extractedMeta.invoice_date || new Date().toISOString().split('T')[0],
                invoice_number: extractedMeta.invoice_number || '',
                discount: extractedMeta.discount || 0,
                tax: extractedMeta.tax || 0,
                notes: extractedMeta.notes || '',
                category: extractedMeta.category || ''
            }));

            // Populate items from AI extraction
            setItems(data.items || []);
        } catch (err) {
            console.error("PDF Parsing error:", err);
            setParseError(err.response?.data?.error || 'An error occurred while parsing the PDF.');
        } finally {
            setParsing(false);
        }
    };

    // Handle field updates in items
    const handleItemChange = (index, field, value) => {
        setItems((prev) =>
            prev.map((item, idx) => {
                if (idx === index) {
                    const updated = { ...item, [field]: value };
                    
                    // If matched_product_id changes, find the product and map details
                    if (field === 'matched_product_id') {
                        const prod = allProducts.find((p) => Number(p.id) === Number(value));
                        if (prod) {
                            updated.matched_product_name = prod.name;
                            updated.matched_product_sku = prod.sku;
                            updated.matched_product_stock = prod.stock_quantity;
                            updated.confidence = 'high';
                            // Sync raw name for easy overview in product mode
                            if (actionType === 'product') {
                                updated.raw_name = prod.name;
                                updated.sku = prod.sku;
                            }
                        } else {
                            updated.matched_product_name = '';
                            updated.matched_product_sku = '';
                            updated.confidence = 'none';
                        }
                    }
                    return updated;
                }
                return item;
            })
        );
    };

    // Add empty row
    const handleAddRow = () => {
        setItems((prev) => [
            ...prev,
            {
                raw_name: '',
                sku: '',
                category: metadata.category || '',
                cost_price: 0.0,
                quantity: 1,
                unit_price: 0.0,
                barcode: '',
                pack_barcode: '',
                pcs_per_pack: 12,
                discount: 0.0,
                tax: 0.0,
                matched_product_id: '',
                matched_product_name: '',
                matched_product_sku: '',
                confidence: 'none'
            }
        ]);
    };

    // Delete row
    const handleDeleteRow = (index) => {
        setItems((prev) => prev.filter((_, idx) => idx !== index));
    };

    // Submit bulk transaction
    const handleConfirmSubmit = async () => {
        if (actionType !== 'product') {
            // Validate that all items have a matched product in database for sales/stock-in
            const unmatchedItems = items.filter(item => !item.matched_product_id);
            if (unmatchedItems.length > 0) {
                setParseError("Please select a matched product from your catalog for all items before saving.");
                return;
            }
        } else {
            // Validate names for products
            const invalidItems = items.filter(item => !item.raw_name?.trim());
            if (invalidItems.length > 0) {
                setParseError("All products must have a name before importing.");
                return;
            }
        }

        setParsing(true);
        setParseError('');

        try {
            if (actionType === 'stock_in') {
                // Bulk Stock In
                const payload = {
                    delivery_location: metadata.delivery_location,
                    items: items.map((item) => ({
                        product_id: item.matched_product_id,
                        quantity: Number(item.quantity),
                        note: `AI Invoice PDF Import (Ref: ${metadata.invoice_number || 'N/A'}, Supplier: ${metadata.company_name || 'N/A'}). ${metadata.notes || ''}`.trim()
                    }))
                };
                await api.post('products/bulk-scan-stock-in/', payload);
            } else if (actionType === 'sale') {
                // Bulk Sales Creation
                const payload = {
                    sales: items.map((item) => ({
                        product_id: item.matched_product_id,
                        product_name: item.matched_product_name,
                        product_code: item.matched_product_sku,
                        quantity_sold: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        sale_date: metadata.invoice_date,
                        customer_name: metadata.company_name || 'Walk-in Customer',
                        payment_method: metadata.payment_method,
                        payment_status: 'PAID'
                    }))
                };
                await api.post('sales/bulk-upload/', payload);
            } else if (actionType === 'product') {
                // Bulk Catalog Creation/Updates
                const payload = {
                    products: items.map((item) => ({
                        name: item.raw_name,
                        sku: item.sku || '',
                        category: item.category || metadata.category || 'Beverages',
                        cost_price: Number(item.cost_price || 0.0),
                        unit_price: Number(item.unit_price || 0.0),
                        stock_quantity: Number(item.quantity || 0),
                        min_stock: 5,
                        barcode: item.barcode || '',
                        pack_barcode: item.pack_barcode || '',
                        pcs_per_pack: Number(item.pcs_per_pack || 12)
                    }))
                };
                await api.post('products/bulk-create-products/', payload);
            }

            if (onSuccess) onSuccess();
            handleClose();
        } catch (err) {
            console.error("Bulk PDF submit error:", err);
            setParseError(err.response?.data?.error || 'Failed to save parsed invoice items.');
        } finally {
            setParsing(false);
        }
    };

    // Get active template path
    const getTemplatePath = () => {
        if (actionType === 'stock_in') return '/sample_invoice_template.pdf';
        if (actionType === 'sale') return '/sample_sales_template.pdf';
        return '/sample_products_template.pdf';
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-6xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <Dialog.Title className="text-lg font-extrabold text-primary">
                            {actionType === 'stock_in' && 'AI Invoice PDF Upload / Stock In'}
                            {actionType === 'sale' && 'AI Sales Slip PDF Upload / Bulk Sale'}
                            {actionType === 'product' && 'AI Catalog PDF Upload / Product Registration'}
                        </Dialog.Title>
                        <button onClick={handleClose} className="text-secondary hover:text-primary transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {parseError && (
                            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs font-semibold text-red-500">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{parseError}</span>
                            </div>
                        )}

                        {/* Step 1: File Upload */}
                        {!parsedData && (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-accent rounded-2xl p-12 text-center bg-background/50 hover:bg-background/80 transition-all">
                                <div className="w-full max-w-md flex flex-col items-center" onClick={() => fileInputRef.current?.click()}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="application/pdf"
                                        className="hidden"
                                    />
                                    <Upload className="w-12 h-12 text-secondary mb-4 cursor-pointer" />
                                    {file ? (
                                        <div className="space-y-2 cursor-pointer">
                                            <p className="text-sm font-bold text-primary">{file.name}</p>
                                            <p className="text-xs text-secondary">({(file.size / 1024).toFixed(1)} KB)</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 cursor-pointer">
                                            <p className="text-sm font-bold text-primary">Click or drag & drop PDF sheet</p>
                                            <p className="text-xs text-secondary">Only .pdf files are supported</p>
                                        </div>
                                    )}
                                </div>

                                {/* Download sample link */}
                                <a
                                    href={getTemplatePath()}
                                    download
                                    className="inline-flex items-center gap-1.5 text-xs text-accent font-bold hover:underline bg-accent/10 px-4 py-2 rounded-full mt-6 shadow-sm hover:shadow transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download Sample PDF Template
                                </a>

                                {file && !parsing && (
                                    <button
                                        onClick={handleUploadAndParse}
                                        className="mt-6 bg-accent hover:bg-accent/90 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-accent/20 transition-all"
                                    >
                                        Extract & Parse PDF with AI
                                    </button>
                                )}

                                {parsing && (
                                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-accent">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Reading text and parsing structure using Groq AI...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Verification Grid & Fields */}
                        {parsedData && (
                            <div className="space-y-6">
                                {/* Extra Columns / Metadata form */}
                                <div className="bg-background/40 border border-border/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider">
                                            {actionType === 'product' ? 'Supplier Name' : (actionType === 'stock_in' ? 'Supplier Company Name' : 'Customer Name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={metadata.company_name}
                                            onChange={(e) => setMetadata({ ...metadata, company_name: e.target.value })}
                                            className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                            placeholder="Extracted from PDF"
                                        />
                                    </div>

                                    {actionType !== 'product' && (
                                        <>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Date</label>
                                                <input
                                                    type="date"
                                                    value={metadata.invoice_date}
                                                    onChange={(e) => setMetadata({ ...metadata, invoice_date: e.target.value })}
                                                    className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Reference / Invoice No.</label>
                                                <input
                                                    type="text"
                                                    value={metadata.invoice_number}
                                                    onChange={(e) => setMetadata({ ...metadata, invoice_number: e.target.value })}
                                                    className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                                    placeholder="e.g. INV-990"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {actionType === 'product' && (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Default Category</label>
                                            <input
                                                type="text"
                                                value={metadata.category}
                                                onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                                                className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                                placeholder="e.g. Beverages"
                                            />
                                        </div>
                                    )}

                                    {actionType === 'stock_in' && (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Delivery Destination</label>
                                            <select
                                                value={metadata.delivery_location}
                                                onChange={(e) => setMetadata({ ...metadata, delivery_location: e.target.value })}
                                                className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                            >
                                                <option value="WAREHOUSE">Warehouse Storage</option>
                                                <option value="SHOP">Shop Outlet / Direct Sale</option>
                                            </select>
                                        </div>
                                    )}

                                    {actionType === 'sale' && (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Payment Method</label>
                                            <select
                                                value={metadata.payment_method}
                                                onChange={(e) => setMetadata({ ...metadata, payment_method: e.target.value })}
                                                className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="CARD">Card</option>
                                                <option value="EASYPAY_JAZZCASH">EasyPay / JazzCash</option>
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                            </select>
                                        </div>
                                    )}

                                    {actionType !== 'product' && (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Extracted Discount (Rs)</label>
                                            <input
                                                type="number"
                                                value={metadata.discount}
                                                onChange={(e) => setMetadata({ ...metadata, discount: Number(e.target.value) })}
                                                className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className={`flex flex-col gap-1 col-span-1 ${actionType === 'product' ? 'md:col-span-2' : 'md:col-span-2 lg:col-span-3'}`}>
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Notes / Summary</label>
                                        <input
                                            type="text"
                                            value={metadata.notes}
                                            onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
                                            className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none"
                                            placeholder="Optional comments or reference info"
                                        />
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-primary uppercase tracking-wider">Extracted Products List</h3>
                                        <button
                                            onClick={handleAddRow}
                                            className="bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Row
                                        </button>
                                    </div>

                                    <div className="border border-border rounded-2xl overflow-x-auto bg-background/30">
                                        <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                                            <thead>
                                                <tr className="bg-background/70 border-b border-border text-[10px] uppercase font-black tracking-wider text-secondary">
                                                    <th className="px-4 py-3">Product Name</th>
                                                    <th className="px-4 py-3 w-32">SKU</th>
                                                    {actionType === 'product' ? (
                                                        <>
                                                            <th className="px-4 py-3 w-32">Category</th>
                                                            <th className="px-4 py-3 w-28">Cost Price</th>
                                                            <th className="px-4 py-3 w-28">Retail Price</th>
                                                            <th className="px-4 py-3 w-28">Unit Barcode</th>
                                                            <th className="px-4 py-3 w-28">Pack Barcode</th>
                                                            <th className="px-4 py-3 w-20">Multiplier</th>
                                                            <th className="px-4 py-3 w-20">Stock Qty</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-4 py-3">Catalog Match (ERP)</th>
                                                            <th className="px-4 py-3 w-24">Quantity</th>
                                                            <th className="px-4 py-3 w-28">Price / Cost</th>
                                                            <th className="px-4 py-3 w-24">Disc (Rs)</th>
                                                        </>
                                                    )}
                                                    <th className="px-4 py-3 w-16 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/60">
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-background/20 transition-colors">
                                                        {/* Product Name */}
                                                        <td className="px-4 py-2.5">
                                                            <input
                                                                type="text"
                                                                value={item.raw_name}
                                                                onChange={(e) => handleItemChange(idx, 'raw_name', e.target.value)}
                                                                className="w-full bg-transparent focus:bg-background border-none focus:ring-1 focus:ring-accent rounded px-1 py-1 font-semibold text-primary outline-none"
                                                                placeholder="Name"
                                                            />
                                                            {actionType === 'product' && (
                                                                <span className={`text-[9px] font-black uppercase mt-0.5 block px-1 ${
                                                                    item.matched_product_id 
                                                                        ? 'text-emerald-500' 
                                                                        : 'text-amber-500'
                                                                }`}>
                                                                    {item.matched_product_id ? '✓ Update Existing' : '+ New Product'}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* SKU */}
                                                        <td className="px-4 py-2.5">
                                                            <input
                                                                type="text"
                                                                value={item.sku}
                                                                onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                                                                className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary font-mono text-xs"
                                                                placeholder="e.g. SKU-123"
                                                            />
                                                        </td>

                                                        {/* Mode Specific Columns */}
                                                        {actionType === 'product' ? (
                                                            <>
                                                                {/* Category */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="text"
                                                                        value={item.category}
                                                                        onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary"
                                                                        placeholder="Beverages"
                                                                    />
                                                                </td>
                                                                {/* Cost Price */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="number"
                                                                        value={item.cost_price}
                                                                        onChange={(e) => handleItemChange(idx, 'cost_price', Number(e.target.value))}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary font-mono"
                                                                    />
                                                                </td>
                                                                {/* Retail Price */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="number"
                                                                        value={item.unit_price}
                                                                        onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary font-mono"
                                                                    />
                                                                </td>
                                                                {/* Barcode */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="text"
                                                                        value={item.barcode || ''}
                                                                        onChange={(e) => handleItemChange(idx, 'barcode', e.target.value)}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary text-xs"
                                                                        placeholder="Unit barcode"
                                                                    />
                                                                </td>
                                                                {/* Pack Barcode */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="text"
                                                                        value={item.pack_barcode || ''}
                                                                        onChange={(e) => handleItemChange(idx, 'pack_barcode', e.target.value)}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary text-xs"
                                                                        placeholder="Carton barcode"
                                                                    />
                                                                </td>
                                                                {/* Multiplier */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="number"
                                                                        value={item.pcs_per_pack || 12}
                                                                        onChange={(e) => handleItemChange(idx, 'pcs_per_pack', Number(e.target.value))}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary text-center font-bold"
                                                                    />
                                                                </td>
                                                                {/* Initial Stock Qty */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2 py-1 outline-none text-primary text-center font-bold"
                                                                    />
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Database Match selector */}
                                                                <td className="px-4 py-2.5">
                                                                    <select
                                                                        value={item.matched_product_id || ''}
                                                                        onChange={(e) => handleItemChange(idx, 'matched_product_id', e.target.value)}
                                                                        className={`w-full bg-background border rounded-lg px-2.5 py-1 text-xs outline-none ${
                                                                            item.matched_product_id 
                                                                                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' 
                                                                                : 'border-amber-500/40 text-amber-500 bg-amber-500/5'
                                                                        }`}
                                                                    >
                                                                        <option value="">-- UNMATCHED (Select Product) --</option>
                                                                        {allProducts.map((p) => (
                                                                            <option key={p.id} value={p.id}>
                                                                                {p.name} {p.sku ? `(${p.sku})` : ''}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {item.matched_product_id && (
                                                                        <span className="text-[10px] text-secondary block mt-0.5 px-1">
                                                                            Current Stock: {item.matched_product_stock} units
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                {/* Quantity */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2.5 py-1 outline-none text-primary font-bold text-center"
                                                                        min="1"
                                                                    />
                                                                </td>
                                                                {/* Price */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="number"
                                                                        value={item.unit_price}
                                                                        onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2.5 py-1 outline-none text-primary font-mono"
                                                                    />
                                                                </td>
                                                                {/* Discount */}
                                                                <td className="px-4 py-2.5">
                                                                    <input
                                                                        type="number"
                                                                        value={item.discount || 0}
                                                                        onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                                                                        className="w-full bg-background border border-border focus:border-accent rounded-lg px-2.5 py-1 outline-none text-secondary"
                                                                    />
                                                                </td>
                                                            </>
                                                        )}

                                                        {/* Actions */}
                                                        <td className="px-4 py-2.5 text-center">
                                                            <button
                                                                onClick={() => handleDeleteRow(idx)}
                                                                className="text-secondary hover:text-red-500 transition-colors p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-background/50">
                        {parsedData ? (
                            <button
                                onClick={() => setParsedData(null)}
                                className="border border-border hover:bg-background text-secondary hover:text-primary font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                            >
                                Reset & Re-upload
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClose}
                                className="border border-border hover:bg-background text-secondary hover:text-primary font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                            >
                                Cancel
                            </button>

                            {parsedData && (
                                <button
                                    onClick={handleConfirmSubmit}
                                    disabled={parsing}
                                    className="bg-accent hover:bg-accent/90 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-accent/20 transition-all"
                                >
                                    {parsing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            {actionType === 'stock_in' && 'Confirm Stock In & Save'}
                                            {actionType === 'sale' && 'Record Bulk Sales'}
                                            {actionType === 'product' && 'Confirm Catalog Import'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default PdfUploadModal;
