import { GLYPHS, WORDMARK_VIEWBOX } from "@/lib/wordmark-paths";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg className={`wordmark ${className}`.trim()} viewBox={WORDMARK_VIEWBOX} role="img" aria-label="业有来处">
      <g transform="translate(0 880) scale(1 -1)">
        {GLYPHS.map((glyph, index) =>
          glyph.paths.map((d, pathIndex) => {
            const accent = pathIndex === glyph.accentIndex;
            return (
              <path
                key={`${glyph.char}-${pathIndex}`}
                d={d}
                transform={`translate(${index * 1000} 0)`}
                className={accent ? "wordmark-stroke" : undefined}
                style={{ fill: accent ? "var(--accent)" : "currentColor" }}
              />
            );
          }),
        )}
      </g>
    </svg>
  );
}
