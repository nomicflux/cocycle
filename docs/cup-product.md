# Cup product

The cup product is what turns the *sequence* of Čech cohomology groups
H⁰, H¹, H², … into a *graded ring* H\*(X; ℤ).

## Status

- **Implemented (raw-cochain).** `cup(a, b, nerve): Cochain` lives in
  `src/math/cup.ts`, with unit tests covering degree composition, the
  constant-1 identity, and the Leibniz identity
  `δ(a∪b) = (δa)∪b + (−1)^p · a∪(δb)` on the ∂Δ³ nerve. The cohomology
  panel exposes a `CupProductSection` that lets you cup any chosen H^p
  basis class against the currently-edited cochain and see the resulting
  (p+q)-cochain values on every (p+q)-simplex, along with a δ-check
  badge reporting whether the result is itself a cocycle.
- **Deferred.** Decomposing the cup result against the H^{p+q} basis —
  i.e., showing `[a]∪[b] = Σ cᵢ[gᵢ]` as a ring multiplication table —
  is still future work. It is gated on a ℤ-linear basis-coordinate
  solver (HNF / SNF of a basis matrix) that we haven't built yet. Until
  that exists, the panel can show the raw cochain but cannot resolve
  *which* cohomology class it represents.

## Definition

Cocycles are simplex-indexed functions, and the cover's simplicial complex
already uses **ordered** simplices (ascending vertex indices). With that
convention, the cup product of a p-cochain `a` and a q-cochain `b` is the
(p+q)-cochain defined by

```
(a ∪ b)([v_0, …, v_{p+q}]) = a([v_0, …, v_p]) · b([v_p, …, v_{p+q}])
```

where the dot is multiplication in the coefficient ring (here ℤ).

## Why it lifts to cohomology

A direct computation gives the Leibniz-style identity

```
δ(a ∪ b) = (δa) ∪ b + (−1)^p · a ∪ (δb).
```

Two consequences:

1. If both `a` and `b` are cocycles (`δa = δb = 0`), so is `a ∪ b`. The cup
   product preserves the property of being a cocycle.
2. Changing `a` by a coboundary `δc` changes `a ∪ b` by `δ(c ∪ b)` plus a
   second coboundary term — i.e. by a coboundary. Same for changes to `b`.
   So `[a] ∪ [b] := [a ∪ b]` is well-defined on cohomology classes.

Together: cup product descends to a bilinear map
`H^p(X; ℤ) ⊗ H^q(X; ℤ) → H^{p+q}(X; ℤ)`, making H\*(X; ℤ) a graded ring.

## Where it's non-trivial in Cocycle

Planar disc covers force `H² = 0` by Helly's theorem in R², so
`H¹ ∪ H¹ → H²` is zero on every planar cover. The "Torus mode" toggle
on the drawing panel reinterprets the canvas as a flat 2-torus, opening
up nerves with `H¹ ≠ 0` from wraparound 1-cycles and (with the right
configurations) `H² ≠ 0`. Cup product on `H¹ ⊗ H¹ → H²` for toroidal
covers is the canonical worked example; with a richer torus-mode preset
it should land a non-zero (p+q)-cochain in the section.

## Remaining work: the multiplication table

Three steps would complete the ring-table view:

1. **A ℤ-linear basis-coordinate solver.** Given a representative
   cocycle `c` of `H^{p+q}` and a chosen ℤ-basis `{g_i}` of the free
   part of `H^{p+q}`, return the integer coefficients `c_i` with
   `[c] = Σ c_i [g_i]` (or detect that `c` is a coboundary). This is
   the non-trivial piece — it reduces to Hermite / Smith Normal Form
   on the basis matrix and is roughly 100–200 lines of linear algebra
   on top of `src/math/snf.ts`.

2. **Bind `cup` over every (p, q) pair with p+q ≤ 2.** For each pair of
   chosen basis representatives, call `cup`, then run the solver to
   express the result in the H^{p+q} basis.

3. **Render the table in `CohomologyPanel`.** A small matrix view per
   (p, q) pair, with each cell showing the integer coefficient vector.
   The existing `CupProductSection` would then become a sibling
   "play around with cups manually" view rather than the only entry
   point.

Total cost when revisited: roughly 200–300 lines of math plus a small
UI addition.
