import sanitizeHtml from "sanitize-html";

// Function to be called when to validate an input for float numbers
export const sanitizeFloat = (value: string) => {
    const sanitizedNumericInput = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        textFilter: (text) => {
            return text.replace(/[^0-9.]/g, "");
        },
    });

    // Remove more than one leading zero
    const regex = /^0+(?!\.|$)/;
    const leadingZeroRemoved = sanitizedNumericInput.replace(regex, "");

    // Prevent the input of more than one decimal point
    const regex2 = /\..*\./;
    const sanitizedValue = leadingZeroRemoved.replace(regex2, ".");

    return sanitizedValue;
}