// /api/genetic-algorithm.ts
import { GeneticAlgorithm } from '@/lib/routing/algorithms/genetic-algorithm/genetic-algorithm';
import { VRPMetrics, hybridAlgorithm } from '@/lib/routing/algorithms/hybrid-algorithm';
import { Graph } from '@/lib/routing/model/Graph';
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { VRPSolution } from '@/lib/routing/model/VRPSolution';
import { PriorityQueue } from '@/lib/scheduling/priority-queue';
import { calculateEfficiencyScores } from '@/lib/utils/calculate-efficiency';
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

export async function POST(req: NextRequest, res: NextResponse) {
    if (req.method !== 'POST') {
        return;
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

        const graph = new Graph (packagesData, { lat: depot.lat, lng: depot.lng}, true);

        // Run hybrid algorithm with server settings
        const response = await hybridAlgorithm(graph, vehiclesData, profile, metrics, true);
        const vrpSolution = response.finalSolution;
        const scheduleReport = response.scheduleReport;

        return NextResponse.json({
            vrpSolution,
            scheduleReport
        });
    } catch (error) {
        console.error(error);
    }

    return NextResponse.json({
        error: 'An error occurred'
    });
};
