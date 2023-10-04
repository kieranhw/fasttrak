// Function to generate ID numbers
export function generateId(prefix?: string): string | null {
    if (prefix === "FT") {
        let trackingNumber = "FT";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for (let i = 0; i < 8; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            trackingNumber += characters[randomIndex];
        }

        return trackingNumber;
    } else {
        return null;
    }
}