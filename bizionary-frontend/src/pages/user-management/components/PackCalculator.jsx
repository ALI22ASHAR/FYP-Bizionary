import React, { useState } from 'react';
import { Calculator, Package, RefreshCw, Layers, TrendingUp, AlertCircle } from 'lucide-react';

const PackCalculator = () => {
    // Inputs state
    const [inputType, setInputType] = useState('unit'); // 'unit' or 'pack'
    const [costPrice, setCostPrice] = useState(170);
    const [sellingPrice, setSellingPrice] = useState(200);
    const [pcsPerPack, setPcsPerPack] = useState(12);
    const [numPacks, setNumPacks] = useState(10);

    // Derived values
    const safePcsPerPack = Math.max(1, Number(pcsPerPack) || 1);
    const safeNumPacks = Math.max(0, Number(numPacks) || 0);
    const safeCost = Math.max(0, Number(costPrice) || 0);
    const safeSell = Math.max(0, Number(sellingPrice) || 0);

    let unitCost = 0;
    let unitSell = 0;
    let packCost = 0;
    let packSell = 0;

    if (inputType === 'unit') {
        unitCost = safeCost;
        unitSell = safeSell;
        packCost = safeCost * safePcsPerPack;
        packSell = safeSell * safePcsPerPack;
    } else {
        packCost = safeCost;
        packSell = safeSell;
        unitCost = safeCost / safePcsPerPack;
        unitSell = safeSell / safePcsPerPack;
    }

    const unitProfit = unitSell - unitCost;
    const packProfit = packSell - packCost;
    const totalPcs = safePcsPerPack * safeNumPacks;
    const totalCost = packCost * safeNumPacks;
    const totalSell = packSell * safeNumPacks;
    const totalProfit = totalSell - totalCost;

    const profitMarginPercent = unitSell > 0 ? (unitProfit / unitSell) * 100 : 0;

    const formatCalcPKR = (val) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val).replace('PKR', '₨');
    };

    const handleReset = () => {
        setCostPrice(170);
        setSellingPrice(200);
        setPcsPerPack(12);
        setNumPacks(10);
        setInputType('unit');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Input Controls Card */}
            <div className="lg:col-span-1 bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                        <Calculator className="w-5 h-5 text-accent" />
                        <h4 className="font-extrabold text-sm text-primary uppercase tracking-wider">Calculator Inputs</h4>
                    </div>

                    {/* Input Mode Toggle */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider">Pricing Input Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-background/50 p-1 rounded-xl border border-border/40">
                            <button
                                type="button"
                                onClick={() => {
                                    setInputType('unit');
                                    // Translate value to unit equivalent roughly
                                    if (inputType === 'pack') {
                                        setCostPrice(Math.round((costPrice / safePcsPerPack) * 100) / 100);
                                        setSellingPrice(Math.round((sellingPrice / safePcsPerPack) * 100) / 100);
                                    }
                                }}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    inputType === 'unit'
                                        ? 'bg-accent text-white shadow-sm'
                                        : 'text-secondary hover:text-primary'
                                }`}
                            >
                                By Single Unit
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setInputType('pack');
                                    // Translate value to pack equivalent roughly
                                    if (inputType === 'unit') {
                                        setCostPrice(Math.round(costPrice * safePcsPerPack * 100) / 100);
                                        setSellingPrice(Math.round(sellingPrice * safePcsPerPack * 100) / 100);
                                    }
                                }}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    inputType === 'pack'
                                        ? 'bg-accent text-white shadow-sm'
                                        : 'text-secondary hover:text-primary'
                                }`}
                            >
                                By Carton / Pack
                            </button>
                        </div>
                    </div>

                    {/* Cost Price */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider">
                            {inputType === 'unit' ? 'Cost Price Per Unit (Rs)' : 'Cost Price Per Pack/Carton (Rs)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={costPrice}
                            onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/60 focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none font-mono"
                        />
                    </div>

                    {/* Selling Price */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider">
                            {inputType === 'unit' ? 'Selling Price Per Unit (Rs)' : 'Selling Price Per Pack/Carton (Rs)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={sellingPrice}
                            onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/60 focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none font-mono"
                        />
                    </div>

                    {/* Pcs Per Pack */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider">
                            Carton Multiplier (Pcs Per Pack)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={pcsPerPack}
                            onChange={(e) => setPcsPerPack(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/60 focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none font-mono"
                        />
                    </div>

                    {/* Number of Packs */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider">
                            Order Quantity (Number of Packs)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={numPacks}
                            onChange={(e) => setNumPacks(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-background/50 border border-border/60 focus:border-accent rounded-xl px-3 py-2 text-xs text-primary focus:outline-none font-mono"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleReset}
                    className="mt-6 w-full flex items-center justify-center gap-1.5 bg-background border border-border/60 hover:bg-background/80 text-secondary hover:text-primary transition-all text-xs font-bold py-2 rounded-xl"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Calculator
                </button>
            </div>

            {/* Results breakdown cards */}
            <div className="lg:col-span-2 space-y-6">
                {/* Unit & Pack Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Unit Level */}
                    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                            <Layers className="w-4 h-4 text-emerald-500" />
                            <h5 className="font-bold text-xs text-primary uppercase tracking-wider">Single Unit View</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <span className="text-secondary">Unit Cost:</span>
                            <span className="font-mono text-right text-primary">{formatCalcPKR(unitCost)}</span>
                            <span className="text-secondary">Unit Sell Price:</span>
                            <span className="font-mono text-right text-primary font-bold">{formatCalcPKR(unitSell)}</span>
                            <span className="text-secondary pt-1.5 border-t border-border/20">Unit Profit:</span>
                            <span className={`font-mono text-right font-bold pt-1.5 border-t border-border/20 ${unitProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCalcPKR(unitProfit)}
                            </span>
                        </div>
                    </div>

                    {/* Pack Level */}
                    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                            <Package className="w-4 h-4 text-indigo-500" />
                            <h5 className="font-bold text-xs text-primary uppercase tracking-wider">Carton / Pack View</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <span className="text-secondary">Pack Cost:</span>
                            <span className="font-mono text-right text-primary">{formatCalcPKR(packCost)}</span>
                            <span className="text-secondary">Pack Sell Price:</span>
                            <span className="font-mono text-right text-primary font-bold">{formatCalcPKR(packSell)}</span>
                            <span className="text-secondary pt-1.5 border-t border-border/20">Pack Profit:</span>
                            <span className={`font-mono text-right font-bold pt-1.5 border-t border-border/20 ${packProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCalcPKR(packProfit)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Big Order Metrics Card */}
                <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-accent" />
                            <h4 className="font-extrabold text-sm text-primary uppercase tracking-wider">Total Order Breakdown</h4>
                        </div>
                        <span className="bg-accent/10 text-accent font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                            {totalPcs} Total Pcs ({safeNumPacks} Packs)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-wider">Total Order Cost</span>
                            <span className="font-mono text-xl font-bold text-primary">{formatCalcPKR(totalCost)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-wider">Expected Revenue</span>
                            <span className="font-mono text-xl font-bold text-primary">{formatCalcPKR(totalSell)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-wider">Expected Net Profit</span>
                            <span className={`font-mono text-xl font-black ${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCalcPKR(totalProfit)}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar representation of margin */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-secondary">Profit Margin Margin:</span>
                            <span className={`font-bold ${profitMarginPercent >= 20 ? 'text-emerald-500' : (profitMarginPercent > 0 ? 'text-amber-500' : 'text-rose-500')}`}>
                                {profitMarginPercent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-background/50 h-3.5 rounded-full overflow-hidden border border-border/40 p-0.5">
                            <div
                                style={{ width: `${Math.min(100, Math.max(0, profitMarginPercent))}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                    profitMarginPercent >= 25 
                                        ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' 
                                        : (profitMarginPercent >= 10 
                                            ? 'bg-amber-500 shadow-md shadow-amber-500/20' 
                                            : 'bg-rose-500 shadow-md shadow-rose-500/20')
                                }`}
                            />
                        </div>
                    </div>

                    {/* Helpful summary alert */}
                    <div className="flex items-start gap-3 bg-background/60 rounded-xl p-4 border border-border/40 text-xs text-secondary leading-relaxed">
                        <AlertCircle className="w-4 h-4 shrink-0 text-accent mt-0.5" />
                        <div>
                            This order of <span className="font-bold text-primary">{safeNumPacks} packs</span> (at <span className="font-bold text-primary">{safePcsPerPack} pieces per pack</span>) has a total cost of <span className="font-semibold text-primary">{formatCalcPKR(totalCost)}</span>.
                            Selling them at <span className="font-bold text-primary">{formatCalcPKR(unitSell)}/unit</span> returns a revenue of <span className="font-semibold text-primary">{formatCalcPKR(totalSell)}</span>, securing a profit of <span className="font-bold text-primary">{formatCalcPKR(totalProfit)}</span>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackCalculator;
