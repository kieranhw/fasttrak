// Function to generate tracking ID numbers
export function generateFT(): string | null {
    let trackingNumber = "FT";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        trackingNumber += characters[randomIndex];
    }

    return trackingNumber;
} 
