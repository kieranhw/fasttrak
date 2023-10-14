
enum DeliveryStatus {
    Pending = "Pending",
    Scheduled = "Scheduled",
    InProgress = "In Progress",
    Completed = "Completed",
    Cancelled = "Cancelled"
}

type DeliverySchedule = {
    schedule_id?: string;
    vehicle_id: string;
    vehicle: Vehicle; // Convert UUID to store Vehicle object
    store_id?: string;
    package_order: Package[];  // Convert array of UUIDs to array of Package objects
    delivery_date: Date;
    start_time: Date;
    status: DeliveryStatus;
    num_packages: number;
    estimated_duration_mins: number;
    actual_duration_mins: number;
    distance_miles: number;
    load_weight: number;
    load_volume: number;
    created_at: Date;
};

type Package = {
    package_id: string
    store_id: string
    tracking_id: string;
    recipient_name: string
    recipient_address: string
    recipient_phone: string
    sender_name: string
    sender_address: string
    sender_phone: string
    status: "Pending" | "In Transit" | "Delivered"
    weight: string
    volume: string
    fragile?: boolean
    priority: "Redelivery" | "Express" | "Standard" | "Return"
    delivery_notes: string
    date_added: Date
    date_modified: Date
    date_delivered: Date
    date_dispatched: Date
}


type Vehicle = {
    vehicle_id: string
    registration: string
    store_id: string
    manufacturer: string
    model: string
    manufacture_year: number
    status: "Available" | "Unavailable"
    max_load: number
    max_volume: number
}

// Mock data for vehicles
export const vehiclesData: Vehicle[] = [
    {
        vehicle_id: '610e0d12-694f-11ee-8c99-0242ac120002',
        registration: 'ABC-123',
        store_id: 'store1',
        manufacturer: 'Tesla',
        model: 'Model X',
        manufacture_year: 2020,
        status: 'Available',
        max_load: 100,
        max_volume: 100,
    },
    {
        vehicle_id: '610e103c-694f-11ee-8c99-0242ac120003',
        registration: 'XYZ-789',
        store_id: 'store2',
        manufacturer: 'Ford',
        model: 'F-150',
        manufacture_year: 2019,
        status: 'Available',
        max_load: 200,
        max_volume: 200,
    },
    {
        vehicle_id: '610e103c-694f-11ee-8c99-0242ac120004',
        registration: 'LMN-456',
        store_id: 'store3',
        manufacturer: 'Toyota',
        model: 'Hilux',
        manufacture_year: 2018,
        status: 'Available',
        max_load: 300,
        max_volume: 300,
    },
];

// Mock data for packages
export const packagesData: Package[] = [
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120005',
        store_id: '610e103c-694f-11ee-8c99-0242ac120002',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '20',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120006',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '20',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120007',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '20',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120008',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '50',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120009',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '25',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120010',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '150',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120011',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '110',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120012',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '100',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120013',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '30',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
    {
        package_id: '610e103c-694f-11ee-8c99-0242ac120014',
        store_id: '610e103c-694f-11ee-8c99-0242ac120004',
        tracking_id: 'T123',
        recipient_name: 'John Doe',
        recipient_address: '123 Main St',
        recipient_phone: '123-456-7890',
        sender_name: 'Jane Doe',
        sender_address: '456 Elm St',
        sender_phone: '987-654-3210',
        status: 'Pending',
        weight: '31',
        volume: '20',
        fragile: false,
        priority: 'Standard',
        delivery_notes: 'Leave at front door',
        date_added: new Date('2023-01-01'),
        date_modified: new Date(),
        date_delivered: new Date(),
        date_dispatched: new Date(),
    },
];
