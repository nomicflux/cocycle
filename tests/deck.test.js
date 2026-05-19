import { describe, it, expect } from "vitest";
import { DECK_ID, TORUS_PERIOD, deckCompose, deckInverse, deckApplyDisc, deckEq, deckKey, deckElements, } from "../src/math/deck";
const P = TORUS_PERIOD;
const D = (cx, cy, r) => ({
    id: `${cx},${cy},${r}`, cx, cy, r, color: "#000",
});
// Reference elements used by the existing twistedTranslates code:
const eps1_proj = { sx: 1, sy: -1, tx: P, ty: 0 }; // (x,y) ↦ (x+P, −y)
const eps2_proj = { sx: -1, sy: 1, tx: 0, ty: P }; // (x,y) ↦ (−x, y+P)
const eps12_proj = { sx: -1, sy: -1, tx: P, ty: -P }; // ε₁∘ε₂
const alpha_klein = { sx: 1, sy: 1, tx: P, ty: 0 }; // T_(P,0)
const beta_klein = { sx: -1, sy: 1, tx: 0, ty: P }; // (x,y) ↦ (−x, y+P)
describe("DeckElem — composition and inverse", () => {
    it("identity ∘ g = g", () => {
        expect(deckEq(deckCompose(DECK_ID, eps1_proj), eps1_proj)).toBe(true);
        expect(deckEq(deckCompose(eps2_proj, DECK_ID), eps2_proj)).toBe(true);
    });
    it("g ∘ g⁻¹ = identity", () => {
        for (const g of [eps1_proj, eps2_proj, eps12_proj, alpha_klein, beta_klein]) {
            expect(deckEq(deckCompose(g, deckInverse(g)), DECK_ID)).toBe(true);
            expect(deckEq(deckCompose(deckInverse(g), g), DECK_ID)).toBe(true);
        }
    });
    it("RP² relation: ε₁² = T_(2P, 0)", () => {
        const sq = deckCompose(eps1_proj, eps1_proj);
        expect(sq).toEqual({ sx: 1, sy: 1, tx: 2 * P, ty: 0 });
    });
    it("RP² relation: ε₂² = T_(0, 2P)", () => {
        const sq = deckCompose(eps2_proj, eps2_proj);
        expect(sq).toEqual({ sx: 1, sy: 1, tx: 0, ty: 2 * P });
    });
    it("RP² relation: ε₁ε₂ matches the existing ε₁₂ coset rep", () => {
        expect(deckEq(deckCompose(eps1_proj, eps2_proj), eps12_proj)).toBe(true);
    });
    it("RP² non-abelian: ε₂ε₁ ≠ ε₁ε₂", () => {
        const a = deckCompose(eps1_proj, eps2_proj);
        const b = deckCompose(eps2_proj, eps1_proj);
        expect(deckEq(a, b)).toBe(false);
    });
    it("Klein relation: β² = T_(0, 2P)", () => {
        const sq = deckCompose(beta_klein, beta_klein);
        expect(sq).toEqual({ sx: 1, sy: 1, tx: 0, ty: 2 * P });
    });
    it("Klein relation: β α β⁻¹ = α⁻¹", () => {
        const conj = deckCompose(beta_klein, deckCompose(alpha_klein, deckInverse(beta_klein)));
        expect(deckEq(conj, deckInverse(alpha_klein))).toBe(true);
    });
    it("applying composed map equals composing applications", () => {
        const d = D(3, -1, 2);
        const composed = deckCompose(eps1_proj, eps2_proj);
        const direct = deckApplyDisc(composed, d);
        const stepwise = deckApplyDisc(eps1_proj, deckApplyDisc(eps2_proj, d));
        expect(direct.cx).toBeCloseTo(stepwise.cx);
        expect(direct.cy).toBeCloseTo(stepwise.cy);
    });
    it("(g₁ g₂)⁻¹ = g₂⁻¹ g₁⁻¹", () => {
        const lhs = deckInverse(deckCompose(eps1_proj, eps2_proj));
        const rhs = deckCompose(deckInverse(eps2_proj), deckInverse(eps1_proj));
        expect(deckEq(lhs, rhs)).toBe(true);
    });
});
describe("deckApplyDisc — agrees with the existing twistedTranslates formulas", () => {
    it("ε₁ projective sends (cx, cy) to (cx + P, −cy)", () => {
        const d = D(2, 3, 1);
        const e = deckApplyDisc(eps1_proj, d);
        expect(e.cx).toBe(2 + P);
        expect(e.cy).toBe(-3);
    });
    it("ε₂ projective sends (cx, cy) to (−cx, cy + P)", () => {
        const d = D(2, 3, 1);
        const e = deckApplyDisc(eps2_proj, d);
        expect(e.cx).toBe(-2);
        expect(e.cy).toBe(3 + P);
    });
    it("ε₁ε₂ projective sends (cx, cy) to (−cx + P, −cy − P)", () => {
        const d = D(2, 3, 1);
        const e = deckApplyDisc(eps12_proj, d);
        expect(e.cx).toBe(-2 + P);
        expect(e.cy).toBe(-3 - P);
    });
});
describe("deckElements — window enumerations", () => {
    it("torus: 9 elements, all pure translations by multiples of P", () => {
        const elts = deckElements("torus");
        expect(elts).toHaveLength(9);
        for (const g of elts) {
            expect(g.sx).toBe(1);
            expect(g.sy).toBe(1);
            expect([-P, 0, P]).toContain(g.tx);
            expect([-P, 0, P]).toContain(g.ty);
        }
    });
    it("klein: 36 elements", () => {
        expect(deckElements("klein")).toHaveLength(36);
    });
    it("projective: 36 elements", () => {
        expect(deckElements("projective")).toHaveLength(36);
    });
    it("planar: 1 element (identity)", () => {
        const elts = deckElements("planar");
        expect(elts).toHaveLength(1);
        expect(deckEq(elts[0], DECK_ID)).toBe(true);
    });
});
describe("deckKey — distinct DeckElems map to distinct keys", () => {
    it("identity and ε₁ have different keys", () => {
        expect(deckKey(DECK_ID)).not.toBe(deckKey(eps1_proj));
    });
    it("equal DeckElems share a key", () => {
        expect(deckKey({ sx: 1, sy: -1, tx: P, ty: 0 })).toBe(deckKey(eps1_proj));
    });
});
