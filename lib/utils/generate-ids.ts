// Function to generate tracking ID numbers
export function generateFT(): string {
    let trackingNumber = "FT";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        trackingNumber += characters[randomIndex];
    }

    return trackingNumber;
} 

// Function to generate invite codes
export function generateIC(): string {
    let inviteCode = "IC";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        inviteCode += characters[randomIndex];
    }

    return inviteCode;
}