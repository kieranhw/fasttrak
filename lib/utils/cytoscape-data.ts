import cytoscape from "cytoscape";
import { Graph } from "@/lib/routing/model/Graph";
import { calculateDistance } from "@/lib/utils/calculate-distance";
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { calculateTravelTime } from "@/lib/utils/calculate-travel-time";

interface CyEdge {
    data: {
        source: string;
        target: string;
        color: string;
        label: string;
        routeName: string;
        minutes: number;
    };
}

export function displayGraph(graph: Graph, solution: VRPSolution) {
    const cyElement = document.getElementById('cy');
    if (!cyElement) return;

    // Determine the min and max longitude and latitude
    const minLng = Math.min(...graph.nodes.map(node => node.coordinates.lng));
    const maxLng = Math.max(...graph.nodes.map(node => node.coordinates.lng));
    const minLat = Math.min(...graph.nodes.map(node => node.coordinates.lat));
    const maxLat = Math.max(...graph.nodes.map(node => node.coordinates.lat));

    // Calculate the midpoints
    const midLng = (minLng + maxLng) / 2;
    const midLat = (minLat + maxLat) / 2;

    // Determine the visualization center
    const visCenterX = document.getElementById('cy')!.clientWidth / 2;
    const visCenterY = document.getElementById('cy')!.clientHeight / 2;

    // Count packages being delivered to the same address
    const packageCounts = countPackagesByAddress(graph);

    // Prepare nodes and edges data 
    const cyNodes = graph.nodes.map((node, index) => {
        // positions with rotate -45 degrees to view map from north orientation
        const x = visCenterX + (node.coordinates.lat - midLat) * 15000 * Math.cos(-45) - (node.coordinates.lng - midLng) * 15000 * Math.sin(-45);
        const y = visCenterY + (node.coordinates.lat - midLat) * 15000 * Math.sin(-45) + (node.coordinates.lng - midLng) * 15000 * Math.cos(-45);

        let label: string;
        if (node.isDepot) {
            label = 'Depot';
        } else if (node.pkg) {
            // Show the first line of the address
            label = node.pkg.recipient_address.split(',')[0];

            // Regular expression to match UK postcodes
            const postcodeRegex = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/i;
            const match = node.pkg.recipient_address.match(postcodeRegex);

            if (match) {
                // Add the postcode to the label
                label += `\n${match[0]}`;
            } else {
                // If no postcode is found, add the second line of the address
                const secondLine = node.pkg.recipient_address.split(',')[1]?.trim();
                if (secondLine) {
                    label += `\n${secondLine}`;
                }
            }

            const count = packageCounts[node.pkg.recipient_address];
            if (count > 1) {
                label += `\n${count} Packages`;
            } else if (count === 1) {
                label += `\n1 Package`;
            }
        } else {
            label = 'Unknown';
        }

        const pkgAddress = node.pkg ? node.pkg.recipient_address : null;

        return {
            data: {
                id: index.toString(),
                label,
                isDepot: node.isDepot ? 'true' : 'false',
                pkgAddress,
            },
            position: { x, y }
        };
    });

    const cyEdges: CyEdge[] = [];
    solution.routes.forEach((route, index) => {
        route.nodes.slice(0, -1).forEach((node, i) => {
            const nextNode = route.nodes[i + 1];
    
            // Get the indices of the current and next node in the graph.nodes array
            const sourceIndex = graph.nodes.indexOf(node);
            const targetIndex = graph.nodes.indexOf(nextNode);
    
            // Prevent creating an edge if source and target nodes are the same or have the same package address
            if (sourceIndex !== targetIndex && cyNodes[sourceIndex].data.pkgAddress !== cyNodes[targetIndex].data.pkgAddress) {
                const edgeCost = calculateDistance(node, nextNode, route.distanceMultiplier);
                const minutesToTraverse = calculateTravelTime(edgeCost, route.avgSpeed);
                const routeName = `${minutesToTraverse.toFixed(2)} mins`;
    
                cyEdges.push({
                    data: {
                        source: sourceIndex.toString(),
                        target: targetIndex.toString(),
                        color: ['red', 'green', 'blue', 'purple', 'pink', 'orange', 'cyan', 'yellow'][index % 8],
                        label: routeName,
                        routeName,
                        minutes: minutesToTraverse
                    }
                });
            }
        });
    });

    // Create a cytoscape instance
    const cy = cytoscape({
        container: document.getElementById('cy'),
        maxZoom: 1.5,
        minZoom: 0.15,
        elements: {
            nodes: cyNodes,
            edges: cyEdges,
        },
        layout: { name: 'preset' },
        autoungrabify: true,
        style: [
            {
                selector: 'node',
                style: {
                    'label': '',  // Initially, labels are empty
                    'font-size': '32px',
                    'text-wrap': 'wrap',
                }
            },
            {
                selector: 'edge',
                style: {
                    'line-color': 'data(color)',
                    'target-arrow-color': 'data(color)',
                    'target-arrow-shape': 'triangle',
                    'arrow-scale': 1.25,
                    'curve-style': 'bezier',
                    'control-point-distances': [20],
                    'control-point-weights': [0.5],
                    'label': '',
                    'font-size': '32px',
                    'text-background-color': 'data(color)',
                    'text-background-opacity': 1,
                    'text-background-padding': '5px',
                    'color': '#ffffff',
                    'text-rotation': 'autorotate',
                }
            },
            {
                selector: 'node:selected', // Style for selected node
                style: {
                    'label': 'data(label)',
                }
            },
            {
                selector: 'node[isDepot="true"]',  // Style for depot node
                style: {
                    'label': 'data(label)',  // Always show label for depot node
                    'font-size': '32px',
                    'z-compound-depth': 'auto'
                }
            },
        ]

    });


    // Handle mouseover for edge
    cy.on('mouseover', 'edge', function (evt) {
        const edge = evt.target;

        edge.style({
            'label': edge.data('routeName'),
            'text-opacity': 1,
            'line-color': 'grey',
            'target-arrow-color': 'grey',
            'text-background-color': 'grey',
            'z-compound-depth': 'top',
        });

        // Set text-opacity to 0 for all other edges
        cy.edges().difference(edge).style({ 'text-opacity': 0 });
    });

    // Handle mouseout for edge
    cy.on('mouseout', 'edge', function (evt) {
        const edge = evt.target;

        // Revert to original styles
        edge.style({
            'label': '',
            'text-opacity': 1,
            'line-color': edge.data('color'),
            'target-arrow-color': edge.data('color'),
            'text-background-color': edge.data('color'),
            'z-compound-depth': 'bottom',
        });

        // Revert all other edges to their original text-opacity
        cy.edges().difference(edge).style({ 'text-opacity': 1 });
    });
}


function countPackagesByAddress(graph: Graph): Record<string, number> {
    const addressCount: Record<string, number> = {};
    graph.nodes.forEach((node) => {
        if (!node.isDepot && node.pkg) {
            const address = node.pkg.recipient_address;
            addressCount[address] = (addressCount[address] || 0) + 1;
        }
    });
    return addressCount;
}
