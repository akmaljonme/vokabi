import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const COLORS = [
  { name: "yellow", cls: "bg-yellow-300/60 dark:bg-yellow-400/40" },
  { name: "green", cls: "bg-emerald-300/60 dark:bg-emerald-400/40" },
  { name: "pink", cls: "bg-pink-300/60 dark:bg-pink-400/40" },
];

/**
 * O'qish matnini belgilash (highlight) imkonini beruvchi wrapper.
 * Matnni tanlaganda (mouse yoki touch bilan) kichik rang tanlash paneli
 * chiqadi; rang tanlanganda tanlangan qism <mark> bilan belgilanadi.
 * Belgilangan joyga bosilsa, u olib tashlanadi (toggle).
 *
 * Eslatma: belgilar joriy sessiya davomida saqlanadi (sahifa yangilanganda
 * tozalanadi) — bu birinchi versiya, keyinroq localStorage'ga saqlash
 * qo'shilishi mumkin.
 */
export const TextHighlighter = ({ children, className }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{ x: number; y: number } | null>(null);
  const pendingRange = useRef<Range | null>(null);

  const clearToolbar = useCallback(() => {
    setToolbar(null);
    pendingRange.current = null;
  }, []);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Mavjud belgilangan joyga bosilsa — uni olib tashlash
      const target = e.target as HTMLElement;
      const mark = target.closest?.("mark[data-vokabi-highlight]");
      if (mark && container.contains(mark)) {
        const parent = mark.parentNode;
        if (parent) {
          while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
          parent.removeChild(mark);
          parent.normalize();
        }
        clearToolbar();
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        clearToolbar();
        return;
      }
      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;
      if (range.toString().trim().length === 0) { clearToolbar(); return; }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      pendingRange.current = range.cloneRange();
      setToolbar({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 40,
      });
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [clearToolbar]);

  const applyHighlight = (colorCls: string) => {
    const range = pendingRange.current;
    if (!range) return;
    try {
      const mark = document.createElement("mark");
      mark.setAttribute("data-vokabi-highlight", "1");
      mark.className = `${colorCls} rounded px-0.5 cursor-pointer transition-colors`;
      mark.title = "Olib tashlash uchun bosing";
      range.surroundContents(mark);
    } catch {
      // Tanlov bir nechta elementni kesib o'tsa (masalan paragraflar orasida),
      // surroundContents ishlamaydi — bunday holatda shunchaki e'tiborsiz qoldiramiz.
    }
    window.getSelection()?.removeAllRanges();
    clearToolbar();
  };

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      {children}
      {toolbar && (
        <div
          className="absolute z-20 flex items-center gap-1.5 bg-popover border border-border rounded-full px-2 py-1.5 shadow-lg -translate-x-1/2"
          style={{ left: toolbar.x, top: Math.max(0, toolbar.y) }}
        >
          {COLORS.map(c => (
            <button
              key={c.name}
              onClick={() => applyHighlight(c.cls)}
              className={`w-5 h-5 rounded-full ${c.cls} border border-black/10 hover:scale-110 transition-transform`}
              aria-label={`${c.name} bilan belgilash`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
