import cytoscape from "cytoscape";
import { Graph, calculateDistance } from "./graph";
import { VRPSolution } from "./vrp";
import { estimateDuration } from "../create-schedules";

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

    // Prepare nodes and edges data for cytoscape
    const cyNodes = graph.nodes.map((node, index) => {

        // positions with rotate -45 degrees to view map from north orientation
        const x = visCenterX + (node.coordinates.lat - midLat) * 20000 * Math.cos(-45) - (node.coordinates.lng - midLng) * 20000 * Math.sin(-45);
        const y = visCenterY + (node.coordinates.lat - midLat) * 20000 * Math.sin(-45) + (node.coordinates.lng - midLng) * 20000 * Math.cos(-45);

        return {
            data: {
                id: index.toString(),
                label: node.isDepot ? 'Depot' : `${node.pkg?.recipient_address}`,
                isDepot: node.isDepot ? 'true' : 'false'
            },
            position: { x, y }
        };
    });

    const cyEdges: CyEdge[] = [];
    solution.routes.forEach((route, index) => {
        route.nodes.slice(0, -1).forEach((node, i) => {
            const nextNode = route.nodes[i + 1];
            const edgeCost = calculateDistance(node, nextNode); // Calculating the distance between the two nodes
            const minutesToTraverse = estimateDuration(edgeCost); // Estimating the minutes required to traverse the distance
            const routeName = `${minutesToTraverse.toFixed(2)} mins`;
            cyEdges.push({
                data: {
                    source: graph.nodes.indexOf(node).toString(),
                    target: graph.nodes.indexOf(nextNode).toString(),
                    color: ['red', 'green', 'blue'][index % 3],  // Different colors for different routes
                    label: routeName,
                    routeName,  // Add route attribute
                    minutes: minutesToTraverse  // Add minutes to traverse edge
                }
            });
        });
    });

    // Create a cytoscape instance
    const cy = cytoscape({
        container: document.getElementById('cy'),
        maxZoom: 1,
        minZoom: 0.4,
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
                    'font-size': '24px',
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
                    'font-size': '24px',
                    'text-background-color': 'data(color)',
                    'text-background-opacity': 1,
                    'text-background-padding': '5px',
                    'color': '#ffffff',
                    'text-rotation': 'autorotate',
                }
            },
            {
                selector: 'node:selected',
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
