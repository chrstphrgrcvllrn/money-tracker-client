import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAuthStore } from "@/stores/auth.store";
import { readUserItem, writeUserItem } from "@/lib/userStorage";

const STORAGE_KEY = "calculatorDisplay";

const BUTTONS = [
  "C", "DEL", "/", "*",
  "7", "8", "9", "-",
  "4", "5", "6", "+",
  "1", "2", "3", "=",
  "0", ".",
];

const OPERATORS = ["/", "*", "-", "+"];

// What each key shows / announces, where it differs from its value.
const LABELS: Record<string, string> = { "/": "÷", "*": "×", "-": "−", DEL: "⌫" };
const ARIA_LABELS: Record<string, string> = {
  C: "Clear",
  DEL: "Delete",
  "/": "Divide",
  "*": "Multiply",
  "-": "Subtract",
  "+": "Add",
  "=": "Equals",
  ".": "Decimal point",
};

const evaluateExpression = (expr: string): number => {
  const tokens = expr.match(/(\d+\.?\d*|\.\d+|[+\-*/])/g);
  if (!tokens) throw new Error("Invalid expression");

  // First pass: handle * and /
  const stack: number[] = [parseFloat(tokens[0])];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const num = parseFloat(tokens[i + 1]);
    if (op === "*") {
      stack[stack.length - 1] *= num;
    } else if (op === "/") {
      stack[stack.length - 1] /= num;
    } else {
      stack.push(op === "-" ? -num : num);
    }
  }

  return stack.reduce((sum, n) => sum + n, 0);
};

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CalculatorModal({ open, onClose }: CalculatorModalProps) {
  const userId = useAuthStore((s) => s.user?.id ?? "");

  const [display, setDisplay] = useState(() => readUserItem(STORAGE_KEY, userId) || "0");

  useEffect(() => {
    // storage errors are ignored inside writeUserItem: the calculator still works
    writeUserItem(STORAGE_KEY, userId, display);
  }, [display, userId]);

  const handleClick = (value: string) => {
    // Typing after an "Error" starts a fresh expression.
    if (display === "Error" || (display === "0" && value !== ".")) {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const handleDelete = () => {
    if (display === "Error" || display.length === 1) return setDisplay("0");
    setDisplay(display.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      const result = evaluateExpression(display);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        throw new Error("Invalid result");
      }
      setDisplay(String(result));
    } catch {
      setDisplay("Error");
    }
  };

  const handleAction = (btn: string) => {
    if (btn === "C") return setDisplay("0");
    if (btn === "DEL") return handleDelete();
    if (btn === "=") return handleCalculate();
    return handleClick(btn);
  };

  return (
    <Modal open={open} onClose={onClose} title="Calculator">
      <div className="bg-[var(--bg-page)] p-4 rounded-xl text-right">
        <p
          aria-live="polite"
          className="text-4xl font-bold break-all text-[var(--text-primary)]"
        >
          {display}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {BUTTONS.map((btn) => {
          const isEqual = btn === "=";
          const isOperator = OPERATORS.includes(btn);
          const isAction = btn === "C" || btn === "DEL";

          return (
            <button
              key={btn}
              onClick={() => handleAction(btn)}
              aria-label={ARIA_LABELS[btn]}
              className={`py-4 rounded-xl font-bold text-xl ${
                isEqual
                  ? "row-span-2 bg-[var(--btn-bg)] text-[var(--btn-text)]"
                  : isOperator
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : isAction
                  ? "bg-[var(--border-subtle)] text-[var(--text-primary)]"
                  : "bg-[var(--bg-input)] text-[var(--text-primary)]"
              } ${btn === "0" ? "col-span-2" : ""}`}
            >
              {LABELS[btn] ?? btn}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
