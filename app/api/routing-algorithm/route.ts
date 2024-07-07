import { VRPMetrics, hybridAlgorithm } from '@/lib/routing/algorithms/hybrid-algorithm';
import { selectAlgorithm } from '@/lib/routing/algorithms/select-algorithm';
import { Graph } from '@/lib/routing/model/Graph';
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { Package } from '@/types/db/Package';
import { ScheduleProfile } from '@/types/db/ScheduleProfile';
import { Vehicle } from '@/types/db/Vehicle';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Maximum duration to run the serverless function - no longer used
export const maxDuration = 1;

/**
 * Executes a serverless function on Vercel to execute the hybrid algorithm.
 * 
 * @param req the data from the request required to run the hybrid algorithm
 * @returns processed data from the hybrid algorithm or an error message
 */
export async function POST(req: NextRequest) {
    if (req.method !== 'POST') return NextResponse.json({ error: 'Method not allowed', status: 405 });

    try {
        // Destructure and parse expected data from the request body
        const body = await req.json()

        const { packagesData, depot, vehiclesData, profile, metrics } = body as Data;

        // If any of the body is missing, return an error
        if (!packagesData || !depot || !vehiclesData || !profile || !metrics) return NextResponse.json({ error: 'Missing data in the request body', status: 400 });

        // Create array of route nodes to represent the delivery network
        const routeNodes: RouteNode[] = new Array();

        // Add depot node
        const depotNode = new RouteNode(null, { lat: depot.lat, lng: depot.lng }, true);
        routeNodes.push(depotNode);

        // Add package nodes
        for (const pkg of packagesData) {
            const pkgNode = new RouteNode(pkg, { lat: pkg.recipient_address_lat, lng: pkg.recipient_address_lng }, false);
            routeNodes.push(pkgNode);
        }
        
        // Choose between running the hybrid algorithm or the select algorithm
        if (profile.select_optimal) {
            // Run hybrid algorithm with server settings
            const response = await hybridAlgorithm(routeNodes, vehiclesData, profile, metrics, true);
            const vrpSolution = response.finalSolution;
            const scheduleReport = response.scheduleReport;

            return NextResponse.json({ vrpSolution, scheduleReport, status: 200 });
        } else {
            // Run select algorithm with server settings
            const response = await selectAlgorithm(routeNodes, vehiclesData, profile, metrics, true);
            const vrpSolution = response.finalSolution;
            const scheduleReport = response.scheduleReport;

            return NextResponse.json({ vrpSolution, scheduleReport, status: 200 });
        }
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'An error occurred', status: 500 });
    }
};

type Data = {
    packagesData: Package[];
    depot: { lat: number, lng: number }
    vehiclesData: Vehicle[];
    profile: ScheduleProfile;
    metrics: VRPMetrics;
}