import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, ArrowRight, Save, Coins, Plus, Boxes } from 'lucide-react';
import api from '../../services/api';
import { normalizeProductCategory, getCompaniesForCategory } from '../../utils/productCategories';
import { getSubcategoriesForCategory } from '../../utils/productCatalog';
import useCategories from '../../hooks/useCategories';

const DirectPurchaseModal = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState('existing'); // 'existing' or 'custom'
    const [products, setProducts] = useState([]);
    const [registeredCompanies, setRegisteredCompanies] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Tech');
    
    // Quantity units
    const [orderUnit, setOrderUnit] = useState('units'); // 'units' or 'packs'
    const [packQty, setPackQty] = useState('');
    const [packCost, setPackCost] = useState('');
    const [pcsPerPack, setPcsPerPack] = useState(12);
    
    // Existing product form state
    const [formData, setFormData] = useState({
        product: '',
        company_name: '',
        quantity_purchased: 1,
        unit_cost: '',
        sale_price: '',
        notes: '',
        delivery_location: 'WAREHOUSE',
        payment_status: 'PAID',
    });

    // Custom product form state
    const [customData, setCustomData] = useState({
        product_name: '',
        product_code: '', // custom SKU
        category: 'Tech',
        subcategory: '',
        company_name: '',
        quantity_purchased: 1,
        cost_price: '',
        sale_price: '',
        notes: '',
        delivery_location: 'WAREHOUSE',
        payment_status: 'PAID',
    });

    const { categories: apiCategories } = useCategories();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categoryOptions = useMemo(() => {
        const apiMap = new Map(apiCategories.map((c) => [c.value.toLowerCase(), c]));
        products.forEach((item) => {
            const raw = String(item.category || '').trim();
            if (raw && !apiMap.has(raw.toLowerCase())) {
                apiMap.set(raw.toLowerCase(), {
                    value: raw,
                    label: raw.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                });
            }
        });
        return Array.from(apiMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [apiCategories, products]);

    const fetchDropdownData = async () => {
        try {
            const [productsRes, companiesRes] = await Promise.all([
                api.get('products/'),
                api.get('purchases/companies/'),
            ]);
            
            const prodList = productsRes.data?.results || productsRes.data?.data || productsRes.data || [];
            setProducts(prodList);

            const compList = companiesRes.data?.results || companiesRes.data?.data || companiesRes.data || [];
            setRegisteredCompanies(compList);
        } catch (err) {
            console.error('Failed to fetch modal dropdown data', err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
            setError('');
            setSuccess('');
            setPackQty('');
            setPackCost('');
            setOrderUnit('units');
            setMode('existing');
            setPcsPerPack(12);
            
            // Reset existing state
            setFormData({
                product: '',
                company_name: '',
                quantity_purchased: 1,
                unit_cost: '',
                sale_price: '',
                notes: '',
                delivery_location: 'WAREHOUSE',
                payment_status: 'PAID',
            });

            // Reset custom state
            setCustomData({
                product_name: '',
                product_code: '',
                category: 'Tech',
                subcategory: getSubcategoriesForCategory('Tech')[0]?.value || '',
                company_name: '',
                quantity_purchased: 1,
                cost_price: '',
                sale_price: '',
                notes: '',
                delivery_location: 'WAREHOUSE',
                payment_status: 'PAID',
            });
        }
    }, [isOpen]);

    const availableProducts = useMemo(() => {
        return products.filter(
            (p) => normalizeProductCategory(p.category) === normalizeProductCategory(selectedCategory)
        );
    }, [products, selectedCategory]);

    const selectedProduct = useMemo(() => {
        if (mode === 'existing' && formData.product) {
            return products.find((p) => p.id === Number(formData.product));
        }
        return null;
    }, [products, formData.product, mode]);

    // Handle updates when product selection changes
    useEffect(() => {
        if (selectedProduct) {
            setFormData(prev => ({
                ...prev,
                unit_cost: selectedProduct.cost_price || '',
                sale_price: selectedProduct.unit_price || '',
                company_name: selectedProduct.supplier_name || getCompaniesForCategory(selectedCategory)[0]?.name || '',
            }));
            setPcsPerPack(selectedProduct.pcs_per_pack || 12);
        }
    }, [selectedProduct, selectedCategory]);

    const handleCategoryChange = (e) => {
        const cat = e.target.value;
        setSelectedCategory(cat);
        if (mode === 'existing') {
            setFormData(prev => ({
                ...prev,
                product: '',
                unit_cost: '',
                sale_price: '',
                company_name: getCompaniesForCategory(cat)[0]?.name || '',
            }));
        } else {
            setCustomData(prev => ({
                ...prev,
                category: cat,
                subcategory: getSubcategoriesForCategory(cat)[0]?.value || '',
                company_name: getCompaniesForCategory(cat)[0]?.name || '',
            }));
        }
    };

    // Calculate dynamic values for total cost and quantity
    const calculatedQty = useMemo(() => {
        if (orderUnit === 'packs') {
            return Number(packQty || 0) * Number(pcsPerPack || 12);
        }
        return mode === 'existing' ? Number(formData.quantity_purchased || 0) : Number(customData.quantity_purchased || 0);
    }, [mode, orderUnit, packQty, formData.quantity_purchased, customData.quantity_purchased, pcsPerPack]);

    const calculatedUnitCost = useMemo(() => {
        if (orderUnit === 'packs') {
            if (packCost && Number(packCost) > 0) {
                return Number(packCost) / Number(pcsPerPack || 12);
            }
        }
        return mode === 'existing' ? Number(formData.unit_cost || 0) : Number(customData.cost_price || 0);
    }, [mode, orderUnit, packCost, formData.unit_cost, customData.cost_price, pcsPerPack]);

    const calculatedTotal = useMemo(() => {
        return calculatedQty * calculatedUnitCost;
    }, [calculatedQty, calculatedUnitCost]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let targetProductId = null;
            let supplierName = '';
            let notes = '';
            let location = 'WAREHOUSE';
            let payStatus = 'PAID';

            if (mode === 'custom') {
                if (!customData.product_name.trim()) throw new Error('Product name is required');
                if (!calculatedUnitCost || calculatedUnitCost <= 0) throw new Error('Valid unit/pack cost is required');
                if (!customData.sale_price || Number(customData.sale_price) <= 0) throw new Error('Valid sale price is required');

                // 1. Create a dynamic product code
                const catPrefix = (selectedCategory.slice(0, 3)).toUpperCase();
                const skuCode = customData.product_code.trim() || `${catPrefix}-${customData.product_name.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

                // 2. Resolve supplier company if needed
                supplierName = customData.company_name || getCompaniesForCategory(selectedCategory)[0]?.name || 'Direct Supplier';
                const foundCompany = registeredCompanies.find(c => c.name.toLowerCase() === supplierName.toLowerCase());
                let supplierId = foundCompany?.id || null;

                if (!supplierId && supplierName) {
                    const compRes = await api.post('purchases/companies/', {
                        name: supplierName,
                        category: selectedCategory,
                    });
                    supplierId = compRes.data.id;
                }

                // 3. Create the product
                const productPayload = {
                    name: customData.product_name.trim(),
                    product_code: skuCode,
                    category: selectedCategory,
                    subcategory: customData.subcategory,
                    cost_price: Number(calculatedUnitCost),
                    unit_price: Number(customData.sale_price),
                    stock_quantity: 0,
                    min_stock: 10,
                    status: 'ACTIVE',
                    pcs_per_pack: Number(pcsPerPack || 12),
                    pack_price: orderUnit === 'packs' ? Number(packCost) : (Number(calculatedUnitCost) * Number(pcsPerPack || 12)),
                    supplier: supplierId,
                };
                
                const prodRes = await api.post('products/', productPayload);
                targetProductId = prodRes.data.id;
                notes = customData.notes || `Direct Stock Purchase - New Product '${customData.product_name}'`;
                location = customData.delivery_location;
                payStatus = customData.payment_status;
            } else {
                if (!formData.product) throw new Error('Please select a product');
                if (!calculatedUnitCost || calculatedUnitCost <= 0) throw new Error('Valid unit/pack cost is required');
                if (!formData.sale_price || Number(formData.sale_price) <= 0) throw new Error('Valid sale price is required');

                targetProductId = Number(formData.product);
                supplierName = formData.company_name || selectedProduct?.supplier_name || 'Direct Supplier';
                notes = formData.notes || `Direct Stock Purchase - Product ID #${targetProductId}`;
                location = formData.delivery_location;
                payStatus = formData.payment_status;

                // Update catalog prices if changed
                const unitCostVal = Number(calculatedUnitCost);
                const salePriceVal = Number(formData.sale_price);
                const pcsPerPackVal = Number(pcsPerPack || 12);

                if (
                    Number(selectedProduct.cost_price) !== unitCostVal || 
                    Number(selectedProduct.unit_price) !== salePriceVal ||
                    Number(selectedProduct.pcs_per_pack) !== pcsPerPackVal
                ) {
                    await api.patch(`products/${selectedProduct.id}/`, {
                        cost_price: unitCostVal,
                        unit_price: salePriceVal,
                        pcs_per_pack: pcsPerPackVal,
                    });
                }
            }

            // 4. Create the direct Purchase receipt
            const purchasePayload = {
                product: targetProductId,
                company_name: supplierName,
                quantity_purchased: Number(calculatedQty),
                unit_cost: Number(calculatedUnitCost),
                purchase_date: new Date().toISOString().split('T')[0],
                payment_status: payStatus,
                delivery_location: location,
                notes: notes,
            };

            await api.post('purchases/', purchasePayload);
            setSuccess('Direct stock purchase saved. Inventory updated and COGS expense logged.');
            
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1550);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to complete direct purchase.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={loading ? () => {} : onClose} className="relative z-50">
            <div className="fixed inset-0 bg-primary/30 backdrop-blur-xs" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl border border-card flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4 border-b border-border pb-3 shrink-0">
                        <div>
                            <Dialog.Title className="text-lg font-bold text-primary flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-accent" />
                                Record Direct Stock Purchase
                            </Dialog.Title>
                            <p className="text-xs text-secondary mt-0.5">
                                Add stock directly to shop or warehouse and register it as an expense immediately.
                            </p>
                        </div>
                        <button onClick={onClose} disabled={loading} className="p-2 text-secondary hover:text-primary rounded-full hover:bg-page transition-colors cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        {/* Mode Switcher */}
                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-page p-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setMode('existing')}
                                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                                    mode === 'existing'
                                        ? 'bg-primary text-card shadow-xs'
                                        : 'text-secondary hover:bg-card'
                                }`}
                            >
                                Existing Catalog Product
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('custom')}
                                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                                    mode === 'custom'
                                        ? 'bg-primary text-card shadow-xs'
                                        : 'text-secondary hover:bg-card'
                                }`}
                            >
                                New Custom Product
                            </button>
                        </div>

                        {error && (
                            <div className="px-3 py-2 rounded-lg border border-rose-100 bg-status-info/5 text-status-info text-xs font-semibold">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="px-3 py-2 rounded-lg border border-emerald-100 bg-status-success/5 text-status-success text-xs font-semibold">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Category Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-semibold text-primary mb-1">Product Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={handleCategoryChange}
                                        className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card text-primary"
                                    >
                                        {categoryOptions.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-semibold text-primary mb-1">Delivery / Destination Location</label>
                                    <select
                                        value={mode === 'existing' ? formData.delivery_location : customData.delivery_location}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (mode === 'existing') {
                                                setFormData(prev => ({ ...prev, delivery_location: val }));
                                            } else {
                                                setCustomData(prev => ({ ...prev, delivery_location: val }));
                                            }
                                        }}
                                        className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card text-primary"
                                    >
                                        <option value="WAREHOUSE">Warehouse Stock</option>
                                        <option value="SHOP">Shop Outlet Stock</option>
                                    </select>
                                </div>
                            </div>

                            {/* Product selection/details based on mode */}
                            {mode === 'existing' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-1">Select Product</label>
                                        <select
                                            required
                                            value={formData.product}
                                            onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                                            className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card text-primary"
                                        >
                                            <option value="">-- Choose {selectedCategory} product --</option>
                                            {availableProducts.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.sku || p.product_code || 'No SKU'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Supplier / Vendor</label>
                                            <input
                                                type="text"
                                                value={formData.company_name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="e.g. Metro Wholesale"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Catalog Sale Price (per unit)</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                required
                                                disabled={!formData.product}
                                                value={formData.sale_price}
                                                onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary disabled:opacity-50"
                                                placeholder="Updated selling price"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-primary mb-1">Product Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={customData.product_name}
                                                onChange={(e) => setCustomData(prev => ({ ...prev, product_name: e.target.value }))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="e.g. Lays Masala Large"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-primary mb-1">Product SKU / Barcode (Optional)</label>
                                            <input
                                                type="text"
                                                value={customData.product_code}
                                                onChange={(e) => setCustomData(prev => ({ ...prev, product_code: e.target.value }))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="Leave blank to auto-generate"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Subcategory (Optional)</label>
                                            <input
                                                type="text"
                                                value={customData.subcategory}
                                                onChange={(e) => setCustomData(prev => ({ ...prev, subcategory: e.target.value }))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="e.g. Chips / Snacks"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Catalog Sale Price (per unit)</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                required
                                                value={customData.sale_price}
                                                onChange={(e) => setCustomData(prev => ({ ...prev, sale_price: e.target.value }))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="Retail unit price"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Supplier / Vendor</label>
                                            <input
                                                type="text"
                                                value={customData.company_name}
                                                onChange={(e) => setCustomData(prev => ({ ...prev, company_name: e.target.value }))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="e.g. PepsiCo Pakistan"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Pieces Per Pack (Box/Carton)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pcsPerPack}
                                                onChange={(e) => setPcsPerPack(Number(e.target.value || 12))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="e.g. 12 or 24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity and cost purchase options */}
                            <div className="border-t border-border pt-4">
                                <label className="block text-sm font-semibold text-primary mb-2">Purchase Unit Configuration</label>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setOrderUnit('units')}
                                        className={`py-2 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                            orderUnit === 'units'
                                                ? 'bg-accent/15 text-accent border-accent/40 shadow-xs'
                                                : 'bg-background hover:bg-page text-text-secondary border-border hover:text-text-primary'
                                        }`}
                                    >
                                        Order by Single Units (Pcs)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderUnit('packs')}
                                        className={`py-2 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                            orderUnit === 'packs'
                                                ? 'bg-accent/15 text-accent border-accent/40 shadow-xs'
                                                : 'bg-background hover:bg-page text-text-secondary border-border hover:text-text-primary'
                                        }`}
                                    >
                                        Order by Packs (Cartons/Boxes)
                                    </button>
                                </div>

                                {orderUnit === 'packs' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Number of Packs</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={packQty}
                                                onChange={(e) => setPackQty(e.target.value)}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="Packs quantity"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Cost Price (per pack)</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                required
                                                value={packCost}
                                                onChange={(e) => setPackCost(e.target.value)}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="Pack cost"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-primary mb-1">Pieces Per Pack</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={pcsPerPack}
                                                onChange={(e) => setPcsPerPack(Number(e.target.value || 12))}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="Quantity per pack"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Single Units Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={mode === 'existing' ? formData.quantity_purchased : customData.quantity_purchased}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (mode === 'existing') {
                                                        setFormData(prev => ({ ...prev, quantity_purchased: val }));
                                                    } else {
                                                        setCustomData(prev => ({ ...prev, quantity_purchased: val }));
                                                    }
                                                }}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="Units quantity"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-primary mb-1">Cost Price (per unit)</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                required
                                                value={mode === 'existing' ? formData.unit_cost : customData.cost_price}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (mode === 'existing') {
                                                        setFormData(prev => ({ ...prev, unit_cost: val }));
                                                    } else {
                                                        setCustomData(prev => ({ ...prev, cost_price: val }));
                                                    }
                                                }}
                                                className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                                placeholder="Unit cost"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Info / Notes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-semibold text-primary mb-1">Payment Status</label>
                                    <select
                                        value={mode === 'existing' ? formData.payment_status : customData.payment_status}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (mode === 'existing') {
                                                setFormData(prev => ({ ...prev, payment_status: val }));
                                            } else {
                                                setCustomData(prev => ({ ...prev, payment_status: val }));
                                            }
                                        }}
                                        className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card text-primary"
                                    >
                                        <option value="PAID">Paid (Cash/Bank Outflow)</option>
                                        <option value="UNPAID">Unpaid (Accounts Payable)</option>
                                    </select>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-semibold text-primary mb-1">Remarks / Memo</label>
                                    <input
                                        type="text"
                                        value={mode === 'existing' ? formData.notes : customData.notes}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (mode === 'existing') {
                                                setFormData(prev => ({ ...prev, notes: val }));
                                            } else {
                                                setCustomData(prev => ({ ...prev, notes: val }));
                                            }
                                        }}
                                        className="w-full border border-card rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-primary"
                                        placeholder="e.g. Urgent stock call delivery"
                                    />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="bg-page border border-border rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-inner">
                                <div className="text-left w-full sm:w-auto">
                                    <div className="text-[10px] text-secondary font-black uppercase tracking-wider">Purchase Summary</div>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-primary font-bold">
                                        <span>Total Stock Qty: <span className="text-accent">{calculatedQty} units</span></span>
                                        <span>Unit Cost: <span className="text-accent">Rs. {calculatedUnitCost.toFixed(2)}</span></span>
                                    </div>
                                </div>
                                <div className="text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                                    <span className="text-[10px] text-secondary font-black uppercase tracking-wider sm:block hidden">Total Cost (COGS Expense)</span>
                                    <span className="text-xl font-extrabold text-primary flex items-center gap-1.5 leading-none sm:mt-1">
                                        <Coins className="w-5 h-5 text-amber-500" />
                                        Rs. {calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Submit buttons */}
                            <div className="flex justify-end gap-3 pt-3 border-t border-border shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-xs font-semibold text-primary bg-card border border-border rounded-xl hover:bg-page transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (mode === 'existing' && !formData.product)}
                                    className="px-5 py-2 text-xs font-bold text-card bg-primary rounded-xl hover:bg-secondary transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Recording...' : 'Record Direct Purchase'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default DirectPurchaseModal;
