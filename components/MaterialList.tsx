import { newId } from "@/lib/ids";
import type { Material } from "@/lib/types";

export function MaterialList({
  materials,
  onChange,
}: {
  materials: Material[];
  onChange: (materials: Material[]) => void;
}) {
  return (
    <div className="stack-tight">
      {materials.map((item, index) => (
        <div className="inline-field" key={item.id}>
          <input
            value={item.text}
            placeholder="例如：访谈录音，尚未整理"
            onChange={(event) => {
              const next = materials.slice();
              next[index] = { ...item, text: event.target.value };
              onChange(next);
            }}
          />
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => onChange(materials.filter((material) => material.id !== item.id))}
          >
            移除
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onChange([...materials, { id: newId(), text: "" }])}
        >
          添加材料
        </button>
      </div>
    </div>
  );
}
