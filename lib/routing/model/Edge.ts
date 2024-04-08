import { RouteNode } from "./RouteNode";

export class Edge {
    constructor(
        public node1: RouteNode,
        public node2: RouteNode,
        public cost: number
    ) { }
}