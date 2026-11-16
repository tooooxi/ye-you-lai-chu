import type { SaveState } from "@/lib/useAutosave";

export function SaveMeter({
  state,
  error,
  onSave,
}: {
  state: SaveState;
  error: string;
  onSave: () => void;
}) {
  return (
    <div className={`save-meter no-print ${state === "error" ? "is-error" : ""}`} aria-live="polite">
      {state === "saving" && <span>正在写入这台电脑…</span>}
      {state === "saved" && <span>已写在这台电脑上</span>}
      {state === "dirty" && <span>有未写入的修改</span>}
      {state === "error" && <span>{error || "没有写入"}</span>}
      {state !== "saving" && state !== "saved" && (
        <button type="button" className="btn btn-ghost" onClick={onSave}>
          立即写入
        </button>
      )}
    </div>
  );
}
