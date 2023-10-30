import cytoscape from "cytoscape";
import { Graph } from "./graph";
import { VRPSolution } from "./vrp";

interface CyEdge {
    data: {
        source: string;
        target: string;
        color: string;
        label: string;
    };
}

export function displayGraph(graph: Graph, solution: VRPSolution) {
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

        // positions without rotation
        //const x = visCenterX + (node.coordinates.lat - midLat) * 25000;  
        //const y = visCenterY + (node.coordinates.lng - midLng) * 25000; 

        // positions rotate -45 degrees to view map from north orientation
        const x = visCenterX + (node.coordinates.lat - midLat) * 25000 * Math.cos(-45) - (node.coordinates.lng - midLng) * 25000 * Math.sin(-45);
        const y = visCenterY + (node.coordinates.lat - midLat) * 25000 * Math.sin(-45) + (node.coordinates.lng - midLng) * 25000 * Math.cos(-45);

        return {
            data: {
                id: index.toString(),
                //label: node.isDepot ? 'Depot' : '',
                // TODO: find better way to display labels
                label: node.isDepot ? 'Depot' : `${node.pkg?.recipient_address}`
            },
            position: { x, y }
        };
    });

    const cyEdges: CyEdge[] = [];
    solution.routes.forEach((route, index) => {
        const routeName = `${route.vehicle.registration} ${index + 1}`;
        route.nodes.slice(0, -1).forEach((node, i) => {
            const nextNode = route.nodes[i + 1];
            cyEdges.push({
                data: {
                    source: graph.nodes.indexOf(node).toString(),
                    target: graph.nodes.indexOf(nextNode).toString(),
                    color: ['red', 'green', 'blue'][index % 3],  // Different colors for different routes
                    //label: routeName 
                    label: ''
                }
            });
        });
    });

    // Create a cytoscape instance
    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: {
            nodes: cyNodes,
            edges: cyEdges,
        },
        layout: { name: 'preset'},
        autoungrabify: true,
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'font-size': '24px',
                }
            },
            {
                selector: 'edge',
                style: {
                    'line-color': 'data(color)',
                    'target-arrow-color': 'data(color)',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'unbundled-bezier',
                    'control-point-distances': [20],
                    'control-point-weights': [0.5],
                    'label': 'data(label)',
                    'font-size': '16px',
                }
            }
        ]
    });
}