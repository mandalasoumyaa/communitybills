import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Droplet,
  CreditCard,
  PieChart,
  DollarSign,
  BarChart3
} from 'lucide-react';
import ManageExpensesPage from './ManageExpensesPage';
import CalculateWaterBillPage from './CalculateWaterBillPage';
import MonthlyExpensesPage from './MonthlyExpensesPage';
import TotalAmountPage from './TotalAmountPage';
import BillingReportsPage from './BillingReportsPage';
import BillingPaymentsPage from './BillingPaymentsPage';
import ApartmentBillDetailsPage from './ApartmentBillDetailsPage';

export default function BillingFinancePage({
  towersList,
  flatsList,
  expenses,
  setExpenses,
  waterBills,
  setWaterBills,
  paymentsList,
  setPaymentsList,
  addLog
}) {
  const [activeSubTab, setActiveSubTab] = useState('payments');
  const [sharedMonth, setSharedMonth] = useState('2026-05');
  const [selectedFlatId, setSelectedFlatId] = useState(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const subTabs = [
    { id: 'expenses', label: 'Manage Expenses', icon: Layers },
    { id: 'calculate-water', label: 'Calculate Water Bills', icon: Droplet },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'monthly-expenses', label: 'Monthly Expenses', icon: PieChart },
    { id: 'total-amount', label: 'Total Amount', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  if (isViewingDetails) {
    return (
      <ApartmentBillDetailsPage
        flatsList={flatsList}
        waterReadings={waterBills}
        initialFlatId={selectedFlatId}
        selectedMonth={sharedMonth}
        onBack={() => setIsViewingDetails(false)}
      />
    );
  }

  return (
    <div className="max-w-none mx-auto space-y-4">

      {/* Tab Navigation Menu */}
      <div className="bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {subTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${isTabActive
                    ? 'bg-indigo-50 text-[#6366f1] shadow-sm'
                    : 'text-slate-500 hover:bg-slate-550 hover:text-slate-900'
                  }`}
              >
                <TabIcon className={`h-4 w-4 ${isTabActive ? 'text-[#6366f1]' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected View */}
      <div className="transition-all duration-300">

        {activeSubTab === 'payments' && (
          <BillingPaymentsPage
            towersList={towersList}
            flatsList={flatsList}
            paymentsList={paymentsList}
            setPaymentsList={setPaymentsList}
            addLog={addLog}
            sharedMonth={sharedMonth}
            setSharedMonth={setSharedMonth}
            onViewBill={(flatId) => {
              setSelectedFlatId(flatId);
              setIsViewingDetails(true);
            }}
          />
        )}

        {activeSubTab === 'expenses' && (
          <ManageExpensesPage
            expenses={expenses}
            setExpenses={setExpenses}
          />
        )}

        {activeSubTab === 'calculate-water' && (
          <CalculateWaterBillPage
            towersList={towersList}
            flatsList={flatsList}
            waterBills={waterBills}
            setWaterBills={setWaterBills}
            addLog={addLog}
            sharedMonth={sharedMonth}
            setSharedMonth={setSharedMonth}
          />
        )}

        {activeSubTab === 'monthly-expenses' && (
          <MonthlyExpensesPage
            expenses={expenses}
          />
        )}

        {activeSubTab === 'total-amount' && (
          <TotalAmountPage
            paymentsList={paymentsList}
            flatsList={flatsList}
            towersList={towersList}
          />
        )}

        {activeSubTab === 'reports' && (
          <BillingReportsPage
            paymentsList={paymentsList}
            expenses={expenses}
            flatsList={flatsList}
            towersList={towersList}
          />
        )}
      </div>
    </div>
  );
}
