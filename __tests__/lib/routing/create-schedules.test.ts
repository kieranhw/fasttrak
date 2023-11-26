import { createSchedules } from '@/lib/routing/create-schedules';
import { Vehicle } from '@/types/vehicle';
import { Package, PriorityType } from "@/types/package"
import { addressData } from "@/lib/data/liverpool-addresses";
import { supabase } from "@/pages/api/supabase-client";

import { UUID } from "crypto"
import { faker } from '@faker-js/faker';
import { generateFT } from "@/lib/generate-ids";

function generateMockPackages(numPackages: number, weight?: number, volume?: number): Package[] {

    const mockPackages: Package[] = [];
    const addresses: { address: string, lat: number, lng: number }[] = addressData;

    for (let i = 0; i < numPackages; i++) {
        const priorities: PriorityType[] = ["Redelivery", "Express", "Standard", "Return"];
        const randomNumber = faker.number.int({
            'min': 0,
            'max': priorities.length - 1
        });


        // Ensure recipient and sender addresses are different
        const [recipientAddress, senderAddress] = faker.helpers.shuffle(addresses).slice(0, 2);

        mockPackages.push({
            package_id: faker.string.uuid() as UUID,
            tracking_id: generateFT()!,
            store_id: faker.string.uuid() as UUID,
            recipient_name: faker.person.fullName(),
            recipient_address: recipientAddress.address,
            recipient_address_lat: recipientAddress.lat,
            recipient_address_lng: recipientAddress.lng,
            recipient_phone: "07" + faker.number.int({ min: 0o0, max: 999999999 }),
            sender_name: faker.person.fullName(),
            sender_address: senderAddress.address,
            sender_address_lat: senderAddress.lat,
            sender_address_lng: senderAddress.lng,
            sender_phone: "07" + faker.number.int({ min: 0o0, max: 999999999 }),
            status: "Pending",
            weight: weight ? weight : faker.number.int({ min: 5, max: 20 }),
            volume: volume ? volume : parseFloat(faker.number.float({ min: 0.5, max: 2 }).toPrecision(2)),
            fragile: false,
            priority: priorities[randomNumber],
            delivery_notes: faker.lorem.words(10),
            date_added: faker.date.between({ from: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), to: new Date().getTime() }),
        });
    }

    return mockPackages;
}

function generateMockVehicles(number: number, max_load?: number, max_volume?: number): Vehicle[] {
    const mockVehicles: Vehicle[] = [];
    for (let i = 0; i < number; i++) {
        mockVehicles.push({
            vehicle_id: faker.string.uuid() as UUID,
            registration: faker.vehicle.vrm(),
            store_id: 'store-uuid-' + i,
            manufacturer: faker.vehicle.manufacturer(),
            model: faker.vehicle.model(),
            manufacture_year: faker.date.past(10).getFullYear(),
            status: 'Available',
            max_load: max_load ? max_load : faker.number.int({ min: 100, max: 1000 }),
            max_volume: max_volume ? max_volume : faker.number.int({ min: 10, max: 100 }),
        });
    }
    return mockVehicles;
}

describe('createSchedules', () => {
    it('packages do not exceed a single vehicle capacity', async () => {
        // Set up mock data: One vehicle with specific load and volume limits
        const mockVehicles = generateMockVehicles(1, 400, 20);

        // Set up mock data: Ten packages, each with a specific weight and volume
        const mockPackages = generateMockPackages(10, 100, 5);

        const date = new Date();

        // Run the createSchedules function with the mock data
        const schedules = await createSchedules(mockVehicles, mockPackages, date);
        const schedule = schedules[0];

        // Assert that only one schedule is created due to vehicle capacity
        expect(schedules.length).toBe(1);

        // Assert that the number of packages in the schedule does not exceed the vehicle's capacity
        expect(schedule.num_packages).toBe(4);

        // Filter out null packages (depot markers) before calculating total weight and volume
        const filteredPackages = schedule.package_order.filter(pkg => pkg !== null);

        // Calculate the total weight and volume of the scheduled packages is less than vehicle limit
        const totalWeight = filteredPackages.reduce((acc, pkg) => acc + pkg.weight, 0);
        const totalVolume = filteredPackages.reduce((acc, pkg) => acc + pkg.volume, 0);

        expect(totalWeight).toBeLessThanOrEqual(mockVehicles[0].max_load);
        expect(totalVolume).toBeLessThanOrEqual(mockVehicles[0].max_volume);

        // Assert the number of unscheduled packages
        const unscheduledPackages = mockPackages.length - filteredPackages.length;
        expect(unscheduledPackages).toBe(6);
    });

    it('correctly allocates packages among multiple vehicles', async () => {
        // Set up mock data: Two vehicles with specific load and volume limits
        const mockVehicles = generateMockVehicles(2, 400, 20);

        // Set up mock data: Fifteen packages, each with a specific weight and volume
        const mockPackages = generateMockPackages(15, 100, 5);

        const date = new Date();

        // Run the createSchedules function with the mock data
        const schedules = await createSchedules(mockVehicles, mockPackages, date);

        // Assert that the number of schedules matches the number of vehicles
        expect(schedules.length).toBe(2);

        schedules.forEach(schedule => {
            // Filter out null packages (depot markers) before calculating total weight and volume
            const filteredPackages = schedule.package_order.filter(pkg => pkg !== null);

            // Calculate the total weight and volume of the scheduled packages
            const totalWeight = filteredPackages.reduce((acc, pkg) => acc + pkg.weight, 0);
            const totalVolume = filteredPackages.reduce((acc, pkg) => acc + pkg.volume, 0);

            // Assert that the total weight and volume of packages are within the vehicle's limits
            expect(totalWeight).toBeLessThanOrEqual(mockVehicles[0].max_load);
            expect(totalVolume).toBeLessThanOrEqual(mockVehicles[0].max_volume);

            // Assert that the number of packages in each schedule does not exceed the vehicle's capacity
            expect(filteredPackages.length).toBeLessThanOrEqual(4);
        });

        // Assert the number of unscheduled packages
        const totalScheduledPackages = schedules.reduce((acc, schedule) => acc + schedule.package_order.filter(pkg => pkg !== null).length, 0);
        const unscheduledPackages = mockPackages.length - totalScheduledPackages;
        expect(unscheduledPackages).toBe(7);
    });

    it('calculates schedule attributes correctly', async () => {
        // Assert on attributes like estimated_duration_mins, distance_miles, etc.
    });
});
