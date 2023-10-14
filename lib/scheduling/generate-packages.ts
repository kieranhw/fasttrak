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
        const randomNumber = faker.datatype.number({
            'min': 0,
            'max': priorities.length - 1
        });

        packages.push({
            package_id: faker.string.uuid() as UUID,
            store_id: undefined,
            tracking_id: generateId("FT")!,
            recipient_name: faker.person.fullName(),
            recipient_address: faker.location.streetAddress(),
            recipient_phone: faker.phone.number(),
            sender_name: faker.person.fullName(),
            sender_address: faker.location.streetAddress(),
            sender_phone: faker.phone.number(),
            status: "Pending",
            weight: faker.number.int({ min: 5, max: 10 }).toString(),
            volume: faker.number.int({ min: 5, max: 10 }).toString(),
            fragile: false,
            priority: priorities[randomNumber],
            delivery_notes: faker.word.words(10),
            date_added: faker.date.between(new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000, new Date().getTime())),
        });
    }
    return packages;
}