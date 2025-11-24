// Declaration file for the 'qrcode' module
// This provides minimal typings for the functions you use in the project.
// Adjust the exported members as needed based on your usage.

declare module 'qrcode' {
    interface QRCodeToDataURLOptions {
        /** Width of the generated QR code image in pixels */
        width?: number;
        /** Color of the QR code modules */
        color?: {
            dark?: string; // e.g., '#000000'
            light?: string; // e.g., '#FFFFFF'
        };
        /** Margin around the QR code */
        margin?: number;
        /** Error correction level */
        errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }

    /**
     * Generates a QR code and returns a data URL string.
     * @param text The text or URL to encode.
     * @param options Optional configuration for the QR code.
     */
    function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;

    /**
     * Generates a QR code and writes it to a file.
     * @param text The text or URL to encode.
     * @param path File path where the QR code image will be saved.
     * @param options Optional configuration for the QR code.
     */
    function toFile(path: string, text: string, options?: QRCodeToDataURLOptions): Promise<void>;

    // Export the functions as part of the module's default export
    export default {
        toDataURL,
        toFile,
    };
}
