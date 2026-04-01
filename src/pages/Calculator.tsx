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

  const handleCalculate = () => {
    try {
      const result = eval(display);
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
    <div className="h-screen max-w-md mx-auto bg-[#111111] flex flex-col px-4 pt-6 pb-24">

      {/* PUSH KEYPAD DOWN */}
      <div className="flex-1" />

      {/* BIG DISPLAY ABOVE KEYPAD */}
      <div className="mb-4">
        <div className="bg-[#1d1d1d] p-4 rounded-xl text-right">
          <p className="text-6xl text-[#01E777] font-bold break-all">
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
                  ? "bg-[#01E777] text-black"
                  : isAction
                  ? "bg-[#2a2a2a] text-white"
                  : "bg-[#1d1d1d] text-white"
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