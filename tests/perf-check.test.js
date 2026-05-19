import { it } from "vitest";
import { buildNerve } from "../src/math/nerve";
import { cohomology, classCoordinates } from "../src/math/cohomology";
import { ZRing, ZpRing, QRing, ZiRing, ZwRing } from "../src/math/ring";
import { presets } from "../src/presets/examples";
import * as TutorialScenes from "../src/tutorial/scenes";
function timed(label, fn) {
    const t0 = performance.now();
    fn();
    const dt = performance.now() - t0;
    console.log(`[perf] ${label}: ${dt.toFixed(1)} ms`);
}
const allPresets = [...presets];
const tutorialScenes = [
    { id: "scene_projective_rp2", space: TutorialScenes.SCENE_PROJECTIVE_RP2.space ?? "planar", discs: TutorialScenes.SCENE_PROJECTIVE_RP2.discs },
    { id: "scene_wedge2", space: TutorialScenes.SCENE_WEDGE2.space ?? "planar", discs: TutorialScenes.SCENE_WEDGE2.discs },
    { id: "scene_torus_h1", space: TutorialScenes.SCENE_TORUS_H1.space ?? "planar", discs: TutorialScenes.SCENE_TORUS_H1.discs },
];
it("perf: cohomology per ring across all presets", () => {
    for (const preset of [...allPresets, ...tutorialScenes]) {
        const discs = preset.discs.map((d, i) => ({
            id: `p${i}`, cx: d.cx, cy: d.cy, r: d.r, color: "#000",
            region: d.region,
        }));
        const nerve = buildNerve(discs, 3, { space: ('space' in preset && preset.space ? preset.space : "planar") });
        const Ns = [
            nerve.byDim[0]?.length ?? 0,
            nerve.byDim[1]?.length ?? 0,
            nerve.byDim[2]?.length ?? 0,
            nerve.byDim[3]?.length ?? 0,
        ];
        console.log(`[perf] preset=${preset.id} N=[${Ns.join(",")}]`);
        for (const [name, R] of [
            ["Z", ZRing], ["Z/2", ZpRing(2)], ["Z/4", ZpRing(4)],
            ["Z/12", ZpRing(12)], ["Q", QRing], ["Z[i]", ZiRing], ["Z[ω]", ZwRing],
        ]) {
            timed(`  ${preset.id}/${name}`, () => {
                cohomology(nerve, 0, R);
                cohomology(nerve, 1, R);
                cohomology(nerve, 2, R);
                // and classCoordinates for empty cochain
                classCoordinates(new Map(), nerve, 0, R);
                classCoordinates(new Map(), nerve, 1, R);
                classCoordinates(new Map(), nerve, 2, R);
            });
        }
    }
});
