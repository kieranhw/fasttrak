import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
import { Package } from "@/types/package";
import { Vehicle } from "@/types/vehicle";



export function SchedulePackages(vehiclesData: Vehicle[], packagesData: Package[], date: Date) {
    console.log("Scheduling packages...")
    // Initialize variables for tracking total volume and weight
    let totalVolume = 0;
    let totalWeight = 0;



    // Sort packages in order of priority: Redelivery -> date_added >= 3 days -> Express -> Standard -> Return -> date_aded(newest)
    //packages.sort((a, b) => {
    //    const priorityOrder = ["Redelivery", "Express", "Standard", "Return"];
    //    const aPriority = priorityOrder.indexOf(a.priority);
    //    const bPriority = priorityOrder.indexOf(b.priority);

    //   if (aPriority !== bPriority) {
    //        return aPriority - bPriority;
    //    }

    // Check if date_added is greater than or equal to 3 days
    /*
    const aDaysOld = differenceInDays(new Date(), a.date_added);
    const bDaysOld = differenceInDays(new Date(), b.date_added);
    

    if (aDaysOld >= 3 && bDaysOld < 3) {
        return -1;
    }
    if (bDaysOld >= 3 && aDaysOld < 3) {
        return 1;
    }
    */

    // Sort by date_added if priorities and days old are the same
    //   console.log("Packages Sorted")
    //    return b.date_added.getTime() - a.date_added.getTime();
    //});


    // Initialize an empty array to hold delivery schedules for each vehicle
    let deliverySchedules: DeliverySchedule[] = [];

    console.log("iterating vehicles")
    // Iterate over each vehicle to create a delivery schedule
    for (const vehicle of vehiclesData) {
        let schedule: DeliverySchedule = {
            schedule_id: undefined,
            vehicle_id: vehicle.vehicle_id,
            vehicle: vehicle,
            store_id: undefined,
            package_order: [],  // Initialize as empty; will populate later
            delivery_date: date,  // Placeholder for now, replace with date of schedule
            start_time: date,  // Placeholder, replace with start date/time of first delivery
            status: DeliveryStatus.Pending,
            num_packages: 0,
            estimated_duration_mins: 0,
            actual_duration_mins: 0,
            distance_miles: 0,
            load_weight: 0,
            load_volume: 0,
            created_at: new Date()
        };

        // Add the schedule to the deliverySchedules array
        deliverySchedules.push(schedule);
    }
    // Initialize a variable to keep track of the current vehicle index for round-robin assignment
    let currentScheduleIndex = 0;

    // Sort vehicles by their current load_weight in ascending order
    deliverySchedules.sort((a, b) => a.load_weight - b.load_weight);

    for (const packageItem of packagesData) {
        const currentSchedule = deliverySchedules[currentScheduleIndex];


        // Remove undefined packages
        if (!packageItem) {
            console.log(`Package is undefined. Skipping.`);
            continue;
        }

        // Remove packages that wont fit from scheduling
        if (!findSuitableVehicle(packageItem, deliverySchedules)) {
            console.log("vehicle cannot be found for " + packageItem.package_id)
            continue;
        }

        totalVolume += parseInt(packageItem.volume);
        totalWeight += parseInt(packageItem.weight);

        if (currentSchedule) {
            const newLoadWeight = currentSchedule.load_weight + parseInt(packageItem.weight);
            const newLoadVolume = currentSchedule.load_volume + parseInt(packageItem.volume);

            if (newLoadWeight <= currentSchedule.vehicle.max_load && newLoadVolume <= currentSchedule.vehicle.max_load) {
                if (checkEstimatedTime(packageItem, currentSchedule, 8)) {
                    // Add package to schedule, remove from queue and update info
                    console.log("Adding package " + packageItem.package_id + " to schedule " + currentScheduleIndex)
                    currentSchedule.package_order.push(packageItem);
                    currentSchedule.num_packages += 1;
                    currentSchedule.load_weight = newLoadWeight;
                    currentSchedule.load_volume = newLoadVolume;
                    currentSchedule.distance_miles = calculateTotalDistance(currentSchedule);
                    currentSchedule.estimated_duration_mins = calculateTotalTime(currentSchedule);
                } else {
                    // Try next schedule
                    console.log(packageItem.package_id + "xx")
                    findScheduleForPackage(packageItem, deliverySchedules);
                }
            } else {
                // Try next schedule
                findScheduleForPackage(packageItem, deliverySchedules);
            }
        }

        currentScheduleIndex = (currentScheduleIndex + 1) % vehiclesData.length;
    }


    // Return the delivery schedules
    return deliverySchedules;
}



function checkEstimatedTime(packageToAdd: Package, schedule: DeliverySchedule | undefined, maxHours: number): boolean {
    if (!schedule) {
        return false;
    }

    const newSchedule: DeliverySchedule = {
        ...schedule,
        package_order: [...(schedule.package_order || []), packageToAdd],
    };

    const totalJourneyTime = calculateTotalTime(newSchedule);

    return (totalJourneyTime / 60) <= maxHours;
}


interface Location {
    lat: number;
    lng: number;
}

function calculateDistance(location1: Location, location2: Location): number {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = toRadians(location2.lat - location1.lat);
    const dLng = toRadians(location2.lng - location1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(location1.lat)) * Math.cos(toRadians(location2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Number(distance.toFixed(2));
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}


function estimateTravelTime(location1: Location, location2: Location): number {
    // Calculate the estimated travel time and distance between two locations
    const distance = calculateDistance(location1, location2);

    // Average speed in mph
    const speed = 10;

    // Calculate the estimated travel time in minutes
    const time = (distance / speed) * 60;

    return time;
}




// Function to calculate the total time to deliver all packages in a route (DeliverySchedule)
function calculateTotalTime(schedule: DeliverySchedule): number {
    // Calculate the total time required for a route
    let depot: Location = { lat: 53.403782, lng: -2.971970 };

    let time = 0;
    // for all packages in delivery schedule, calculate time from depot to package, ..., to depot and return total time
    for (let i = 0; i < schedule.num_packages; i++) {
        const packageItem = schedule.package_order[i];
        let packageItemLocation = { lat: 0, lng: 0 };
        if (packageItem.recipient_address_lat && packageItem.recipient_address_lng) {
            packageItemLocation = { lat: packageItem.recipient_address_lat, lng: packageItem.recipient_address_lng }
        }

        if (packageItem) {
            if (schedule.num_packages == 1) {
                // If and only if one package
                // Calculate time from depot to packageItem[i] and back to depot
                time += estimateTravelTime(depot, packageItemLocation)
                time += estimateTravelTime(packageItemLocation, depot)
            } else if (i === 0) {
                // If first package
                // Calculate time from depot to packageItem[i]
                time += estimateTravelTime(depot, packageItemLocation);
            } else if (i === schedule.num_packages - 1) {
                // If last package
                // Calculate travel time from previous package to current package, and from current package (last package) back to depot
                const prevPackageItem = schedule.package_order[i - 1];
                const prevPackageItemLocation: Location = { lat: prevPackageItem.recipient_address_lat!, lng: prevPackageItem.recipient_address_lng! };

                time += estimateTravelTime(prevPackageItemLocation, packageItemLocation);
                time += estimateTravelTime(packageItemLocation, depot);
            } else {
                // If package, but not first or last package
                // Calculate travel time of packageItem[i-1] to packageItem[i]
                const prevPackageItem = schedule.package_order[i - 1];
                const prevPackageItemLocation: Location = { lat: prevPackageItem.recipient_address_lat!, lng: prevPackageItem.recipient_address_lng! };

                time += estimateTravelTime(prevPackageItemLocation, packageItemLocation);
            }
        }
    }

    return time;
}

function calculateTotalDistance(schedule: DeliverySchedule): number {
    // Calculate the total time required for a route
    let depot: Location = { lat: 53.403782, lng: -2.971970 };

    let distance = 0;
    // for all packages in delivery schedule, calculate time from depot to package, ..., to depot and return total time
    for (let i = 0; i < schedule.num_packages; i++) {
        const packageItem = schedule.package_order[i];
        let packageItemLocation = { lat: 0, lng: 0 };
        if (packageItem.recipient_address_lat && packageItem.recipient_address_lng) {
            packageItemLocation = { lat: packageItem.recipient_address_lat, lng: packageItem.recipient_address_lng }
        }

        if (packageItem) {
            if (schedule.num_packages == 1) {
                // If and only if one package
                // Calculate time from depot to packageItem[i] and back to depot
                distance += calculateDistance(depot, packageItemLocation)
                distance += calculateDistance(packageItemLocation, depot)
            } else if (i === 0) {
                // If first package
                // Calculate time from depot to packageItem[i]
                distance += calculateDistance(depot, packageItemLocation);
            } else if (i === schedule.num_packages - 1) {
                // If last package
                // Calculate travel time from previous package to current package, and from current package (last package) back to depot
                const prevPackageItem = schedule.package_order[i - 1];
                const prevPackageItemLocation: Location = { lat: prevPackageItem.recipient_address_lat!, lng: prevPackageItem.recipient_address_lng! };

                distance += calculateDistance(prevPackageItemLocation, packageItemLocation);
                distance += calculateDistance(packageItemLocation, depot);
            } else {
                // If package, but not first or last package
                // Calculate travel time of packageItem[i-1] to packageItem[i]
                const prevPackageItem = schedule.package_order[i - 1];
                const prevPackageItemLocation: Location = { lat: prevPackageItem.recipient_address_lat!, lng: prevPackageItem.recipient_address_lng! };

                distance += calculateDistance(prevPackageItemLocation, packageItemLocation);
            }
        }
    }

    return Number(distance.toFixed(2));
}    


function findSuitableVehicle(packageItem: Package, deliverySchedules: DeliverySchedule[]): boolean {
    for (const schedule of deliverySchedules) {
        if (schedule) {
            const newLoadWeight = schedule.load_weight + parseInt(packageItem.weight);
            const newLoadVolume = schedule.load_volume + parseInt(packageItem.volume);

            if (newLoadWeight <= schedule.vehicle.max_load && newLoadVolume <= schedule.vehicle.max_volume) {
                if (checkEstimatedTime(packageItem, schedule, 8)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Search for a schedule that can fit the package in round robin fashion
function findScheduleForPackage(packageItem: Package, deliverySchedules: DeliverySchedule[]): boolean {
    for (const schedule of deliverySchedules) {
        const newLoadWeight = schedule.load_weight + parseInt(packageItem.weight);
        const newLoadVolume = schedule.load_volume + parseInt(packageItem.volume);

        if (newLoadWeight <= schedule.vehicle.max_load && newLoadVolume <= schedule.vehicle.max_volume) {
            if (checkEstimatedTime(packageItem, schedule, 8)) {
                schedule.package_order.push(packageItem);
                schedule.num_packages += 1;
                schedule.load_weight = newLoadWeight;
                schedule.load_volume = newLoadVolume;
                schedule.distance_miles = calculateTotalDistance(schedule);
                schedule.estimated_duration_mins = calculateTotalTime(schedule);
                return true;
            } else {
                return false;
            }
        }

    }
    return false;
}


/*
// Fetch available vehicles for Date that are not unavailable for maintenance
let vehicles: Vehicle[] = vehiclesData;

// Fetch packages that have status pending
let packages: Package[] = packagesData;

const returnedSchedules: DeliverySchedule[] = SchedulePackages(vehicles, packages);

for (let i = 0; i < returnedSchedules.length; i++) {
    console.log("[]------[]")
    console.log("package order length:" + returnedSchedules[i].package_order.length)
    console.log("num packages: " + returnedSchedules[i].num_packages)
    console.log("package order:")
    for (let j = 0; j < returnedSchedules[i].package_order.length; j++) {
        console.log(returnedSchedules[i].package_order[j].package_id)
    }
}

*/

// types
