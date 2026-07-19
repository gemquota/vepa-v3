export class LineageTracker {
    constructor() {
        this.speciesMap = new Map(); // id → record
        this.nextId = 0;
    }

    createSpecies(dna, parentId = null) {
        const id = this.nextId++;

        const record = {
            id,
            parentId,
            dna: [...dna],
            birthTime: Date.now(),
            children: [],
            mutations: [],
            history: [],
            name: this.generateName(id)
        };

        this.speciesMap.set(id, record);

        if (parentId !== null) {
            const parent = this.speciesMap.get(parentId);
            if (parent) parent.children.push(id);
        }

        return record;
    }

    generateName(id) {
        const roots = ["Astra", "Virex", "Klyne", "Orin", "Zetha", "Myra", "Nylo", "Pyra"];
        const suffix = Math.floor(id / roots.length);
        return `${roots[id % roots.length]}-${suffix}`;
    }

    recordMutation(childId, parentId, deltaDNA) {
        const record = this.speciesMap.get(childId);
        if (record) {
            record.mutations.push({
                from: parentId,
                delta: deltaDNA,
                time: Date.now()
            });
        }
    }

    recordEvent(id, type, note) {
        const record = this.speciesMap.get(id);
        if (record) {
            record.history.push({
                time: Date.now(),
                type,
                note
            });
            if (record.history.length > 20) {
                record.history.shift();
            }
        }
    }

    getAncestry(id) {
        const chain = [];
        let current = this.speciesMap.get(id);
        while (current) {
            chain.push(current.name);
            current = this.speciesMap.get(current.parentId);
        }
        return chain.reverse();
    }
}
