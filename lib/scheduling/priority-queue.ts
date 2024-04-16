import { RouteNode } from '@/lib/routing/model/RouteNode';

/**
 * A priority queue implementation for the RouteNode class ordered based on the package's effective priority.
 */
export class PriorityQueue {
    private nodes: RouteNode[]; // The array of nodes in the queue

    constructor() {
        this.nodes = [];
    }

    /**
     * Calculate the effective priority of a package based on its age and priority.
     * @param node The RouteNode to calculate the effective priority for
     * @returns The effective priority of the package
     */
    private calculateEffectivePriority(node: RouteNode): number {
        if (!node.pkg || !node.pkg.date_added) return 0;

        // Ensure date_added is a Date object
        const dateAdded = node.pkg.date_added instanceof Date ?
            node.pkg.date_added :
            new Date(node.pkg.date_added);

        const daysOld = (new Date().getTime() - dateAdded.getTime()) / (1000 * 3600 * 24);
        const priorityMap = {
            MoreThan5Days: 4,
            MoreThan3Days: 2,
            Express: 2,
            Standard: 1
        };
        const agePriority = daysOld > 5 ? priorityMap.MoreThan5Days : daysOld > 3 ? priorityMap.MoreThan3Days : 0;
        const pkgPriorityValue = priorityMap[node.pkg.priority];
        return (agePriority + pkgPriorityValue);
    }

    /**
     * Enqueue a RouteNode into the priority queue.
     * @param node The RouteNode to enqueue
     */
    enqueue(node: RouteNode): void {
        if (!node.pkg) return;
        node.pkg!.effective_priority = this.calculateEffectivePriority(node);
        this.nodes.push(node);
        this.nodes.sort((a, b) => (b.pkg?.effective_priority || 0) - (a.pkg?.effective_priority || 0)); // Sort in descending order of priority
    }

    /**
     * Dequeue the RouteNode with the highest effective priority from the queue.
     * @returns The RouteNode with the highest effective priority
     */
    dequeue(): RouteNode | undefined {
        return this.nodes.shift();
    }

    /**
     * Dequeue a specific RouteNode from the queue.
     * @param node The RouteNode to dequeue
     * @returns The dequeued RouteNode
     */
    dequeueNode(node: RouteNode): RouteNode | undefined {
        const index = this.nodes.findIndex(n => n.pkg?.package_id === node.pkg?.package_id);
        if (index !== -1) {
            return this.nodes.splice(index, 1)[0];
        }
    }

    /**
     * Peek at the RouteNode at a specific index in the queue.
     * @param index The index to peek at
     * @returns The RouteNode at the specified index
     */
    peek(index?: number): RouteNode | undefined {
        if (index) {
            return this.nodes[index] ?? undefined;
        } else {
            return this.nodes[0];
        }
    }

    /**
     * Peek the smallest node from the queue, without removing it.
     * @returns The RouteNode[] data from the queue
     */
    peekSmallest(): RouteNode | undefined {
        return [...this.nodes].sort((a, b) => a.pkg!.volume - b.pkg!.volume)[0];
    }

    /**
     * Peek the lightest node from the queue, without removing it.
     * @returns The RouteNode[] data from the queue
     */
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