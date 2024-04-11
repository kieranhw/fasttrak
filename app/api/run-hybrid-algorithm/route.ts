import { VRPMetrics, hybridAlgorithm } from '@/lib/routing/algorithms/hybrid-algorithm';
import { selectAlgorithm } from '@/lib/routing/algorithms/select-algorithm';
import { Graph } from '@/lib/routing/model/Graph';
import { Package } from '@/types/db/Package';
import { ScheduleProfile } from '@/types/db/ScheduleProfile';
import { Vehicle } from '@/types/db/Vehicle';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Maximum duration to run the serverless function
export const maxDuration = 300;

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
        
        const graph = new Graph(packagesData, { lat: depot.lat, lng: depot.lng }, true);

        // Choose between running the hybrid algorithm or the select algorithm
        if (profile.select_optimal) {
            // Run hybrid algorithm with server settings
            const response = await hybridAlgorithm(graph, vehiclesData, profile, metrics, true);
            const vrpSolution = response.finalSolution;
            const scheduleReport = response.scheduleReport;

            return NextResponse.json({ vrpSolution, scheduleReport, status: 200 });
        } else {
            // Run select algorithm with server settings
            const response = await selectAlgorithm(graph, vehiclesData, profile, metrics, true);
            const vrpSolution = response.finalSolution;
            const scheduleReport = response.scheduleReport;

            return NextResponse.json({ vrpSolution, scheduleReport, status: 200 });
        }
    } catch (error) {
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