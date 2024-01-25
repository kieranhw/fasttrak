import { Node } from "@/lib/routing/model/graph";

// Priority queue for node objects
export class PriorityQueue {
    private nodes: Node[];

    constructor() {
        this.nodes = [];
    }

    private calculatePriority(node: Node): number {
        if (!node.pkg || !node.pkg.date_added) return 0;

        // Ensure date_added is a Date object
        const dateAdded = node.pkg.date_added instanceof Date ?
            node.pkg.date_added :
            new Date(node.pkg.date_added);

        const daysOld = (new Date().getTime() - dateAdded.getTime()) / (1000 * 3600 * 24);
        const priorityMap = {
            MoreThan5Days: 6,
            Express: 5,
            MoreThan3Days: 4,
            Redelivery: 3,
            Return: 2,
            Standard: 1
        };
        const agePriority = daysOld > 5 ? 6 : daysOld > 3 ? 4 : 0;
        const pkgPriorityValue = priorityMap[node.pkg.priority];
        return Math.max(agePriority, pkgPriorityValue);
    }



    enqueue(node: Node): void {
        if (!node.pkg) return;
        node.pkg!.effective_priority = this.calculatePriority(node);
        this.nodes.push(node);
        this.nodes.sort((a, b) => (b.pkg?.effective_priority || 0) - (a.pkg?.effective_priority || 0)); // Sort in descending order of priority
    }

    dequeue(): Node | undefined {
        return this.nodes.shift();
    }

    dequeueNode(node: Node): Node | undefined {
        const index = this.nodes.findIndex(n => n.pkg?.package_id === node.pkg?.package_id);
        if (index !== -1) {
            return this.nodes.splice(index, 1)[0];
        }
    }

    peek(index?: number): Node | undefined {
        if (index) {
            return this.nodes[index] ?? undefined;
        } else {
            return this.nodes[0];
        }
    }

    peekSmallest(): Node | undefined {
        return [...this.nodes].sort((a, b) => a.pkg!.volume - b.pkg!.volume)[0];
    }

    peekLightest(): Node | undefined {
        return [...this.nodes].sort((a, b) => a.pkg!.weight - b.pkg!.weight)[0];
    }

    dequeueSmallest(): Node | undefined {
        const sortedBySize = [...this.nodes].sort((a, b) => a.pkg!.volume - b.pkg!.volume);
        const smallest = sortedBySize.shift();
        if (smallest) {
            this.nodes = this.nodes.filter(node => node.pkg?.package_id !== smallest.pkg?.package_id);
        }
        return smallest;
    }

    dequeueLightest(): Node | undefined {
        const sortedByWeight = [...this.nodes].sort((a, b) => a.pkg!.weight - b.pkg!.weight);
        const lightest = sortedByWeight.shift();
        if (lightest) {
            this.nodes = this.nodes.filter(node => node.pkg?.package_id !== lightest.pkg?.package_id);
        }
        return lightest;
    }

    getData(): Node[] {
        return this.nodes;
    }

    isEmpty(): boolean {
        return this.nodes.length === 0;
    }
}