import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-sm",
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-animate { animation: modal-scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      <div
        className={`w-full ${maxWidth} bg-[#1C1C1E] rounded-2xl shadow-2xl p-5 space-y-4 modal-animate max-h-[85vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2A2A2C] transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
