import { RouteNode } from '@/lib/routing/model/RouteNode';

export function selectRandomSegment(nodes: RouteNode[]): RouteNode[] {
    const start = Math.floor(Math.random() * (nodes.length - 2));
    const end = start + Math.floor(Math.random() * (nodes.length - start)) + 1;
    return nodes.slice(start, end);
}
