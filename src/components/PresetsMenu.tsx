import { useStore } from "../state/store";
import { presets } from "../presets/examples";

export default function PresetsMenu() {
  const loadDiscs = useStore((s) => s.loadDiscs);
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const p = presets.find((x) => x.id === e.target.value);
        if (p) loadDiscs(p.discs, p.space);
        e.target.value = "";
      }}
    >
      <option value="" disabled>
        Load preset…
      </option>
      {presets.map((p) => (
        <option key={p.id} value={p.id} title={p.description}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
