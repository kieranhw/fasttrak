import { RouteNode } from '@/lib/routing/model/RouteNode';

// Priority queue for node objects
export class PriorityQueue {
    private nodes: RouteNode[];

    constructor() {
        this.nodes = [];
    }

    private calculateEffectivePriority(node: RouteNode): number {
        if (!node.pkg || !node.pkg.date_added) return 0;

        // Ensure date_added is a Date object
        const dateAdded = node.pkg.date_added instanceof Date ?
            node.pkg.date_added :
            new Date(node.pkg.date_added);

        const daysOld = (new Date().getTime() - dateAdded.getTime()) / (1000 * 3600 * 24);
        const priorityMap = {
            MoreThan5Days: 4,
            MoreThan3Days: 4,
            Express: 2,
            Standard: 1
        };
        const agePriority = daysOld > 5 ? priorityMap.MoreThan5Days : daysOld > 3 ? priorityMap.MoreThan3Days : 0;
        const pkgPriorityValue = priorityMap[node.pkg.priority];
        return (agePriority + pkgPriorityValue);
    }



    enqueue(node: RouteNode): void {
        if (!node.pkg) return;
        node.pkg!.effective_priority = this.calculateEffectivePriority(node);
        this.nodes.push(node);
        this.nodes.sort((a, b) => (b.pkg?.effective_priority || 0) - (a.pkg?.effective_priority || 0)); // Sort in descending order of priority
    }

    dequeue(): RouteNode | undefined {
        return this.nodes.shift();
    }

    dequeueNode(node: RouteNode): RouteNode | undefined {
        const index = this.nodes.findIndex(n => n.pkg?.package_id === node.pkg?.package_id);
        if (index !== -1) {
            return this.nodes.splice(index, 1)[0];
        }
    }

    peek(index?: number): RouteNode | undefined {
        if (index) {
            return this.nodes[index] ?? undefined;
        } else {
            return this.nodes[0];
        }
    }

    peekSmallest(): RouteNode | undefined {
        return [...this.nodes].sort((a, b) => a.pkg!.volume - b.pkg!.volume)[0];
    }

    peekLightest(): RouteNode | undefined {
        return [...this.nodes].sort((a, b) => a.pkg!.weight - b.pkg!.weight)[0];
    }

    dequeueSmallest(): RouteNode | undefined {
        const sortedBySize = [...this.nodes].sort((a, b) => a.pkg!.volume - b.pkg!.volume);
        const smallest = sortedBySize.shift();
        if (smallest) {
            this.nodes = this.nodes.filter(node => node.pkg?.package_id !== smallest.pkg?.package_id);
        }
        return smallest;
    }

    dequeueLightest(): RouteNode | undefined {
        const sortedByWeight = [...this.nodes].sort((a, b) => a.pkg!.weight - b.pkg!.weight);
        const lightest = sortedByWeight.shift();
        if (lightest) {
            this.nodes = this.nodes.filter(node => node.pkg?.package_id !== lightest.pkg?.package_id);
        }
        return lightest;
    }

    getData(): RouteNode[] {
        return this.nodes;
    }

    isEmpty(): boolean {
        return this.nodes.length === 0;
    }
}