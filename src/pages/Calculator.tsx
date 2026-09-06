import { useEffect, useState } from "react";

const CalculatorPage: React.FC = () => {
  const [display, setDisplay] = useState(() => {
    return localStorage.getItem("calculatorDisplay") || "0";
  });

  useEffect(() => {
    localStorage.setItem("calculatorDisplay", display);
  }, [display]);

  const handleClick = (value: string) => {
    if (display === "0" && value !== ".") {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const handleClear = () => setDisplay("0");

  const handleDelete = () => {
    if (display.length === 1) return setDisplay("0");
    setDisplay(display.slice(0, -1));
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

  const buttons = [
    "C", "DEL", "/", "*",
    "7", "8", "9", "-",
    "4", "5", "6", "+",
    "1", "2", "3", "=",
    "0", ".",
  ];

  const handleAction = (btn: string) => {
    if (btn === "C") return handleClear();
    if (btn === "DEL") return handleDelete();
    if (btn === "=") return handleCalculate();
    return handleClick(btn);
  };

  return (
    <div className="h-screen max-w-md mx-auto bg-[#000000] flex flex-col px-4 pt-6 pb-24">

      {/* PUSH KEYPAD DOWN */}
      <div className="flex-1" />

      {/* BIG DISPLAY ABOVE KEYPAD */}
      <div className="mb-4">
        <div className="bg-[#1C1C1E] p-4 rounded-xl text-right">
          <p className="text-6xl text-white font-bold break-all">
            {display}
          </p>
        </div>
      </div>

      {/* KEYPAD */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => {
          const isEqual = btn === "=";
          const isAction = btn === "C" || btn === "DEL";

          return (
            <button
              key={btn}
              onClick={() => handleAction(btn)}
              className={`py-4 rounded-xl font-bold text-xl ${
                isEqual
                  ? "bg-[#EB5647] text-white"
                  : isAction
                  ? "bg-[#2a2a2a] text-white"
                  : "bg-[#1C1C1E] text-white"
              }`}
            >
              {btn}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalculatorPage;