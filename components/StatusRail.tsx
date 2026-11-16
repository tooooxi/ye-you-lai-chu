import { PROJECT_STATUSES, STATUS_LABEL } from "@/lib/labels";
import type { ProjectStatus } from "@/lib/types";

export function StatusRail({
  status,
  onChange,
}: {
  status: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
}) {
  const current = PROJECT_STATUSES.indexOf(status);
  return (
    <div className="rail" role="radiogroup" aria-label="项目阶段">
      {PROJECT_STATUSES.map((item, index) => {
        const state = index < current ? "is-done" : index === current ? "is-current" : "";
        return (
          <div className={`rail-step ${state}`} key={item}>
            <button type="button" role="radio" aria-checked={item === status} onClick={() => onChange(item)}>
              <span className="rail-track">
                <span className="dot" />
                {index < PROJECT_STATUSES.length - 1 ? <span className="rail-line" /> : null}
              </span>
              <span className="rail-name">{STATUS_LABEL[item]}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
