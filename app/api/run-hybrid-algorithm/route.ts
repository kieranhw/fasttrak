import { VRPMetrics, hybridAlgorithm } from '@/lib/routing/algorithms/hybrid-algorithm';
import { Graph } from '@/lib/routing/model/Graph';
import { Package } from '@/types/db/Package';
import { ScheduleProfile } from '@/types/db/ScheduleProfile';
import { Vehicle } from '@/types/db/Vehicle';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Data = {
    packagesData: Package[];
    depot: { lat: number, lng: number }
    vehiclesData: Vehicle[];
    profile: ScheduleProfile;
    metrics: VRPMetrics;
}

/**
 * POST request handler to run the hybrid algorithm server side.
 * 
 * @param req the data from the request required to run the hybrid algorithm
 * @returns processed data from the hybrid algorithm or an error message
 */
export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({
            error: 'Method not allowed'
        });
    }

    try {
        // Destructure and parse expected data from the request body
        const body = await req.json()

        const {
            packagesData, // Should be serialized appropriately or constructed from data
            depot, // Should be a RouteNode or constructed from data
            vehiclesData, // RouteNode[]
            profile, // ScheduleProfile
            metrics // number
        } = body as Data;

        // If any of the body is missing, return an error
        if (!packagesData || !depot || !vehiclesData || !profile || !metrics) {
            return NextResponse.json({
                error: 'Missing data in the request body'
            });
        }

        const graph = new Graph(packagesData, { lat: depot.lat, lng: depot.lng }, true);

        // Run hybrid algorithm with server settings
        const response = await hybridAlgorithm(graph, vehiclesData, profile, metrics, true);
        const vrpSolution = response.finalSolution;
        const scheduleReport = response.scheduleReport;

        return NextResponse.json({
            vrpSolution,
            scheduleReport
        });
    } catch (error) {
        return NextResponse.json({
            error: 'An error occurred'
        });
    }
};
