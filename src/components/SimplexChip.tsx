import type { Simplex } from "../state/types";

type Props = { simplex: Simplex; selected: boolean; onClick: () => void };

export default function SimplexChip({ simplex, selected, onClick }: Props) {
  return (
    <button
      type="button"
      className={`simplex-chip ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      {`{${simplex.join(",")}}`}
    </button>
  );
}
