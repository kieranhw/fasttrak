import { CurrentState, Package, PackageStatus, PriorityType } from "@/types/db/Package"
import { Vehicle } from "@/types/db/Vehicle"
import { DeliverySchedule, DeliveryStatus } from "@/types/db/DeliverySchedule"
import { UUID } from "crypto"
import { faker } from '@faker-js/faker';
import { generateFT } from "@/lib/utils/generate-ids";
import { db } from "@/lib/db/db";
import { addressData as evenAddresses } from "./wide-liverpool-addresses-even";
import { addressData as randomAddresses } from "./wide-liverpool-addresses-random";

export const generatePackages = async (numPackages: number): Promise<Package[]> => {
    const packages: Package[] = [];
    const addresses: { address: string, lat: number, lng: number }[] = randomAddresses;

    //console.log("addresses:" + addresses.length);

    for (let i = 0; i < numPackages; i++) {
        const priorities: PriorityType[] = [PriorityType.Standard, PriorityType.Express];
        const randomNumber = faker.number.int({
            'min': 0,
            'max': priorities.length - 1
        });

        const priority = i < numPackages * 0.2 ? PriorityType.Express : PriorityType.Standard;

        // Select recipient and sender addresses which are different
        const [recipientAddress, senderAddress] = faker.helpers.shuffle(addresses).slice(0, 2);

        const { data: store, error} = await db.stores.fetch.forUser();
        if (!store) {
            console.error("User not atatched to store");
            return [] as Package[];
        } if (error) {
            console.error("Error fetching store: ", error);
            return [] as Package[];
        }

        packages.push({
            package_id: faker.string.uuid() as UUID,
            tracking_id: generateFT()!,
            store_id: store.store_id!,
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
            status: PackageStatus.Pending,
            current_state: CurrentState.Pending,
            delivery_attempts: 0,
            weight: faker.number.int({ min: 5, max: 20 }),
            volume: parseFloat(faker.number.float({ min: 0.1, max: 0.4 }).toPrecision(2)),
            fragile: false,
            priority: priority, // 20% chance of express
            delivery_notes: faker.lorem.words(10),
            date_added: faker.date.between({ from: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), to: new Date().getTime() }),
        });
    }

    return packages;
}