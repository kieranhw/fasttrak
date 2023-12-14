import { generateFT } from '@/lib/utils/generate-ids';

describe('generateFT', () => {
    it('generates a tracking ID starting with FT followed by 8 uppercase letters', () => {
        const id = generateFT();
        expect(id).toMatch(/^FT[A-Z]{8}$/);
    });

    it('ensures the generated tracking ID has a length of 10 characters', () => {
        const id = generateFT();
        expect(id).toHaveLength(10);
    });

    it('consistently generates valid tracking IDs on multiple invocations', () => {
        for (let i = 0; i < 100; i++) {
            const id = generateFT();
            expect(id).toMatch(/^FT[A-Z]{8}$/);
            expect(id).toHaveLength(10);
        }
    });
});
