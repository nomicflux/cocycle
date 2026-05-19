import type { Chapter, Feature } from "./types";
import * as scenes from "./scenes";
import * as P from "./predicates";

export const CHAPTERS: Chapter[] = [
  {
    id: "welcome",
    title: "Welcome",
    prose:
      "Imagine you and a colleague each survey a small region of a country. Each survey is internally consistent, but where two regions overlap, they sometimes disagree. Can you stitch the surveys into a single global picture?\n\n**Cohomology** is the mathematics of those disagreements: what global information is forced (or forbidden) by purely local data. Over the following interactive chapters we'll build *Čech cohomology* from scratch.\n\nA few mechanical notes before we start:\n\n• The grey square is the canvas; everything you can manipulate lives there.\n• Drag a disk's body to move it. Drag the small handle on its right edge to resize. Shift-click to remove.\n• For the tutorial, the canvas wraps around at the edges (topologically, you're on a **torus**). A disk that touches the right edge spills back in on the left, and a disk near the top spills back at the bottom.\n\nClick Next when you're ready.",
    scene: scenes.SCENE_EMPTY,
    unlocks: ["drawing"],
  },
  {
    id: "covers-and-nerve",
    title: "Open covers and the nerve",
    prose:
      "To reason about a whole space using only local information, we first need a way of carving it into local pieces.\n\nAn **open cover** is a collection of patches (here, disks) whose union covers the entire space. Two patches can overlap, three can mutually overlap, and so on. The combinatorial fact 'patches A and B share area' is itself data — and the **nerve** of the cover is the abstract object built from nothing but those facts.\n\n• The nerve is *combinatorial*: a list of which subsets of patches have common intersection. Geometry can be represented with labels pointing to the overlaps, discarding the rest of the information.\n\n• For now, the nerve has the same topology as the original space. The cover is a visualization tool; the nerve is what we'll actually compute with.\n\nTry it: drag the two disks toward each other until their circles overlap.",
    scene: scenes.SCENE_TWO_NEAR,
    unlocks: ["nerve-set"],
    goal: P.hasEdge,
    goalHint:
      "Click and hold the body of either disk in the canvas, then drag it sideways until the two circles cross. As soon as they share any area, the 'Nerve (sets)' panel appears with an edge {0,1} listed inside it.",
  },
  {
    id: "simplices",
    title: "Simplices from k-fold intersections",
    prose:
      "You just saw a single edge appear when two disks overlapped. That edge is a *1-dimensional piece of structure*, glued between the two endpoints.\n\nEvery (k+1)-fold intersection in the cover becomes a **k-simplex** in the nerve.\n\n• One disk → a **0-simplex** (a *vertex*).\n• Two overlapping disks → a **1-simplex** (an *edge*).\n• Three disks with a common point → a **2-simplex** (a *triangle*). And so on.\n\nThe **nerve** is the collection of all such simplices. Two ways to picture it: a list of index-tuples like {0,1,2} (the combinatorial view), or a geometric object built by gluing actual points, line segments, and triangles together along their shared sub-simplices (the geometric view).\n\nPush the three disks together until you find a configuration where *all three* circles share a common section.",
    scene: scenes.SCENE_THREE_PARTIAL,
    unlocks: ["nerve-geom"],
    goal: P.hasTriangle,
    goalHint:
      "Drag any one disk's body toward the other two. Watch for a small lens-shaped region where all three circles overlap simultaneously. As soon as that triple region exists, the 'Nerve (geometric)' panel appears with a triangle drawn for {0,1,2}.",
  },
  {
    id: "orientation",
    title: "Orientation and the boundary operator",
    prose:
      "Simplices aren't symmetric. The edge [0,1] (from disk 0 to disk 1) is a *different* object from the edge [1,0]. The algebra we're about to build is signed: positive and negative contributions cancel each other out.\n\nThe simplest way to assign signs consistently is to fix an **orientation** — a canonical ordering of vertices. We use index order: a simplex is always written {i₀, i₁, …, iₖ} with i₀ < i₁ < … < iₖ. This gives every simplex a default sign convention.\n\nThis representation gives us the **boundary operator** ∂. For a 2-simplex [i,j,k] (with i<j<k) we define\n\n• ∂[i,j,k] = [j,k] − [i,k] + [i,j]\n\nThree edges, signs alternating, the sign on each face being (−1)^(position of the omitted vertex) (so 0 -> 1 and 1 -> 2 are positive, but 0 -> 2 is negative).\n\nThe alternation gives us the identity **∂∂ = 0**: 'the boundary of a boundary is zero'. Adjacent sub-faces cancel pairwise.\n\nCheck by hand on the triangle above: the boundary is three edges, and the boundary of *that* is six vertices, but each vertex appears exactly twice with opposite signs:\n\n• ∂[0,1,2] = [1,2] - [0,2] + [0, 1] \\\\ *Forward arrows from 1 -> 2 & 0 -> 1, then one 'skipping a vertex' from 0 -> 2 and so negative* \n• ∂[1, 2] = [2] - [1]; ∂[0, 1] = [0] - [1]; ∂[0, 2] = [2] - [0] \\\\ *Each edge is the ending vertex minus the starting vertex* \n• ∂∂[0,1,2] = ([2] - [1]) - ([2] - [0]) + ([1] - [0]) = [2] - [1] - [2] + [0] + [1] - [0] = 0\n\nClick the 'arrows' checkbox so the orientations of edges become visible, then click an edge in the nerve to highlight it (either in the geometric view or in the set view).",
    scene: scenes.SCENE_THREE_PARTIAL,
    unlocks: ["orientation-arrows"],
    goal: P.hasSelectedEdge,
    goalHint:
      "Look at the header of the 'Nerve (geometric)' panel — there are 'labels' and 'arrows' checkboxes. Tick 'arrows'. Then click any edge (a line connecting two vertex circles) in that panel. The edge highlights, and the arrow on it shows the canonical orientation from lower-index to higher-index endpoint.",
  },
  {
    id: "cochains",
    title: "Cochains",
    prose:
      "Next, we put *data* on the structure.\n\nA **k-cochain** is a function: an value assigned to each k-simplex. A 0-cochain assigns an value to each vertex (i.e. to each disk). A 1-cochain assigns one to each edge. A 2-cochain to each triangle. More technically: a cochain is a map\n\n  c : {k-simplices} → <some ring **R**>.\n\nHere, we will use the integers (ℤ) for our values — we'll visit other coefficient rings later.\n\nWe have a few mental models for cochains:\n\n• as functions on simplices,\n• as 'labels' written on each simplex of a drawing,\n• as elements of an abelian group **Cᵏ** (the group of k-cochains, with pointwise addition).\n\nThe Cohomology panel is now open. Put any integers you like on the vertices.",
    scene: scenes.SCENE_FOUR_SQUARE,
    unlocks: ["cohomology", "cochain-editor"],
    goal: P.hasNonzeroVertexCochain,
    goalHint:
      "In the bottom-right 'Cohomology' panel you'll see the cochain editor with one row per disk, each row showing the simplex like {0} and a number input. Type any nonzero integer (say 7) into one of those inputs.",
  },
  {
    id: "coboundary",
    title: "The coboundary δ",
    prose:
      "You just labelled vertices with integers — that's a 0-cochain. Next: every edge in the nerve corresponds to a pair of overlapping disks, with a 'left endpoint' (smaller index) and 'right endpoint' (larger index). Each edge inherits a value — the difference between its two endpoint labels.\n\nThat operation is the **coboundary**, written δ. Concretely: (δc)(edge from i to j, with i<j) = c(j) − c(i). Run δ on a 0-cochain and you get a 1-cochain. Run δ on a 1-cochain and you get a 2-cochain.\n\n• **δ measures non-constancy.** If your vertex labels are all the same number, then every difference is 0, and so δc is zero everywhere. If your labels vary, δc records exactly *where* and *by how much* they disagree across overlaps.\n\n• **δ is the discrete gradient.** Same shape as ∇ in calculus: 'rate of change between neighbours'. Cohomology can be considered to be the answer to 'which labellings look like rates of change, and which don't?'\n\n• **δ ∘ δ = 0**, just like **∂ ∘ ∂ = 0**. (The coboundary of a coboundary is 0, just as is the boundary of a boundary. This is essentially the condition that boundaries and coboundaries can be glued together meaningfully.)\n\nTry it now: give two overlapping disks different integer labels and watch δc light up.",
    scene: scenes.SCENE_FOUR_SQUARE,
    unlocks: [],
    goal: P.sawDelta,
    goalHint:
      "In the drawing panel, overlap two circles so they're joined by an edge in the nerve panels. In the cochain editor, type 0 in one of those disks' rows and any nonzero integer (e.g. 1) on the other. A yellow 'δc ≠ 0' box appears right under the editor — it lists each edge where the endpoint labels disagree, with the difference as its value.",
  },
  {
    id: "cocycles",
    title: "Cocycles",
    prose:
      "You've now seen δ produce nonzero output. That is where our stitched-together maps disagree. But what we want is to be able to put together a global map from the local surveys: cochains where δ produces *nothing*.\n\nA k-cochain c is a **cocycle** if δc = 0. Equivalently, c lies in the *kernel* of δ. The group of k-cocycles is written **Zᵏ** (a subgroup of Cᵏ).\n\nFor 0-cochains, cocycle means δc = 0 on every edge, which forces c to be constant on each connected component of the nerve.\n\nFor 1-cochains, cocycles become richer. δc = 0 on an edge cochain means: 'around every triangle, the alternating sum of the three edge values cancels'. Geometrically, triangles are the discrete analogue of small loops, so a 1-cocycle is one whose 'integral around every loop' vanishes — exactly the discrete cousin of a closed 1-form in calculus.\n\nCohomology is built from these cocycles. H¹ will end up being 'all 1-cocycles, modulo a notion of equivalence' — and that equivalence is *exactly* 'differs by something of the form δb'. The next chapter explains these equivalences.\n\nOverlap circles to ensure that we have some edges. Put nonzero integers on those edges (in the C1 section) such that, even with those values entered, the 'δc ≠ 0' box *never appears* — the alternating sum around every triangle is zero.",
    scene: scenes.SCENE_TORUS_RING,
    unlocks: ["h1"],
    goal: P.hasH1Cocycle,
    goalHint:
      "Click the H¹ tab in the Cohomology panel — the editor now has one row per edge. A short way to land a 1-cocycle on this torus cover: pick a *closed loop* of edges (one that wraps around the torus) and give each edge value 1, leaving all other edges at 0. If you've chosen a true loop, no triangle's alternating sum is nonzero, so the yellow 'δc ≠ 0' box stays absent — that's the cocycle condition. If a δc box does appear after you enter values, an edge is breaking the loop; adjust until the box never shows while at least one edge value remains nonzero.",
  },
  {
    id: "non-cocycles",
    title: "Coboundaries and non-cocycles",
    prose:
      "Some cocycles are 'trivial': they're equal to δb for some lower-degree cochain b. Such cochains are automatically cocycles because δ∘δ = 0.\n\n*Worked example.* Pick a 0-cochain b on the three vertices {0}, {1}, {2}, with b({0}) = 0, b({1}) = 3, b({2}) = 1. Then c = δb is the 1-cochain:\n\n  c({0,1}) = b({1}) − b({0}) = 3 − 0 = 3\n  c({0,2}) = b({2}) − b({0}) = 1 − 0 = 1 \\\\ *Remember the orientation of {0, 2} goes from 0 to 2, counter to the established orientation*\n  c({1,2}) = b({2}) − b({1}) = 1 − 3 = −2\n\nNow apply δ once more, evaluating δc on the triangle {0,1,2}:\n\n  δc({0,1,2}) = c({1,2}) − c({0,2}) + c({0,1}) = (−2) − (1) + (3) = 0\n\nIn general, for any 0-cochain b:\n\n  δ²b({i,j,k}) = (b(k) − b(j)) − (b(k) − b(i)) + (b(j) − b(i)) = 0\n\nEvery term appears twice with opposite signs — the same pairwise cancellation that made ∂∂ = 0 in the orientation chapter, just dualized to cochains.\n\nThese trivially-cocycle cochains are called **coboundaries**. The group of k-coboundaries is written **Bᵏ**. By construction Bᵏ ⊆ Zᵏ.\n\n('coboundary' is doing double duty. The *operator* δ is also called *the coboundary*. The *noun* coboundary refers to a specific cochain in the image of δ.)\n\nCoboundaries are the cocycles that *fail to carry global information*. If c = δb, then c was 'generated' by a simpler labelling b; it's the gradient of a function, in the discrete sense. The interesting cocycles are the ones that *aren't* coboundaries — those will be the actual content of H¹.\n\nThe opposite of a cocycle is a **non-cocycle**: a cochain with δc ≠ 0. Take the cocycle you built last chapter and break it by hand.",
    scene: scenes.SCENE_TORUS_RING,
    unlocks: ["h2"],
    goal: P.hasNonCocycle,
    goalHint:
      "Keep your cocycle from the previous step in the H¹ editor. Click any one edge's input field and change its value by 1 (e.g. 0 → 1, or 1 → 2). The yellow 'δc ≠ 0' box reappears, listing every triangle whose alternating sum no longer cancels — and those triangles turn red in the 'Nerve (geometric)' panel.",
  },
  {
    id: "generators",
    title: "Free generators of H¹",
    prose:
      "An abelian group has *generators*: elements you can combine (with integer coefficients) to reach every element. A generator is **free** when it carries no torsion relation — there's no positive n with n·g = 0.\n\nIn our setting Hᵏ is itself an abelian group: cocycles modulo coboundaries. Its free generators answer 'what does a nontrivial cohomology class actually look like as a labelling?'\n\nEach generator is a *class*, not a single cochain. Any cocycle in the class is a **representative**: a concrete cochain that stands in for its whole equivalence class. Two representatives of the same class differ by a coboundary δb for some b, but the H¹ chip prints the same coordinates for both.\n\nThis canvas covers a loop with 3 overlapping discs. The nerve has 3 vertices, 3 edges, and no triangles (no point lies in all three discs at once), so δ¹ has nothing to act on — every 1-cochain is automatically a cocycle. H¹ comes out to ℤ — one free generator, geometrically 'walk once around the loop'.\n\nThe Cohomology panel's C¹ card now has a 'set c¹ to' cycler. Click › to load the generator's representative into the editor.",
    scene: scenes.SCENE_CIRCLE_TRIANGLE,
    unlocks: ["cocycle-basis"],
    goal: P.hasH1Cocycle,
    goalHint:
      "On the H¹ tab, look for the 'set c¹ to' row on the C¹ card (below the H¹ = ℤ chip). Click ›. The cochain editor fills with a specific 1-cocycle representing H¹'s single free generator — its nonzero values trace the loop. With no triangles in the nerve, δc¹ is automatically zero, so this is a cocycle and the chapter advances.",
  },
  {
    id: "cohomology-circle",
    title: "Cohomology of the circle",
    prose:
      "This 3-disc cover of S¹ has 3 vertices, 3 edges, no 2-faces. With no triangles in the nerve, δ¹ has nothing to act on, so every 1-cochain is automatically a cocycle (Z¹ = C¹). H¹ on this cover is C¹ / B¹.\n\nType c({0,1}) = 1 on the C¹ card — c¹ = (1, 0, 0), and note the H¹ chip's class readout shows [1].\nNow pick a coboundary by typing c({2}) = 1 on the C⁰ card. The C¹ shadow column fills with δc⁰ = (0, +1, +1) on edges {0,1}, {0,2}, {1,2}.\nAdd that coboundary to the cocycle: set c¹ to (1, 1, 1). The class still reads [1].\n\nThese two distinct cocycles have the same H¹ class. That is the the quotient: cocycles that differ by a coboundary represent the same class in Hᵏ.",
    scene: scenes.SCENE_CIRCLE_TRIANGLE,
    unlocks: [],
    goal: P.addedDifferentCoboundary,
    goalHint:
      "On the C⁰ card, type a different 0-cochain — e.g., c({0}) = 1 instead of c({2}) = 1. The C¹ shadow column updates to a new δc⁰. Add the new shadow values to (1, 0, 0) and type the sum into c¹. The H¹ chip's class readout still reads [1].",
  },
  {
    id: "good-cover",
    title: "Good covers",
    prose:
      "A cover {U_i} of a space X is **good** when every nonempty finite intersection U_{i₀} ∩ ⋯ ∩ U_{iₖ} is *contractible* — it can be continuously shrunk to a point. For open regions of a surface that means one connected piece and no holes. Acconding to the Nerve Theorem, as long as we have a good cover, the nerve has the same cohomology as X.\n\nThe canvas currently has a bad cover of T². Any cover of S¹ by just 2 arcs has a pair-intersection in *two* components, one on each side of the circle. This intersection then isn't contractible.\n\nTransform this bad cover into a good one. A good cover of T² needs at least 3 sets along each S¹ factor in order to keep all intersections contractible. Use **+ Disc** in the topbar to add discs; drag bodies to position them and drag the small handles on each disc's right edge to resize.",
    scene: scenes.SCENE_BAD_COVER,
    unlocks: ["cover-status"],
    goal: P.isGoodCover,
    goalHint:
      "The 2×2 starting cover has too few sets along each S¹ factor. Click + Disc in the topbar a few times to add new discs, then drag them between the existing corner discs so each torus direction has ≥3 disc centres. Large discs wrap onto themselves through the torus and re-introduce multi-component overlaps — drag the resize handles to shrink discs as you fill out the grid. The goal fires the instant the topbar chip reads *good cover ✓*.",
  },
  {
    id: "cohomology",
    title: "Cohomology of the torus",
    prose:
      "S¹ has one independent loop and gave us H¹ = ℤ. The torus has two loops — two independent winding directions, each contributing a copy of ℤ to H¹. A single ring of discs can't see both; we need a full 2-D cover.\n\nThis 3×3 grid is the simplest *good* disc cover of the torus. Each axis needs ≥3 disc centres: two centres along one axis (half-period spacing) overlap both directly and via wraparound — the bad case from the previous chapter. Three centres per axis (⅓-period spacing) put the wraparound shifts out of overlap range, so every pair has a single connected intersection. Nerve: 9 vertices, 36 edges, 36 triangles, 9 tetrahedra.\n\nThe H¹ chip's class readout now has two coordinates — [a, b] ∈ ℤ². Use the 'set c¹ to' cycler on the C¹ card to step c¹ through g₁ and g₂; the class readout reads [1, 0] for g₁ and [0, 1] for g₂.\n\nHᵏ depends only on the topology of the underlying space, not on the (good) cover you chose. Two wildly different good covers of the torus give isomorphic cohomology. The cover is a calculation tool; H is the invariant.\n\nFor the torus:\n\n• H⁰(T²; ℤ) = ℤ — one connected component.\n• H¹(T²; ℤ) = ℤ² — two independent loop directions.\n• H²(T²; ℤ) = ℤ — one 2-dimensional fundamental class.\n\n",
    scene: scenes.SCENE_TORUS_H1,
    unlocks: ["cup-product"],
    goal: P.equivalentTorusCover,
    goalHint:
      "Click '+ Disc' in the topbar to add a disc somewhere on the canvas. The goal fires when the new cover still has H⁰ = ℤ, H¹ = ℤ², and H² = ℤ — the topology of the torus survives a change of cover. If the cohomology shifts when you add the disc, drag it to a new location until the ranks settle back to (1, 2, 1).",
  },
  {
    id: "cup-product",
    title: "The cup product",
    prose:
      "Cohomology has multiplication as well, giving it a ring structure. Given cocycles α ∈ Hᵖ and β ∈ Hᵍ, you can form a cocycle α ∪ β ∈ Hᵖ⁺ᵍ using the **cup product**. The cup product structure distinguishes spaces that have identical additive cohomology.\n\nTo compute (α ∪ β)(σ) for a (p+q)-simplex σ = {v₀, v₁, …, vₚ₊ᵧ}:\n\n• Take the **front face**, the first p+1 vertices, {v₀, …, vₚ}. Evaluate α on it.\n• Take the **back face**, the last q+1 vertices, {vₚ, …, vₚ₊ᵧ}. Evaluate β on it.\n• Multiply the two integers to give the value of α ∪ β on σ.\n\nNotice the front and back share the joint vertex vₚ, or the 'pivot'.\n\n(Showing that ∪ descends to a map Hᵖ ⊗ Hᵍ → Hᵖ⁺ᵍ results in a Leibniz rule for δ: δ(α∪β) = (δα)∪β ± α∪(δβ). When α and β are cocycles, both terms vanish.)\n\nFor our torus: H¹(T²; ℤ) = ℤ² has two generators α, β. Their cup α ∪ β lives in H²(T²; ℤ) = ℤ, and it equals the **fundamental class**, or the generator of H². Here, going once around in one direction and once in the other together cover the whole torus once.",
    scene: scenes.SCENE_TORUS_H1,
    unlocks: ["space-selector", "presets", "snapshots"],
    goal: P.usedCupProduct,
    goalHint:
      "In the topbar across the top of the screen, you'll now see a 'Cup product' checkbox. Tick it. In the Cohomology panel, a new 'Cup product' purple subsection appears. Change the 'basis H^p' dropdown to H¹, then pick a generator (g1 or g2) from the 'gen' dropdown. The result of cupping that basis generator with whatever's in your current cochain editor shows below. To see α ∪ β concretely: use ‹ › to set the current cochain to one generator, then use the cup picker to multiply with the *other* generator — the result is a 2-cochain whose nonzero entries live on triangles.",
  },
  {
    id: "cup-distinguishes",
    title: "Cup distinguishes spaces with identical additive cohomology",
    prose:
      "Additive cohomology — the ranks and torsion of each Hᵏ — is not a complete invariant. The torus T² has H⁰ = ℤ, H¹ = ℤ², H² = ℤ. The wedge S² ∨ S¹ ∨ S¹ has the same ranks with no torsion. No additive invariant tells them apart.\n\nCup product can. On T², g₁ ∪ g₂ generates H². On the wedge, every cup product of H¹ classes vanishes in H². Reduced cohomology of a wedge splits as a direct sum across the wedge factors, and the cup product respects that splitting — cross-factor cups land in zero, and same-factor cups of H¹(S¹) classes land in H²(S¹) = 0.\n\nThis canvas is a good cover of the wedge. Three discs cover the left S¹, three the right, four spherical caps cover S² (every triple of caps overlaps, no quadruple — the nerve is ∂Δ³ ≃ S²), and one basepoint disc joins the three factors. The H¹ chip reads ℤ²; the H² chip reads ℤ — exactly the additive cohomology of the torus.\n\nLoad g₁ into c¹ on the C¹ card. In the Cup product subsection set basis to H¹ and pick g₂. The cup result's H² class is [0]. Switch Space to torus via the topbar and repeat the same gestures — on T², g₁ ∪ g₂ is the fundamental class.",
    scene: scenes.SCENE_WEDGE2,
    unlocks: [],
    goal: P.sawCupVanishOnWedge,
    goalHint:
      "On the H¹ tab, click › on the C¹ card's 'set c¹ to' row to load g₁. In the Cup product subsection, set 'basis H^p' to H¹ and pick g₂ from the gen dropdown. The cup result's H² class reads [0]. The goal fires the instant a cup of two H¹ classes on wedge2 lands in B².",
  },
  {
    id: "other-rings",
    title: "Other coefficient rings",
    prose:
      "We picked ℤ as the coefficient ring back in the Cochains chapter. It's been there silently the entire time — every c(σ) you've typed has been an integer. That choice was not innocuous; cohomology *with* coefficients depends on the ring you choose.\n\nThis canvas is a good cover of the real projective plane RP² — the same 3×3 grid as the torus cover, but on Projective space, where opposite boundary edges identify with an antipodal flip. The nerve is the same shape, but the gluing is different.\n\nWith ℤ coefficients, the H² chip reads **ℤ/2** — a single Z/2 torsion summand, no free part. This is the surface's *first* topological subtlety: H²(RP²; ℤ) is finite cyclic of order 2. Rationally it would vanish (ℚ is a field of characteristic 0, so 2-torsion gets killed) and so would not appear at all in the ranks. The integer-cohomology answer is more informative than its rational shadow.\n\nA new 'Coefficients' picker has appeared in the Cohomology panel. Click it and choose **ℤ/2**. The cochain editor clears (the old integer values aren't meaningful mod 2) and every Hᵏ chip recomputes. Now the picture changes: H⁰, H¹, H² all read ℤ/2. The 2-torsion class in H²(ℤ) survives mod 2 — and a new class appears in H¹ that wasn't visible over the integers.",
    scene: scenes.SCENE_PROJECTIVE_RP2,
    unlocks: ["ring-picker"],
    goal: P.ringIsZ2,
    goalHint:
      "In the Cohomology panel's header you'll see a 'Coefficients' dropdown alongside the title. It currently shows ℤ. Click it and pick ℤ/2. The chip on every Hᵏ updates — H⁰, H¹, and H² all become ℤ/2 on RP².",
  },
  {
    id: "rp2-cup-square",
    title: "α ⌣ α ≠ 0 on RP²",
    prose:
      "Now that the ring is ℤ/2, RP² has a nontrivial H¹ class α. The cup product gives Hᵏ a ring structure for any coefficient ring, so we can ask: what is α ⌣ α ∈ H²(RP²; ℤ/2)?\n\nA priori it could be zero — squaring isn't always nontrivial. For RP² mod 2, though, α ⌣ α is the generator of H². This nonvanishing square is the seed of an entire family of higher operations (the Steenrod squares) that distinguish spaces invisible to additive cohomology alone.\n\nLoad α into c¹ via the › cycler on the C¹ card. Tick the **Cup product** checkbox in the topbar, set the cup basis to H¹ (the same H¹ generator α), and read off the result: cup α with α and check the result's H² class. It should be nonzero — α ⌣ α is the H² generator.",
    scene: scenes.SCENE_PROJECTIVE_RP2,
    unlocks: [],
    goal: P.sawCupSquareOnRP2,
    goalHint:
      "Stay on RP² with ℤ/2 coefficients. On the H¹ tab, click › in the 'set c¹ to' row to load α into the editor. Tick the 'Cup product' checkbox in the topbar. In the Cup product subsection of the Cohomology panel, set 'basis H^p' to H¹ — there's only one generator to pick. The cup result displays in C²; its δ should be 0 (it's a cocycle) and it should NOT be a coboundary — that's α ⌣ α, the H² generator. The goal fires when the cup result is a nonzero H² class.",
  },
];

export function cumulativeUnlocks(step: number): Set<Feature> {
  const set = new Set<Feature>();
  const last = Math.min(step, CHAPTERS.length - 1);
  for (let i = 0; i <= last; i++) {
    for (const f of CHAPTERS[i].unlocks) set.add(f);
  }
  return set;
}
