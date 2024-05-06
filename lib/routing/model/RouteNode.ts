import { Package } from "@/types/db/Package";
import { Graph } from "./Graph";
import { Location } from "@/types/Location";

export class RouteNode {
    constructor(
        public pkg: Package | null,
        public coordinates: Location,
        public isDepot: boolean = false  // Identifier to check if the node is a depot
    ) { }

    clone(): RouteNode {
        // Create a new Node instance with copied values
        return new RouteNode(this.pkg, { ...this.coordinates }, this.isDepot);
    }
}