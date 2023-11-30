import { Package, PriorityType } from "@/types/package"
import { Vehicle } from "@/types/vehicle"
import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule"
import { UUID } from "crypto"
import { faker } from '@faker-js/faker';
import { generateFT } from "@/lib/generate-ids";
import { db } from "@/lib/db/db";
import { addressData } from "./liverpool-addresses";


export const generatePackages = async (numPackages: number): Promise<Package[]> => {
    const packages: Package[] = [];
    const addresses: { address: string, lat: number, lng: number }[] = addressData;

    for (let i = 0; i < numPackages; i++) {
        const priorities: PriorityType[] = ["Redelivery", "Express", "Standard", "Return"];
        const randomNumber = faker.number.int({
            'min': 0,
            'max': priorities.length - 1
        });

        // Ensure recipient and sender addresses are different
        const [recipientAddress, senderAddress] = faker.helpers.shuffle(addresses).slice(0, 2);

        const store = await db.stores.fetch.store.forUser();
        if (!store) {
            console.error("User not atatched to store");
            return [] as Package[];
        }

        packages.push({
            package_id: faker.string.uuid() as UUID,
            tracking_id: generateFT()!,
            store_id: store.store_id,
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
            weight: faker.number.int({ min: 5, max: 20 }),
            volume: parseFloat(faker.number.float({ min: 0.5, max: 2 }).toPrecision(2)),
            fragile: false,
            priority: priorities[randomNumber],
            delivery_notes: faker.lorem.words(10),
            date_added: faker.date.between({ from: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), to: new Date().getTime() }),
        });
    }

    return packages;
}