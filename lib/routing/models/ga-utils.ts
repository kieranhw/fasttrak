import { Node } from '../models/graph';

export function selectRandomSegment(nodes: Node[]): Node[] {
    const start = Math.floor(Math.random() * (nodes.length - 2));
    const end = start + Math.floor(Math.random() * (nodes.length - start)) + 1; // Ensure at least one node is selected
    return nodes.slice(start, end);
}
