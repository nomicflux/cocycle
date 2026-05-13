# Cup product — design sketch (not implemented)

The cup product is what turns the *sequence* of Čech cohomology groups
H⁰, H¹, H², … into a *graded ring* H\*(X; ℤ). It is deliberately out of scope
for the current Cocycle app, but this note records what it would take to add it
later.

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

## Why we skipped it

In R² with disc covers (the only thing Cocycle supports today), Helly's
theorem forces every "almost full" cluster of discs to have a common point,
so the nerve cannot host a non-trivial 2-cycle except in degenerate ways. The
interesting cup-product target (H¹ ⊗ H¹ → H²) is therefore visible only on
spaces like S¹ × S¹ that cannot be realised as a planar disc cover. For the
covers Cocycle can draw, cup products on H¹ are typically zero — so the
feature would pay for itself in code without paying off pedagogically.

## Implementation plan when revisited

Three changes, in order:

1. **Expose cochain representatives in `src/math/cohomology.ts`.** The
   current `CohomologyDim.cocycleBasis` already gives `{ cochain, isCoboundary }`
   for every basis element. Pull a clean set of free-generator representatives
   out of it and surface them as `representatives: Cochain[]` so the cup
   product has something concrete to multiply.

2. **Add `src/math/cup.ts`** with a single function:

   ```ts
   export function cup(a: Cochain, b: Cochain, nerve: Nerve): Cochain
   ```

   that iterates over the (p+q)-simplices of `nerve`, splits each ordered
   simplex at index `p`, looks up the front face in `a` and the back face in
   `b`, and accumulates the product. Add a unit test that asserts the Leibniz
   identity on random cochains.

3. **Render a multiplication table in `CohomologyPanel`.** For each pair of
   free generators of H^p and H^q (p+q ≤ 2 given our scope), display the
   resulting cohomology class in H^{p+q}, expressed as a ℤ-linear combination
   of the chosen H^{p+q} basis. The "decompose a cochain against the H^k
   basis" capability is the prerequisite — also currently out of scope —
   and would have to be added at the same time.

The total surface area is roughly 60–120 lines of math plus a small UI
addition, but is gated on having (3) — a basis-coordinate solver for
cocycles — which is itself a non-trivial Z-linear algebra step (HNF / SNF of
the kernel basis matrix).
