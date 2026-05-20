import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// ContextMenu - Generic right-click context menu for Timeline
// Renders a floating menu at cursor position with action items.
// ============================================================================

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: MenuItem[];
  onAction: (actionId: string) => void;
}

const INITIAL_STATE: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  items: [],
  onAction: () => {},
};

/** Hook to manage context menu state */
export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>(INITIAL_STATE);

  const show = useCallback(
    (x: number, y: number, items: MenuItem[], onAction: (id: string) => void) => {
      setMenu({ visible: true, x, y, items, onAction });
    },
    [],
  );

  const hide = useCallback(() => {
    setMenu(INITIAL_STATE);
  }, []);

  return { menu, show, hide };
}

/** Context menu component */
export default function ContextMenu({
  state,
  onClose,
}: {
  state: ContextMenuState;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    if (!state.visible) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [state.visible, onClose]);

  if (!state.visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[160px] py-1 bg-gray-800 border border-gray-600 rounded-md shadow-xl"
      style={{ left: state.x, top: state.y }}
    >
      {state.items.map((item) => {
        if (item.separator) {
          return <div key={item.id} className="h-px my-1 bg-gray-600" />;
        }
        return (
          <button
            key={item.id}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors border-none cursor-pointer ${
              item.disabled
                ? 'text-gray-500 cursor-not-allowed'
                : item.danger
                  ? 'text-red-400 hover:bg-red-900/30'
                  : 'text-gray-200 hover:bg-gray-700'
            }`}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                state.onAction(item.id);
                onClose();
              }
            }}
          >
            {item.icon && <span className="w-4 text-center">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-gray-500 ml-4">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
