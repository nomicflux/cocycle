export function connectedComponents(nerve) {
    const n = nerve.byDim[0]?.length ?? 0;
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };
    const union = (a, b) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb)
            parent[ra] = rb;
    };
    for (const edge of nerve.byDim[1] ?? [])
        union(edge[0], edge[1]);
    const ids = new Map();
    const result = [];
    for (let i = 0; i < n; i++) {
        const r = find(i);
        if (!ids.has(r))
            ids.set(r, ids.size);
        result.push(ids.get(r));
    }
    return result;
}
