export type GlossaryEntry = {
  term: string;
  symbol?: string;
  introducedIn: string;
  short: string;
  long: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "cohomology",
    introducedIn: "welcome",
    short: "The mathematics of obstructions: what global structure local data forces.",
    long:
      "Cohomology assigns to a space (and choice of coefficient ring) a sequence of abelian groups H⁰, H¹, H², … that are topological invariants. Each Hᵏ measures the failure of certain local-to-global gluing problems at dimension k.",
  },
  {
    term: "Čech cohomology",
    introducedIn: "welcome",
    short: "The version of cohomology built from an open cover and its nerve.",
    long:
      "Pick an open cover of your space. Build the nerve (a simplicial complex). Take cochains, the coboundary δ, and Hᵏ = ker δᵏ / im δᵏ⁻¹. For 'good' covers (every finite intersection is contractible) the answer is independent of the cover and matches singular cohomology.",
  },
  {
    term: "torus",
    symbol: "T²",
    introducedIn: "welcome",
    short: "A square with opposite edges glued; equivalently, a donut surface.",
    long:
      "The 2-torus T² = ℝ²/ℤ². Topologically, the surface of a donut. Famous for having H¹(T²; ℤ) = ℤ² — two independent 'loop directions' that aren't boundaries of anything two-dimensional.",
  },

  {
    term: "open cover",
    introducedIn: "covers-and-nerve",
    short: "A collection of patches whose union covers the whole space.",
    long:
      "A family {U_i} of open subsets of a space X such that ⋃ U_i = X. In this app, each U_i is a (possibly-wrapped) disk on the torus.",
  },
  {
    term: "nerve",
    introducedIn: "covers-and-nerve",
    short: "The abstract simplicial complex of finite intersections in a cover.",
    long:
      "Given an open cover {U_i}, the nerve has a k-simplex {i₀, …, iₖ} for every (k+1)-tuple of patches with non-empty common intersection. For a 'good' cover the nerve is homotopy-equivalent to the space — this is the Nerve Theorem.",
  },

  {
    term: "simplex",
    introducedIn: "simplices",
    short: "A vertex / edge / triangle / tetrahedron — and their higher analogues.",
    long:
      "A k-simplex is the convex hull of k+1 points in general position. Combinatorially, just an ordered tuple of distinct indices. In the nerve, the simplex {i₀, …, iₖ} records the fact that patches U_{i₀}, …, U_{iₖ} have non-empty common intersection.",
  },
  {
    term: "k-simplex",
    introducedIn: "simplices",
    short: "A simplex of dimension k (a vertex, edge, triangle, tetrahedron, …).",
    long:
      "By dimension: 0-simplex = vertex (1 patch), 1-simplex = edge (2 patches overlap), 2-simplex = triangle (3 patches share a point), 3-simplex = tetrahedron (4 patches share a point), and so on.",
  },
  {
    term: "vertex",
    introducedIn: "simplices",
    short: "A 0-simplex; one of the cover's patches.",
    long: "In the nerve of a cover {U_i}, the vertex set is exactly the index set {i}.",
  },
  {
    term: "edge",
    introducedIn: "simplices",
    short: "A 1-simplex; two patches whose intersection is non-empty.",
    long:
      "An edge {i,j} in the nerve means U_i ∩ U_j ≠ ∅. The edge is oriented from the lower-index endpoint to the higher-index endpoint by convention.",
  },
  {
    term: "triangle",
    introducedIn: "simplices",
    short: "A 2-simplex; three patches sharing a common point.",
    long: "A triangle {i,j,k} in the nerve means U_i ∩ U_j ∩ U_k ≠ ∅.",
  },
  {
    term: "Nerve Theorem",
    introducedIn: "simplices",
    short: "Good open covers have nerves with the same topology as the space.",
    long:
      "If every non-empty finite intersection ⋂ U_{i_α} is contractible, then the nerve N({U_i}) is homotopy equivalent to ⋃ U_i. So computing cohomology of the nerve gives cohomology of the space.",
  },

  {
    term: "orientation",
    introducedIn: "orientation",
    short: "A canonical choice of vertex order that fixes simplex signs.",
    long:
      "We write every simplex with indices in strictly increasing order: {i₀ < i₁ < … < iₖ}. That choice fixes signs in the boundary and coboundary operators. (More generally, an orientation is an equivalence class of orderings modulo even permutations.)",
  },
  {
    term: "boundary",
    symbol: "∂",
    introducedIn: "orientation",
    short: "Signed sum of a simplex's codimension-1 faces.",
    long:
      "For a k-simplex σ = [v₀, …, vₖ], ∂σ = Σⱼ (−1)ʲ [v₀, …, v̂ⱼ, …, vₖ] (v̂ⱼ means omit vⱼ). It's the discrete analogue of taking the boundary of a region. The crucial identity is ∂∂ = 0.",
  },
  {
    term: "∂∂ = 0",
    introducedIn: "orientation",
    short: "The boundary of a boundary is zero — the cornerstone identity.",
    long:
      "Applying ∂ twice gives 0 because each (k−2)-face appears twice in ∂∂σ with opposite signs and cancels. The dual fact δ∘δ = 0 is what makes Hᵏ well-defined.",
  },

  {
    term: "cochain",
    introducedIn: "cochains",
    short: "A function from k-simplices to a coefficient group (here ℤ).",
    long:
      "A k-cochain is just an assignment of an integer to every k-simplex. The set of all k-cochains is the abelian group Cᵏ, with pointwise addition.",
  },
  {
    term: "k-cochain",
    introducedIn: "cochains",
    short: "A cochain on k-simplices specifically.",
    long:
      "An element of Cᵏ. A 0-cochain assigns integers to vertices; a 1-cochain to edges; a 2-cochain to triangles.",
  },
  {
    term: "Cᵏ",
    introducedIn: "cochains",
    short: "The group of all k-cochains.",
    long:
      "Cᵏ = {functions {k-simplices} → ℤ}. An abelian group under pointwise addition. The cochain editor in the Cohomology panel is a UI for picking an element of Cᵏ.",
  },

  {
    term: "coboundary (operator)",
    symbol: "δ",
    introducedIn: "coboundary",
    short: "The 'discrete gradient' Cᵏ → Cᵏ⁺¹.",
    long:
      "(δc)(τ) = Σⱼ (−1)ʲ c(τ with j-th vertex removed). For 0-cochains: (δc)(edge i→j) = c(j) − c(i). Satisfies δ∘δ = 0, which makes Hᵏ well-defined.",
  },
  {
    term: "δ∘δ = 0",
    introducedIn: "coboundary",
    short: "The coboundary squared is zero; dual to ∂∂ = 0.",
    long:
      "Equivalent to: every coboundary is a cocycle. The single algebraic identity from which all cohomological reasoning flows.",
  },
  {
    term: "discrete gradient",
    introducedIn: "coboundary",
    short: "Intuition for δ on a 0-cochain — like ∇ in calculus.",
    long:
      "If c is a 0-cochain (a 'function' on vertices), δc is a 1-cochain whose value on an edge is the difference of c at the two endpoints. That's literally the discrete analogue of taking the gradient of a function on a manifold.",
  },

  {
    term: "cocycle",
    introducedIn: "cocycles",
    short: "A cochain c with δc = 0.",
    long:
      "Equivalently: an element of ker δᵏ ⊆ Cᵏ. For 1-cochains on a simplicial complex, cocycle = 'alternating sum around every triangle is zero' — the discrete analogue of a closed differential form.",
  },
  {
    term: "Zᵏ",
    introducedIn: "cocycles",
    short: "The group of k-cocycles, ker δᵏ.",
    long:
      "Zᵏ = ker(δᵏ : Cᵏ → Cᵏ⁺¹). A subgroup of Cᵏ. The 'Z' is for Zyklus (German: cycle).",
  },

  {
    term: "coboundary (noun)",
    introducedIn: "non-cocycles",
    short: "A cochain of the form δb — 'a trivial cocycle'.",
    long:
      "An element of im δᵏ⁻¹ ⊆ Cᵏ. By δ∘δ = 0 every coboundary is also a cocycle. Coboundaries are the 'gauge-trivial' cocycles; cohomology quotients them out.",
  },
  {
    term: "Bᵏ",
    introducedIn: "non-cocycles",
    short: "The group of k-coboundaries, im δᵏ⁻¹.",
    long:
      "Bᵏ = im(δᵏ⁻¹ : Cᵏ⁻¹ → Cᵏ). A subgroup of Zᵏ thanks to δ∘δ = 0. The 'B' is for boundary.",
  },
  {
    term: "non-cocycle",
    introducedIn: "non-cocycles",
    short: "A cochain c with δc ≠ 0.",
    long:
      "Fails the closure condition. Geometrically: the alternating signed sum doesn't cancel around at least one face. Visible as the yellow 'δc ≠ 0' box and red highlighted simplices.",
  },

  {
    term: "cohomology group",
    symbol: "Hᵏ",
    introducedIn: "cohomology",
    short: "Cocycles modulo coboundaries: Hᵏ = Zᵏ / Bᵏ.",
    long:
      "The k-th cohomology group of a space (with chosen coefficients). Depends only on the topology of the space, not on the cover used to compute it. For T² with ℤ coefficients: H⁰=ℤ, H¹=ℤ², H²=ℤ.",
  },
  {
    term: "fundamental class",
    introducedIn: "cup-product",
    short: "The canonical generator of Hⁿ for a closed orientable n-manifold.",
    long:
      "On an n-dimensional closed orientable manifold M, Hⁿ(M; ℤ) ≅ ℤ has a canonical generator — the fundamental class [M]. It represents 'M itself' as a top-dimensional class. For T², the fundamental class is the cup product of the two H¹ generators.",
  },

  {
    term: "representative",
    introducedIn: "generators",
    short: "A specific cocycle standing in for its cohomology class.",
    long:
      "Every cohomology class [c] ∈ Hᵏ contains many cocycles; any one of them is a representative. Two cocycles represent the same class iff they differ by a coboundary.",
  },
  {
    term: "free generator",
    introducedIn: "generators",
    short: "A generator of an abelian group that has no torsion relation.",
    long:
      "An element g of an abelian group A with no positive integer n satisfying n·g = 0. For free abelian groups like ℤⁿ, every element of a basis is a free generator.",
  },

  {
    term: "cup product",
    symbol: "∪",
    introducedIn: "cup-product",
    short: "Multiplication on cohomology: H^{p} ⊗ H^{q} → H^{p+q}.",
    long:
      "(α ∪ β)(σ) = α(front face of σ) · β(back face of σ), where σ is a (p+q)-simplex split at the pivot vertex v_{p}. Descends to a well-defined product on cohomology classes thanks to a Leibniz rule for δ. The algebraic shadow of geometric intersection.",
  },
  {
    term: "front face / back face",
    introducedIn: "cup-product",
    short: "How the cup product slices a simplex at the 'pivot' vertex.",
    long:
      "For a (p+q)-simplex σ = {v₀, …, v_{p+q}}, the front face is {v₀, …, v_{p}} and the back face is {v_{p}, …, v_{p+q}}. They share the pivot vertex v_{p}. Cup product takes the value of α on the front and β on the back and multiplies them.",
  },
];
