import { useState } from "react";

const CalculatorPage: React.FC = () => {
  const [display, setDisplay] = useState("0");

  const handleClick = (value: string) => {
    if (display === "0" && value !== ".") {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const handleClear = () => {
    setDisplay("0");
  };

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
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "=", "+"
  ];

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#111111] rounded-2xl">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-white">Calculator</h1>

        <button
          onClick={handleClear}
          className="bg-red-500 text-black font-bold px-3 py-1 rounded-full"
        >
          C
        </button>
      </div>

      {/* DISPLAY */}
      <div className="mb-4 bg-[#1d1d1d] p-4 rounded-xl text-right">
        <p className="text-2xl text-[#01E777] font-bold break-all">
          {display}
        </p>
      </div>

      {/* ACTION ROW */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleDelete}
          className="flex-1 bg-[#1d1d1d] text-gray-300 py-2 rounded-xl"
        >
          DEL
        </button>
      </div>

      {/* BUTTON GRID */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() =>
              btn === "=" ? handleCalculate() : handleClick(btn)
            }
            className={`py-3 rounded-xl font-bold ${
              btn === "="
                ? "bg-[#01E777] text-black"
                : "bg-[#1d1d1d] text-white"
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalculatorPage;