import React, { useState } from 'react';
import { Calculator, X, Delete, RotateCcw, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CalculatorWidget: React.FC = () => {
  const { isCalculatorOpen, setIsCalculatorOpen, calculatorMemory, setCalculatorMemory } = useApp();
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    setDisplay(prev => {
      // If previous calculation was completed with '=', start a fresh entry
      if (equation.includes('=')) {
        setEquation('');
        return digit === '.' ? '0.' : digit;
      }
      if (prev === '0' && digit !== '.') return digit;
      if (digit === '.' && prev.includes('.')) return prev;
      if (prev === 'Error') return digit === '.' ? '0.' : digit;
      return prev + digit;
    });
  };

  const handleOperator = (op: string) => {
    // If equation already has an operation pending and user enters next operator (e.g. 5 + 3 +)
    if (equation && !equation.includes('=')) {
      const parts = equation.trim().split(' ');
      if (parts.length >= 2) {
        const num1 = parseFloat(parts[0]);
        const existingOp = parts[1];
        const num2 = parseFloat(display);
        let interResult = 0;
        switch (existingOp) {
          case '+':
            interResult = num1 + num2;
            break;
          case '-':
            interResult = num1 - num2;
            break;
          case '×':
          case '*':
            interResult = num1 * num2;
            break;
          case '÷':
          case '/':
            if (num2 === 0) {
              setDisplay('Error');
              setEquation('');
              return;
            }
            interResult = num1 / num2;
            break;
          default:
            interResult = num2;
        }
        const rounded = Math.round(interResult * 10000) / 10000;
        setDisplay(rounded.toString());
        setEquation(`${rounded} ${op} `);
        return;
      }
    }

    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handleCalculate = () => {
    if (!equation) return;
    try {
      const parts = equation.trim().split(' ');
      if (parts.length < 2) return;
      const num1 = parseFloat(parts[0]);
      const operator = parts[1];
      const num2 = parseFloat(display);

      let result = 0;
      switch (operator) {
        case '+':
          result = num1 + num2;
          break;
        case '-':
          result = num1 - num2;
          break;
        case '×':
        case '*':
          result = num1 * num2;
          break;
        case '÷':
        case '/':
          if (num2 === 0) {
            setDisplay('Error');
            setEquation('');
            return;
          }
          result = num1 / num2;
          break;
        default:
          return;
      }

      // Round to maximum 4 decimal places
      const finalResult = Math.round(result * 10000) / 10000;
      const resStr = finalResult.toString();
      setDisplay(resStr);
      setEquation(`${num1} ${operator} ${num2} =`);
    } catch {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    setDisplay(prev => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  // Memory Handlers
  const handleMemoryClear = () => {
    setCalculatorMemory('0');
  };

  const handleMemoryRecall = () => {
    if (calculatorMemory && calculatorMemory !== 'Error') {
      setDisplay(calculatorMemory);
    }
  };

  const handleMemoryAdd = () => {
    const currVal = parseFloat(display);
    if (isNaN(currVal)) return;
    const memVal = parseFloat(calculatorMemory) || 0;
    const nextVal = Math.round((memVal + currVal) * 10000) / 10000;
    setCalculatorMemory(nextVal.toString());
  };

  const handleMemorySubtract = () => {
    const currVal = parseFloat(display);
    if (isNaN(currVal)) return;
    const memVal = parseFloat(calculatorMemory) || 0;
    const nextVal = Math.round((memVal - currVal) * 10000) / 10000;
    setCalculatorMemory(nextVal.toString());
  };

  const hasMemory = Boolean(
    calculatorMemory &&
      calculatorMemory !== '0' &&
      !isNaN(parseFloat(calculatorMemory)) &&
      parseFloat(calculatorMemory) !== 0
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {/* Compact Floating Calculator trigger icon */}
      <button
        id="global-calculator-trigger"
        onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
        title={isCalculatorOpen ? 'Close Calculator' : 'Open Calculator'}
        className="no-print fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-40 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#659287] text-white shadow-md shadow-[#659287]/30 transition-all hover:bg-[#52776e] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#88BDA4] focus:ring-offset-2 cursor-pointer"
        aria-label="Calculator"
      >
        {isCalculatorOpen ? (
          <X className="h-4 w-4 text-white" />
        ) : (
          <Calculator className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
        )}
      </button>

      {/* Floating Calculator Popup */}
      {isCalculatorOpen && (
        <div
          id="global-calculator-widget"
          className="no-print fixed bottom-32 lg:bottom-20 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] max-w-[300px] sm:max-w-[320px] rounded-2xl border border-[#B1D3B9]/50 bg-white p-3.5 sm:p-4 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E6F2DD]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#659287]/15 text-[#659287]">
                <Calculator className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-[#1A332C]">Mess Calculator</h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                id="calc-copy-btn"
                onClick={handleCopy}
                title="Copy current value"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-[#E6F2DD] hover:text-[#659287] transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                id="calc-close-btn"
                onClick={() => setIsCalculatorOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#E6F2DD] hover:text-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Display */}
          <div className="my-3 rounded-xl bg-[#E6F2DD]/60 p-3 text-right relative">
            <div className="flex items-center justify-between h-4 text-xs font-medium text-[#659287]">
              <div>
                {hasMemory ? (
                  <span
                    id="calc-memory-indicator"
                    title={`Stored in memory: ${calculatorMemory}`}
                    className="inline-flex items-center gap-1 rounded bg-[#659287] px-1.5 py-0.2 text-[9px] font-bold text-white shadow-2xs"
                  >
                    M: {calculatorMemory}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-normal">M: empty</span>
                )}
              </div>
              <div className="truncate text-right">
                {equation || '\u00A0'}
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#1A332C] truncate mt-1">
              {display}
            </div>
          </div>

          {/* Memory Row */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            <button
              id="calc-key-mc"
              type="button"
              onClick={handleMemoryClear}
              title="Clear Memory (MC)"
              className="flex items-center justify-center rounded-lg bg-gray-100 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-40"
              disabled={!hasMemory}
            >
              MC
            </button>
            <button
              id="calc-key-mr"
              type="button"
              onClick={handleMemoryRecall}
              title="Recall Memory (MR)"
              className="flex items-center justify-center rounded-lg bg-gray-100 py-1.5 text-[11px] font-bold text-[#659287] hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-40"
              disabled={!hasMemory}
            >
              MR
            </button>
            <button
              id="calc-key-mplus"
              type="button"
              onClick={handleMemoryAdd}
              title="Add to Memory (M+)"
              className="flex items-center justify-center rounded-lg bg-gray-100 py-1.5 text-[11px] font-bold text-[#1A332C] hover:bg-gray-200 transition-colors active:scale-95"
            >
              M+
            </button>
            <button
              id="calc-key-mminus"
              type="button"
              onClick={handleMemorySubtract}
              title="Subtract from Memory (M-)"
              className="flex items-center justify-center rounded-lg bg-gray-100 py-1.5 text-[11px] font-bold text-[#1A332C] hover:bg-gray-200 transition-colors active:scale-95"
            >
              M-
            </button>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2">
            <button
              id="calc-key-c"
              onClick={handleClear}
              className="flex items-center justify-center rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors active:scale-95"
            >
              C
            </button>
            <button
              id="calc-key-backspace"
              onClick={handleBackspace}
              className="flex items-center justify-center rounded-xl bg-gray-100 p-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
            >
              <Delete className="h-4 w-4" />
            </button>
            <button
              id="calc-key-divide"
              onClick={() => handleOperator('÷')}
              className="flex items-center justify-center rounded-xl bg-[#88BDA4]/20 p-2.5 text-sm font-bold text-[#456c63] hover:bg-[#88BDA4]/35 transition-colors active:scale-95"
            >
              ÷
            </button>
            <button
              id="calc-key-multiply"
              onClick={() => handleOperator('×')}
              className="flex items-center justify-center rounded-xl bg-[#88BDA4]/20 p-2.5 text-sm font-bold text-[#456c63] hover:bg-[#88BDA4]/35 transition-colors active:scale-95"
            >
              ×
            </button>

            {['7', '8', '9'].map(num => (
              <button
                key={num}
                id={`calc-key-${num}`}
                onClick={() => handleDigit(num)}
                className="flex items-center justify-center rounded-xl bg-gray-50 p-2.5 text-sm font-semibold text-gray-800 hover:bg-[#E6F2DD]/70 transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              id="calc-key-subtract"
              onClick={() => handleOperator('-')}
              className="flex items-center justify-center rounded-xl bg-[#88BDA4]/20 p-2.5 text-sm font-bold text-[#456c63] hover:bg-[#88BDA4]/35 transition-colors active:scale-95"
            >
              -
            </button>

            {['4', '5', '6'].map(num => (
              <button
                key={num}
                id={`calc-key-${num}`}
                onClick={() => handleDigit(num)}
                className="flex items-center justify-center rounded-xl bg-gray-50 p-2.5 text-sm font-semibold text-gray-800 hover:bg-[#E6F2DD]/70 transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              id="calc-key-add"
              onClick={() => handleOperator('+')}
              className="flex items-center justify-center rounded-xl bg-[#88BDA4]/20 p-2.5 text-sm font-bold text-[#456c63] hover:bg-[#88BDA4]/35 transition-colors active:scale-95"
            >
              +
            </button>

            {['1', '2', '3'].map(num => (
              <button
                key={num}
                id={`calc-key-${num}`}
                onClick={() => handleDigit(num)}
                className="flex items-center justify-center rounded-xl bg-gray-50 p-2.5 text-sm font-semibold text-gray-800 hover:bg-[#E6F2DD]/70 transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              id="calc-key-equals"
              onClick={handleCalculate}
              className="row-span-2 flex items-center justify-center rounded-xl bg-[#659287] p-2.5 text-base font-bold text-white shadow hover:bg-[#52776e] transition-colors active:scale-95"
            >
              =
            </button>

            <button
              id="calc-key-0"
              onClick={() => handleDigit('0')}
              className="col-span-2 flex items-center justify-center rounded-xl bg-gray-50 p-2.5 text-sm font-semibold text-gray-800 hover:bg-[#E6F2DD]/70 transition-colors active:scale-95"
            >
              0
            </button>
            <button
              id="calc-key-dot"
              onClick={() => handleDigit('.')}
              className="flex items-center justify-center rounded-xl bg-gray-50 p-2.5 text-sm font-bold text-gray-800 hover:bg-[#E6F2DD]/70 transition-colors active:scale-95"
            >
              .
            </button>
          </div>
        </div>
      )}
    </>
  );
};
