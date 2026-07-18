import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import PackCalculator from '../user-management/components/PackCalculator';

const CalculatorPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Pack Price Calculator"
                subtitle="Calculate unit vs pack cost, selling price, total margin, and net expected profits dynamically based on custom carton size."
            />
            <div className="mt-4">
                <PackCalculator />
            </div>
        </div>
    );
};

export default CalculatorPage;
