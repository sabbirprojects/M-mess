import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calculator,
  UtensilsCrossed,
  Receipt,
  Layers,
  PiggyBank,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { jsPDF } from 'jspdf';

export const ReportsScreen: React.FC = () => {
  const { activeMonth, monthSummary } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  if (!activeMonth) {
    return (
      <div className="p-8 text-center text-gray-500">
        No active month selected.
      </div>
    );
  }

  const {
    totalMeals,
    totalBazaarCost,
    totalUniversalExpenses,
    totalDeposits,
    mealRate,
    isFixedRate,
    memberCalculations,
  } = monthSummary;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      // PDF Styling & Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(26, 51, 44); // #1A332C
      doc.text('SMART MEAL MANAGER', 40, 50);

      doc.setFontSize(14);
      doc.setTextColor(101, 146, 135); // #659287
      doc.text(`Monthly Financial Audit Statement: ${activeMonth.name} ${activeMonth.year}`, 40, 70);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const generatedAt = new Date().toLocaleString();
      doc.text(`Generated on: ${generatedAt} | Status: ${activeMonth.status.toUpperCase()}`, 40, 85);

      doc.setDrawColor(177, 211, 185);
      doc.setLineWidth(1);
      doc.line(40, 95, 555, 95);

      // Report Summary Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(26, 51, 44);
      doc.text('REPORT SUMMARY & MEAL RATE BREAKDOWN', 40, 120);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);

      doc.text(`• Total Meals Consumed: ${formatNumber(totalMeals, 1)} meals`, 45, 140);
      doc.text(`• Total Bazaar Cost: ৳${formatNumber(totalBazaarCost, 2)}`, 45, 155);
      doc.text(`• Total Universal Expenses: ৳${formatNumber(totalUniversalExpenses, 2)}`, 45, 170);
      doc.text(`• Total Member Deposits: ৳${formatNumber(totalDeposits, 2)}`, 300, 140);

      const rateFormulaText = isFixedRate
        ? `• Meal Rate: ৳${formatNumber(mealRate, 2)} (Fixed Rate Enabled)`
        : `• Meal Rate: ৳${formatNumber(mealRate, 2)} (৳${formatNumber(totalBazaarCost, 2)} ÷ ${formatNumber(totalMeals, 1)} meals)`;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(101, 146, 135);
      doc.text(rateFormulaText, 300, 155);

      doc.line(40, 190, 555, 190);

      // Member Report Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(26, 51, 44);
      doc.text('MEMBER FINANCIAL BREAKDOWN', 40, 215);

      // Table Header
      let y = 235;
      doc.setFillColor(230, 242, 221); // #E6F2DD
      doc.rect(40, y - 12, 515, 20, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 51, 44);

      doc.text('Member Name', 45, y);
      doc.text('Meals', 145, y);
      doc.text('Deposit', 185, y);
      doc.text('Baz. Credit', 240, y);
      doc.text('Uni. Credit', 305, y);
      doc.text('Total Cost', 370, y);
      doc.text('Final Balance', 440, y);
      doc.text('Status', 510, y);

      // Table Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      y += 18;
      memberCalculations.forEach((m, idx) => {
        if (y > 780) {
          doc.addPage();
          y = 50;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 249);
          doc.rect(40, y - 10, 515, 16, 'F');
        }

        doc.setTextColor(30, 30, 30);
        doc.text(m.memberName.substring(0, 18), 45, y);
        doc.text(formatNumber(m.totalMeals, 1), 145, y);
        doc.text(`৳${formatNumber(m.totalDeposit, 1)}`, 185, y);
        const bazPdfText =
          m.bazaarCredit < 0
            ? `-৳${formatNumber(Math.abs(m.bazaarCredit), 1)}`
            : `৳${formatNumber(m.bazaarCredit, 1)}`;
        doc.text(bazPdfText, 240, y);
        doc.text(`৳${formatNumber(m.universalCredit, 1)}`, 305, y);
        doc.text(`৳${formatNumber(m.totalCost, 1)}`, 370, y);

        // Balance coloring
        if (m.status === 'Receivable') {
          doc.setTextColor(16, 120, 70); // Green
        } else if (m.status === 'Payable') {
          doc.setTextColor(185, 28, 28); // Red
        } else {
          doc.setTextColor(100, 100, 100);
        }
        doc.text(`৳${formatNumber(m.finalBalance, 2)}`, 440, y);
        doc.text(m.status, 510, y);

        y += 16;
      });

      // Footer line & signoff
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
      y += 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(40, y, 555, y);
      y += 25;

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Prepared by Smart Meal Manager Automated Ledger System', 40, y);
      doc.text('Mess Manager Signature: _______________________', 340, y);
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text('Universal Expense Rule: Payer receives 100% full credit in balance; equal shares are automatically deducted from every member account in Total Cost.', 40, y + 14);

      // Save PDF
      doc.save(`Mess_Report_${activeMonth.name}_${activeMonth.year}.pdf`);
    } catch (e) {
      console.error('Error exporting PDF', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 print-container">
      
      {/* Action Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1A332C]">
            Monthly Financial Report
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Comprehensive audit statement and calculations breakdown for{' '}
            <span className="font-bold text-[#659287]">
              {activeMonth.name} {activeMonth.year}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="report-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-[#E6F2DD] shadow-2xs transition-colors"
          >
            <Printer className="h-4 w-4 text-[#659287]" />
            <span>Print Report</span>
          </button>

          <button
            id="report-export-pdf-btn"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl bg-[#659287] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#659287]/20 hover:bg-[#52776e] transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 sm:p-8 shadow-xs space-y-8">
        
        {/* Printable Letterhead */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#659287] text-white">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-extrabold text-[#1A332C]">
                  Smart Meal Manager
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Official Monthly Audit & Expense Settlement Statement
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="rounded-full bg-[#E6F2DD] px-3 py-1 text-xs font-extrabold text-[#456c63]">
                {activeMonth.name} {activeMonth.year}
              </span>
              <p className="text-[11px] text-gray-400 mt-1">
                Statement Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Report Summary Cards */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Financial Highlights
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-[#E6F2DD]/30 p-3.5">
              <span className="text-[11px] font-semibold text-gray-500">Total Meals</span>
              <div className="text-xl font-extrabold text-[#1A332C] mt-1 font-mono">
                {formatNumber(totalMeals, 1)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#E6F2DD]/30 p-3.5">
              <span className="text-[11px] font-semibold text-gray-500">Total Bazaar Cost</span>
              <div className="text-xl font-extrabold text-[#1A332C] mt-1 font-mono truncate">
                {formatCurrency(totalBazaarCost)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#E6F2DD]/30 p-3.5">
              <span className="text-[11px] font-semibold text-gray-500">Universal Expenses</span>
              <div className="text-xl font-extrabold text-[#1A332C] mt-1 font-mono truncate">
                {formatCurrency(totalUniversalExpenses)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#E6F2DD]/30 p-3.5">
              <span className="text-[11px] font-semibold text-gray-500">Total Deposits</span>
              <div className="text-xl font-extrabold text-[#1A332C] mt-1 font-mono truncate">
                {formatCurrency(totalDeposits)}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#659287] bg-white p-3.5 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-[#659287]">Meal Rate</span>
              <div className="text-xl font-extrabold text-[#659287] mt-1 font-mono">
                {formatCurrency(mealRate)}
              </div>
            </div>
          </div>
        </div>

        {/* Meal Rate Breakdown Formula Card */}
        <div className="rounded-2xl border border-[#B1D3B9] bg-[#E6F2DD]/50 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Calculator className="h-4 w-4 text-[#659287]" />
            <h4 className="text-xs font-extrabold text-[#1A332C] uppercase tracking-wider">
              Meal Rate Breakdown
            </h4>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-700 gap-2">
            <div>
              {isFixedRate ? (
                <span>
                  <strong>Fixed Meal Rate Enabled:</strong> Set manually to{' '}
                  <strong className="text-[#659287] font-mono">{formatCurrency(mealRate)}</strong> in Settings.
                </span>
              ) : (
                <span>
                  <strong>Auto Mode Formula:</strong> Meal Rate = Total Bazaar Cost ÷ Total Meals
                  <br />
                  <span className="font-mono text-gray-800">
                    {formatCurrency(totalBazaarCost)} ÷ {formatNumber(totalMeals, 1)} meals ={' '}
                    <strong className="text-[#659287]">{formatCurrency(mealRate)}/meal</strong>
                  </span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500">
              Member Cost = (Total Meals × Meal Rate) + Universal Expense Share
            </div>
          </div>
        </div>

        {/* Universal Expense Rule Policy Card */}
        <div className="rounded-2xl border border-[#B1D3B9]/80 bg-[#E6F2DD]/30 p-3.5 flex items-start gap-3">
          <Info className="h-4 w-4 text-[#659287] shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 space-y-0.5">
            <span className="font-bold text-[#1A332C]">Universal Expense Rule: </span>
            <span>
              When a member pays for a shared mess bill (WiFi, Maid, Gas, etc.), the full payment is added to their total balance (reported under <strong>Uni. Credit</strong>). Equal shares are automatically deducted from every member's account (factored into <strong>Total Cost</strong>).
            </span>
          </div>
        </div>

        {/* Member Report Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Member Financial Statements
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-[#E6F2DD]/40 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3 text-right">Total Meals</th>
                  <th className="px-4 py-3 text-right">Deposit</th>
                  <th className="px-4 py-3 text-right">Bazaar Credit</th>
                  <th className="px-4 py-3 text-right">Uni. Credit</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3 text-right">Final Balance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-mono">
                {memberCalculations.map(m => (
                  <tr key={m.memberId} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-sans font-bold text-[#1A332C]">
                      {m.memberName}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatNumber(m.totalMeals, 1)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800">
                      {formatCurrency(m.totalDeposit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${
                        m.bazaarCredit < 0 ? 'text-amber-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {formatCurrency(m.bazaarCredit)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(m.universalCredit)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(m.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span
                        className={
                          m.status === 'Receivable'
                            ? 'text-emerald-700'
                            : m.status === 'Payable'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }
                      >
                        {formatCurrency(m.finalBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-sans">
                      {m.status === 'Receivable' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <ArrowUpRight className="h-3 w-3" />
                          Receivable
                        </span>
                      )}
                      {m.status === 'Payable' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                          <ArrowDownRight className="h-3 w-3" />
                          Payable
                        </span>
                      )}
                      {m.status === 'Settled' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                          <CheckCircle2 className="h-3 w-3 text-gray-400" />
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80 font-bold text-xs text-[#1A332C]">
                  <td className="px-4 py-3 font-sans">Total</td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(totalMeals, 1)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(totalDeposits)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div>{formatCurrency(totalBazaarCost)}</div>
                    {memberCalculations.some(c => c.bazaarCredit < 0) && (
                      <div className="text-[10px] text-amber-700 font-sans font-normal" title="Negative market entries are deducted from member balance without lowering market cost">
                        ({formatCurrency(Math.abs(memberCalculations.filter(c => c.bazaarCredit < 0).reduce((acc, c) => acc + c.bazaarCredit, 0)))} member ded.)
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(
                      memberCalculations.reduce((acc, c) => acc + c.universalCredit, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(
                      memberCalculations.reduce((acc, c) => acc + c.totalCost, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(
                      memberCalculations.reduce((acc, c) => acc + c.finalBalance, 0)
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit Sign-off for Print */}
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>
            Smart Meal Manager — Accurate and transparent shared mess calculations.
          </div>
          <div className="text-right">
            <span>Mess Manager Signature: _______________________</span>
          </div>
        </div>

      </div>
    </div>
  );
};
