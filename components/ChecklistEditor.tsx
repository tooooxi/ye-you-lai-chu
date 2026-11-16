import { useState } from "react";
import { newId } from "@/lib/ids";
import { CHECKLIST_GROUPS } from "@/lib/labels";
import type { ChecklistGroup, ChecklistItem } from "@/lib/types";

export function ChecklistEditor({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState<ChecklistGroup>("review");

  function addItem() {
    const text = label.trim();
    if (!text) return;
    onChange([...items, { id: newId(), group, label: text, done: false }]);
    setLabel("");
  }

  return (
    <div className="stack">
      {CHECKLIST_GROUPS.map((section) => {
        const groupItems = items.filter((item) => item.group === section.id);
        const done = groupItems.filter((item) => item.done).length;
        return (
          <section key={section.id} className="check-group">
            <h3>
              {section.label}
              <span>
                {done}/{groupItems.length}
              </span>
            </h3>
            {groupItems.length === 0 ? <p className="hint">这一组是空的。</p> : null}
            {groupItems.map((item) => (
              <div key={item.id} className="check-item">
                <label>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(event) =>
                      onChange(items.map((current) => (current.id === item.id ? { ...current, done: event.target.checked } : current)))
                    }
                  />
                  <span>{item.label}</span>
                </label>
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => onChange(items.filter((current) => current.id !== item.id))}
                >
                  移除
                </button>
              </div>
            ))}
          </section>
        );
      })}
      <div className="inline-field">
        <select value={group} onChange={(event) => setGroup(event.target.value as ChecklistGroup)} aria-label="清单分组">
          {CHECKLIST_GROUPS.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
        <input
          value={label}
          placeholder="例如：第二轮审片"
          aria-label="新的清单条目"
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
        />
        <button type="button" className="btn btn-ghost" onClick={addItem}>
          添加
        </button>
      </div>
    </div>
  );
}
