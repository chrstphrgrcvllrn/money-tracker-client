import { XMarkIcon } from "@heroicons/react/24/outline";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

// A bottom sheet, for content better reached by a thumb than a centered
// dialog. Same open/onClose/title/children shape as Modal, so a page can
// switch between the two without touching its own markup.
export default function Drawer({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-sm",
}: DrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes drawer-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .drawer-animate { animation: drawer-slide-up 0.25s cubic-bezier(0.32, 0.72, 0, 1); }
        @media (min-width: 768px) {
          @keyframes drawer-scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .drawer-animate { animation: drawer-scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        }
      `}</style>

      <div
        className={`w-full ${maxWidth} bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl p-5 pt-3 md:pt-5 space-y-4 drawer-animate max-h-[85vh] overflow-y-auto`}
      >
        {/* Grab handle: a mobile bottom-sheet affordance, hidden on the
            centered desktop layout where it wouldn't mean anything. */}
        <div className="md:hidden flex justify-center pb-1">
          <span className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-[var(--text-primary)] text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition"
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
