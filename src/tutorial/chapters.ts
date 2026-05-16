import type { Chapter, Feature } from "./types";
import * as scenes from "./scenes";
import * as P from "./predicates";

export const CHAPTERS: Chapter[] = [
  {
    id: "welcome",
    title: "Welcome",
    prose:
      "Imagine you and a colleague each survey a small region of a country. Each survey is internally consistent, but where two regions overlap, they sometimes disagree. Can you stitch the surveys into a single global picture?\n\n**Cohomology** is the mathematics of those disagreements: what global information is forced (or forbidden) by purely local data. Over ten short interactive chapters we'll build *Čech cohomology* from scratch.\n\nA few mechanical notes before we start:\n\n• The grey square is the canvas; everything you can manipulate lives there.\n• Drag a disk's body to move it. Drag the small handle on its right edge to resize. Shift-click to remove.\n• For the tutorial, the canvas wraps around at the edges (topologically, you're on a **torus**). A disk that touches the right edge spills back in on the left, and a disk near the top spills back at the bottom.\n\nClick Next when you're ready.",
    scene: scenes.SCENE_EMPTY,
    unlocks: ["drawing"],
  },
  {
    id: "covers-and-nerve",
    title: "Open covers and the nerve",
    prose:
      "To reason about a whole space using only local information, you first need a way of carving it into local pieces.\n\nAn **open cover** is a collection of patches (here, disks) whose union covers the entire space. Two patches can overlap, three can mutually overlap, and so on. The combinatorial fact 'patches A and B share area' is itself data — and the **nerve** of the cover is the abstract object built from nothing but those facts.\n\n• The nerve is *combinatorial*: a list of which subsets of patches have common intersection. Geometry can be represented with labels pointing to the overlaps, discarding the rest of the information.\n\n• Because (for our purposes) the nerve has the same topology as the original space. The cover is a visualization tool; the nerve is what we'll actually compute with.\n\nTry it: drag the two disks toward each other until their circles overlap.",
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
      "You just saw a single edge appear when two disks overlapped. That edge is a *1-dimensional piece of structure*, glued between the two endpoints.\n\nEvery (k+1)-fold intersection in the cover becomes a **k-simplex** in the nerve.\n\n• One disk → a **0-simplex** (a *vertex*).\n• Two overlapping disks → a **1-simplex** (an *edge*).\n• Three disks with a common point → a **2-simplex** (a *triangle*). And so on.\n\nThe **nerve** is the collection of all such simplices. Two ways to picture it: a list of index-tuples like {0,1,2} (the combinatorial view), or a geometric object built by gluing actual points, line segments, and triangles together along their shared sub-simplices (the geometric view). Both panels you're about to unlock are showing you the *same* nerve in those two ways.\n\nThe payoff is the **Nerve Theorem**: for a 'good' cover, the nerve and the original space have the same topology.\n\nPush the three disks together until you find a configuration where *all three* circles share a common point.",
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
      "Simplices aren't symmetric. The edge [0,1] (from disk 0 to disk 1) is a *different* object from the edge [1,0]. The algebra we're about to build runs on *signs*: positive and negative contributions can cancel each other out.\n\nThe simplest way to assign signs consistently is to fix an **orientation** — a canonical ordering of vertices. We use index order: a simplex is always written {i₀, i₁, …, iₖ} with i₀ < i₁ < … < iₖ. This gives every simplex a default sign convention.\n\nThis representation gives us the **boundary operator** ∂. For a 2-simplex [i,j,k] (with i<j<k) we define\n\n  ∂[i,j,k] = [j,k] − [i,k] + [i,j]\n\nThree faces, signs alternating, the sign on each face being (−1)^(position of the omitted vertex). The same pattern generalises to all dimensions.\n\nWhy alternating? This gives us the identity **∂∂ = 0**: 'the boundary of a boundary is zero'. The alternating signs are precisely what makes adjacent sub-faces cancel pairwise.\n\nCheck by hand on a triangle if you like: the boundary is three edges, and the boundary of *that* is six vertices, but each vertex appears exactly twice with opposite signs:\n\n  ∂[0,1,2] = [1,2] - [0,2] + [0, 1] \\\\ *Forward arrows from 1 -> 2 & 0 -> 1, then one going 'backward' from 2 -> 0* \n\n  ∂[1, 2] = [2] - [1]; ∂[0, 1] = [0] - [1]; ∂[0, 2] = [2] - [0] \\\\ *Each edge is the ending vertex minus the starting vertex* \n\n  ∂∂[0,1,2] = ([2] - [1]) - ([2] - [0]) + ([1] - [0]) = [2] - [1] - [2] + [0] + [1] - [0] = 0\n\nClick the 'arrows' checkbox so the orientations of edges become visible, then click an edge in the nerve to highlight it (either in the geometric view or in the set view).",
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
      "Next, we put *data* on the structure.\n\nA **k-cochain** with integer coefficients is a function: an integer assigned to each k-simplex. A 0-cochain assigns an integer to each vertex (i.e. to each disk). A 1-cochain assigns one to each edge. A 2-cochain to each triangle. More technically: a cochain is a map\n\n  c : {k-simplices} → ℤ.\n\nA few mental models for cochains, all useful:\n\n• as functions,\n• as 'labels' written on each simplex of a drawing,\n• as elements of an abelian group **Cᵏ** (the group of k-cochains, with pointwise addition).\n\nThe Cohomology panel is now open. Stay on the H⁰ tab and put any integers you like on the vertices.",
    scene: scenes.SCENE_FOUR_SQUARE,
    unlocks: ["cohomology", "cochain-editor"],
    goal: P.hasNonzeroVertexCochain,
    goalHint:
      "In the bottom-right 'Cohomology' panel you'll see three tabs: H⁰, H¹, H². Make sure H⁰ is selected (it's the default). Below the tabs is the cochain editor with one row per disk, each row showing the simplex like {0} and a number input. Type any nonzero integer (say 7) into one of those inputs.",
  },
  {
    id: "coboundary",
    title: "The coboundary δ",
    prose:
      "You just labelled vertices with integers — that's a 0-cochain. Next: every edge in the nerve corresponds to a pair of overlapping disks, with a 'left endpoint' (smaller index) and 'right endpoint' (larger index). So each edge inherits a natural number — the difference between its two endpoint labels.\n\nThat operation is the **coboundary**, written δ. Concretely: (δc)(edge from i to j, with i<j) = c(j) − c(i). Run δ on a 0-cochain and you get a 1-cochain. Run it on a 1-cochain and you get a 2-cochain.\n\n• **δ measures non-constancy.** If your vertex labels are all the same number, every difference is 0, so δc is zero everywhere. If your labels vary, δc records exactly *where* and *by how much* they disagree across overlaps.\n\n• **δ is the discrete gradient.** Same shape as ∇ in calculus: 'rate of change between neighbours'. Cohomology can be considered to be the answer to 'which labellings look like rates of change, and which don't?'\n\n• **δ ∘ δ = 0**, just like **∂ ∘ ∂ = 0**.\n\nTry it now: give two overlapping disks different integer labels and watch δc light up.",
    scene: scenes.SCENE_FOUR_SQUARE,
    unlocks: [],
    goal: P.sawDelta,
    goalHint:
      "Stay on the H⁰ tab. In the drawing panel, find two disks whose circles overlap (they're joined by an edge in the nerve panels). In the cochain editor, type 0 in one of those disks' rows and any nonzero integer (e.g. 1) on the other. A yellow 'δc ≠ 0' box appears right under the editor — it lists each edge where the endpoint labels disagree, with the difference as its value.",
  },
  {
    id: "cocycles",
    title: "Cocycles",
    prose:
      "You've now seen δ produce nonzero output. That is where our stitched-together maps disagree. But what we want is to be able to put together a global map from the local surveys: cochains where δ produces *nothing*.\n\nA k-cochain c is a **cocycle** if δc = 0. Equivalently, c lies in the *kernel* of δ. The group of k-cocycles is written **Zᵏ** (a subgroup of Cᵏ).\n\nFor 0-cochains, cocycle means δc = 0 on every edge, which forces c to be constant on each connected component of the nerve.\n\nFor 1-cochains, cocycles become richer. δc = 0 on an edge cochain means: 'around every triangle, the alternating sum of the three edge values cancels'. Geometrically, triangles are the discrete analogue of small loops, so a 1-cocycle is one whose 'integral around every loop' vanishes — exactly the discrete cousin of a *closed* 1-form in calculus.\n\Ccohomology is built from these cocycles. H¹ will end up being 'all 1-cocycles, modulo a notion of equivalence' — and that equivalence is *exactly* 'differs by something of the form δb'. So cocycles are the raw material; the next chapter explains these equivalences.\n\nSwitch to the H¹ tab and put nonzero integers on edges such that, even with those values entered, the 'δc ≠ 0' box *never appears* — the alternating sum around every triangle is zero.",
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
      "Some cocycles are 'trivial': they're equal to δb for some lower-degree cochain b. Such cochains are automatically cocycles because δ∘δ = 0.\n\n*Worked example.* Pick a 0-cochain b on the three vertices {0}, {1}, {2}, with b({0}) = 0, b({1}) = 3, b({2}) = 1. Then c = δb is the 1-cochain:\n\n  c({0,1}) = b({1}) − b({0}) = 3 − 0 = 3\n  c({0,2}) = b({2}) − b({0}) = 1 − 0 = 1\n  c({1,2}) = b({2}) − b({1}) = 1 − 3 = −2\n\nNow apply δ once more, evaluating δc on the triangle {0,1,2}:\n\n  δc({0,1,2}) = c({1,2}) − c({0,2}) + c({0,1}) = (−2) − (1) + (3) = 0\n\nThis isn't a coincidence of the specific numbers. For any 0-cochain b at all:\n\n  δ²b({i,j,k}) = (b(k) − b(j)) − (b(k) − b(i)) + (b(j) − b(i)) = 0\n\nEvery term appears twice with opposite signs — the same pairwise cancellation that made ∂∂ = 0 in the orientation chapter, just dualized to cochains.\n\nThese trivially-cocycle cochains are called **coboundaries**. The group of k-coboundaries is written **Bᵏ**. By construction Bᵏ ⊆ Zᵏ.\n\n('coboundary' is doing double duty. The *operator* δ is also called *the coboundary*. The *noun* coboundary refers to a specific cochain in the image of δ.)\n\nCoboundaries are the cocycles that *fail to carry global information*. If c = δb, then c was 'generated' by a simpler labelling b; it's the gradient of a function, in the discrete sense. The interesting cocycles are the ones that *aren't* coboundaries — those will be the actual content of H¹.\n\nThe opposite of a cocycle is a **non-cocycle**: a cochain with δc ≠ 0. Take the cocycle you built last chapter and break it by hand.",
    scene: scenes.SCENE_TORUS_RING,
    unlocks: ["h2"],
    goal: P.hasNonCocycle,
    goalHint:
      "Keep your cocycle from the previous step in the H¹ editor. Click any one edge's input field and change its value by 1 (e.g. 0 → 1, or 1 → 2). The yellow 'δc ≠ 0' box reappears, listing every triangle whose alternating sum no longer cancels — and those triangles turn red in the 'Nerve (geometric)' panel.",
  },
  {
    id: "cohomology",
    title: "Cohomology of the torus",
    prose:
      "This gives us the elements needed to talk about equivalences:\n\n• the *cocycles* Zᵏ (kernel of δ)\n• the *coboundaries* Bᵏ (image of δ)\nwith Bᵏ ⊆ Zᵏ thanks to δ∘δ = 0.\n\nThe **k-th cohomology group** is the quotient:\n\n• Hᵏ = Zᵏ / Bᵏ = (cocycles) / (coboundaries).\n\nTwo cocycles represent the *same class* in Hᵏ iff they differ by a coboundary. Cohomology measures: 'how many fundamentally distinct cocycles are there, after we declare gauge-equivalent ones to be the same?' It's the answer to 'which labellings carry genuine global information, not just gradients of simpler labellings?'\n\nThe theorem that makes this useful: Hᵏ depends only on the topology of the underlying space, *not* on the specific cover you chose. Two wildly different open covers of the torus give isomorphic cohomology. The cover is a calculation tool; H is the invariant.\n\nFor the torus the answers are famous:\n\n• H⁰(T²; ℤ) = ℤ — one connected component.\n• H¹(T²; ℤ) = ℤ² — two independent 'loop directions'.\n• H²(T²; ℤ) = ℤ — one 2-dimensional 'fundamental class'.\n\nThe Cohomology panel reads off Hᵏ at the top of each tab. Switch to H¹ and confirm it shows ℤ² (or ℤ ⊕ ℤ — same thing).",
    scene: scenes.SCENE_TORUS_H1,
    unlocks: ["cocycle-basis"],
    goal: P.onH1Tab,
    goalHint:
      "In the Cohomology panel, click the H¹ tab. At the top of that tab, look for 'H¹ = ℤ²' (or 'ℤ ⊕ ℤ', which means the same thing). That's the panel's way of reporting that the first cohomology of the torus with this cover has rank 2.",
  },
  {
    id: "generators",
    title: "Free generators of H¹",
    prose:
      "A group like ℤ² has *generators*: two elements you can combine (with integer coefficients) to reach every element. Each generator is **free** because it carries no torsion relation — there's no positive n with n·g = 0. H¹(T²; ℤ) is the simplest possible non-trivial example: rank 2, no torsion, two free generators.\n\nGeometrically those generators correspond to the two independent ways a loop can wind around a torus: 'around the donut hole' and 'through the donut hole'. They're cohomology classes that are *not* coboundaries of any 0-cochain — that's the algebraic statement of 'these loops can't be contracted'.\n\nWhat does a cohomology *class* look like in the editor? Pick any cocycle in the class and you have a **representative** — a concrete cochain standing in for its equivalence class. Different representatives differ by coboundaries, but they all live in the same Hᵏ class.\n\nUse the panel's basis navigator to step through one representative per free generator and watch the edge values change.",
    scene: scenes.SCENE_TORUS_H1,
    unlocks: ["cup-product"],
    goal: P.visitedSecondBasis,
    goalHint:
      "On the H¹ tab, look just below the H¹ = ℤ² header for a row reading 'representative 1 / 2' with ‹ and › buttons. Click ›. The cochain editor will fill with the specific 1-cocycle that represents the first generator. Click › again to land on 'representative 2 / 2' — the second generator. The non-zero edges change because the two representatives live in different cohomology classes.",
  },
  {
    id: "cup-product",
    title: "The cup product",
    prose:
      "Cohomology isn't just an abelian group — it has *multiplication*. Given cocycles α ∈ Hᵖ and β ∈ Hᵍ, you can form a cocycle α ∪ β ∈ Hᵖ⁺ᵍ. The operation is the **cup product**, and it's a genuinely deeper feature than addition: knowing the cup product structure distinguishes many spaces that have identical additive cohomology.\n\nThe definition. To compute (α ∪ β)(σ) for a (p+q)-simplex σ = {v₀, v₁, …, vₚ₊ᵧ}:\n\n• Take the **front face** — the first p+1 vertices, {v₀, …, vₚ}. Evaluate α on it.\n• Take the **back face** — the last q+1 vertices, {vₚ, …, vₚ₊ᵧ}. Evaluate β on it.\n• Multiply the two integers. That's the value of α ∪ β on σ.\n\nNotice the front and back share the joint vertex vₚ — the 'pivot' between α-territory and β-territory.\n\n(Showing that ∪ descends to a map Hᵖ ⊗ Hᵍ → Hᵖ⁺ᵍ comes down to a Leibniz rule for δ: δ(α∪β) = (δα)∪β ± α∪(δβ). When α and β are cocycles, both terms vanish.)\n\nFor our torus: H¹(T²; ℤ) = ℤ² has two generators α, β. Their cup α ∪ β lives in H²(T²; ℤ) = ℤ, and it equals the **fundamental class** — the generator of H². In words: 'going once around in one direction and once in the other together cover the whole torus once'. Cup product is the algebraic shadow of geometric intersection number.",
    scene: scenes.SCENE_TORUS_H1,
    unlocks: ["space-selector", "presets", "snapshots"],
    goal: P.usedCupProduct,
    goalHint:
      "In the topbar across the top of the screen, you'll now see a 'Cup product' checkbox. Tick it. In the Cohomology panel, a new 'Cup product' purple subsection appears. Change the 'basis H^p' dropdown to H¹, then pick a generator (g1 or g2) from the 'gen' dropdown. The result of cupping that basis generator with whatever's in your current cochain editor shows below. To see α ∪ β concretely: use ‹ › to set the current cochain to one generator, then use the cup picker to multiply with the *other* generator — the result is a 2-cochain whose nonzero entries live on triangles.",
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
