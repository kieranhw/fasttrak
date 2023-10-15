import { Package, PriorityType } from "@/types/package"
import { Vehicle } from "@/types/vehicle"
import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule"
import { UUID } from "crypto"
import { faker } from '@faker-js/faker';
import { generateId } from "@/lib/generate-id";

export const generatePackages = (numPackages: number): Package[] => {
    const packages: Package[] = [];
    for (let i = 0; i < numPackages; i++) {
        const priorities: PriorityType[] = ["Redelivery", "Express", "Standard", "Return"];
        const randomNumber = faker.number.int({
            'min': 0,
            'max': priorities.length - 1
        });

        packages.push({
            package_id: faker.string.uuid() as UUID,
            store_id: undefined,
            tracking_id: generateId("FT")!,
            recipient_name: faker.person.fullName(),
            recipient_address: faker.location.streetAddress(),
            recipient_phone: "07" + faker.number.int({ min: 0o0, max: 999999999}),
            sender_name: faker.person.fullName(),
            sender_address: faker.location.streetAddress(),
            sender_phone: "07" + faker.number.int({ min: 0o0, max: 999999999}),
            status: "Pending",
            weight: faker.number.int({ min: 5, max: 20 }).toString(),
            volume: faker.number.float({ min: 0.5, max: 2 }).toPrecision(2).toString(),
            fragile: false,
            priority: priorities[randomNumber],
            delivery_notes: faker.word.words(10),
            date_added: faker.date.between({from: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), to: new Date().getTime()}),
        });
    }
    return packages;
}