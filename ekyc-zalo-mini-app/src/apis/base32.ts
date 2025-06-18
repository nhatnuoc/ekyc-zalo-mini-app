/**
 * Base32 encoding/decoding implementation
 * Based on RFC 4648
 * Original Swift implementation by Norio Nomura
 * Converted to TypeScript
 */

// MARK: - Constants

const alphabetEncodeTable: number[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.split('').map(c => c.charCodeAt(0));
const extendedHexAlphabetEncodeTable: number[] = '0123456789ABCDEFGHIJKLMNOPQRSTUV'.split('').map(c => c.charCodeAt(0));

const __: number = 255;
const alphabetDecodeTable: number[] = [
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x00 - 0x0F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x10 - 0x1F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x20 - 0x2F
    __,__,26,27, 28,29,30,31, __,__,__,__, __,__,__,__,  // 0x30 - 0x3F
    __, 0, 1, 2,  3, 4, 5, 6,  7, 8, 9,10, 11,12,13,14,  // 0x40 - 0x4F
    15,16,17,18, 19,20,21,22, 23,24,25,__, __,__,__,__,  // 0x50 - 0x5F
    __, 0, 1, 2,  3, 4, 5, 6,  7, 8, 9,10, 11,12,13,14,  // 0x60 - 0x6F
    15,16,17,18, 19,20,21,22, 23,24,25,__, __,__,__,__,  // 0x70 - 0x7F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x80 - 0x8F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x90 - 0x9F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xA0 - 0xAF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xB0 - 0xBF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xC0 - 0xCF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xD0 - 0xDF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xE0 - 0xEF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xF0 - 0xFF
];

const extendedHexAlphabetDecodeTable: number[] = [
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x00 - 0x0F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x10 - 0x1F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x20 - 0x2F
    0, 1, 2, 3,  4, 5, 6, 7,  8, 9,__,__, __,__,__,__,  // 0x30 - 0x3F
    __,10,11,12, 13,14,15,16, 17,18,19,20, 21,22,23,24,  // 0x40 - 0x4F
    25,26,27,28, 29,30,31,__, __,__,__,__, __,__,__,__,  // 0x50 - 0x5F
    __,10,11,12, 13,14,15,16, 17,18,19,20, 21,22,23,24,  // 0x60 - 0x6F
    25,26,27,28, 29,30,31,__, __,__,__,__, __,__,__,__,  // 0x70 - 0x7F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x80 - 0x8F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0x90 - 0x9F
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xA0 - 0xAF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xB0 - 0xBF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xC0 - 0xCF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xD0 - 0xDF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xE0 - 0xEF
    __,__,__,__, __,__,__,__, __,__,__,__, __,__,__,__,  // 0xF0 - 0xFF
];

// MARK: - Public Functions

export function base32Encode(data: Uint8Array): string {
    return base32encode(data, alphabetEncodeTable);
}

export function base32HexEncode(data: Uint8Array): string {
    return base32encode(data, extendedHexAlphabetEncodeTable);
}

export function base32DecodeToData(string: string): Uint8Array | null {
    const decoded = base32decode(string, alphabetDecodeTable);
    return decoded ? new Uint8Array(decoded) : null;
}

export function base32HexDecodeToData(string: string): Uint8Array | null {
    const decoded = base32decode(string, extendedHexAlphabetDecodeTable);
    return decoded ? new Uint8Array(decoded) : null;
}

// MARK: - Private Functions

function base32encode(data: Uint8Array, table: number[]): string {
    if (data.length === 0) {
        return '';
    }

    let length = data.length;
    let bytes = data;
    let result = '';

    // encode regular blocks
    while (length >= 5) {
        result += String.fromCharCode(table[bytes[0] >> 3]);
        result += String.fromCharCode(table[((bytes[0] & 0b00000111) << 2) | (bytes[1] >> 6)]);
        result += String.fromCharCode(table[((bytes[1] & 0b00111110) >> 1)]);
        result += String.fromCharCode(table[((bytes[1] & 0b00000001) << 4) | (bytes[2] >> 4)]);
        result += String.fromCharCode(table[((bytes[2] & 0b00001111) << 1) | (bytes[3] >> 7)]);
        result += String.fromCharCode(table[((bytes[3] & 0b01111100) >> 2)]);
        result += String.fromCharCode(table[((bytes[3] & 0b00000011) << 3) | (bytes[4] >> 5)]);
        result += String.fromCharCode(table[(bytes[4] & 0b00011111)]);
        length -= 5;
        bytes = bytes.slice(5);
    }

    // encode last block
    let byte0 = 0, byte1 = 0, byte2 = 0, byte3 = 0, byte4 = 0;
    switch (length) {
        case 4:
            byte3 = bytes[3];
            result += String.fromCharCode(table[((byte3 & 0b00000011) << 3) | (byte4 >> 5)]);
            result += String.fromCharCode(table[((byte3 & 0b01111100) >> 2)]);
            // fallthrough
        case 3:
            byte2 = bytes[2];
            result += String.fromCharCode(table[((byte2 & 0b00001111) << 1) | (byte3 >> 7)]);
            // fallthrough
        case 2:
            byte1 = bytes[1];
            result += String.fromCharCode(table[((byte1 & 0b00000001) << 4) | (byte2 >> 4)]);
            result += String.fromCharCode(table[((byte1 & 0b00111110) >> 1)]);
            // fallthrough
        case 1:
            byte0 = bytes[0];
            result += String.fromCharCode(table[((byte0 & 0b00000111) << 2) | (byte1 >> 6)]);
            result += String.fromCharCode(table[byte0 >> 3]);
            break;
    }

    // padding
    const pad = '=';
    switch (length) {
        case 0:
            break;
        case 1:
            result += pad.repeat(6);
            break;
        case 2:
            result += pad.repeat(4);
            break;
        case 3:
            result += pad.repeat(3);
            break;
        case 4:
            result += pad;
            break;
    }

    return result;
}

function base32decode(string: string, table: number[]): number[] | null {
    const length = string.length;
    if (length === 0) {
        return [];
    }

    // calc padding length
    function getLeastPaddingLength(str: string): number {
        if (str.endsWith('======')) return 6;
        if (str.endsWith('====')) return 4;
        if (str.endsWith('===')) return 3;
        if (str.endsWith('=')) return 1;
        return 0;
    }

    // validate string
    const leastPaddingLength = getLeastPaddingLength(string);
    const invalidCharIndex = string.split('').findIndex(char => {
        const code = char.charCodeAt(0);
        return code > 0xff || table[code] > 31;
    });

    if (invalidCharIndex !== -1) {
        const pos = invalidCharIndex;
        if (pos !== length - leastPaddingLength) {
            console.error('string contains some invalid characters.');
            return null;
        }
    }

    let remainEncodedLength = length - leastPaddingLength;
    let additionalBytes = 0;
    switch (remainEncodedLength % 8) {
        case 0: break;
        case 2: additionalBytes = 1; break;
        case 4: additionalBytes = 2; break;
        case 5: additionalBytes = 3; break;
        case 7: additionalBytes = 4; break;
        default:
            console.error('string length is invalid.');
            return null;
    }

    const dataSize = Math.floor(remainEncodedLength / 8) * 5 + additionalBytes;
    const result = new Array<number>(dataSize).fill(0);
    let decodedOffset = 0;

    // decode regular blocks
    let value0 = 0, value1 = 0, value2 = 0, value3 = 0, value4 = 0, value5 = 0, value6 = 0, value7 = 0;
    let encoded = string;
    while (remainEncodedLength >= 8) {
        value0 = table[encoded.charCodeAt(0)];
        value1 = table[encoded.charCodeAt(1)];
        value2 = table[encoded.charCodeAt(2)];
        value3 = table[encoded.charCodeAt(3)];
        value4 = table[encoded.charCodeAt(4)];
        value5 = table[encoded.charCodeAt(5)];
        value6 = table[encoded.charCodeAt(6)];
        value7 = table[encoded.charCodeAt(7)];

        result[decodedOffset] = (value0 << 3) | (value1 >> 2);
        result[decodedOffset + 1] = (value1 << 6) | (value2 << 1) | (value3 >> 4);
        result[decodedOffset + 2] = (value3 << 4) | (value4 >> 1);
        result[decodedOffset + 3] = (value4 << 7) | (value5 << 2) | (value6 >> 3);
        result[decodedOffset + 4] = (value6 << 5) | value7;

        remainEncodedLength -= 8;
        decodedOffset += 5;
        encoded = encoded.slice(8);
    }

    // decode last block
    value0 = value1 = value2 = value3 = value4 = value5 = value6 = value7 = 0;
    switch (remainEncodedLength) {
        case 7:
            value6 = table[encoded.charCodeAt(6)];
            value5 = table[encoded.charCodeAt(5)];
            // fallthrough
        case 5:
            value4 = table[encoded.charCodeAt(4)];
            // fallthrough
        case 4:
            value3 = table[encoded.charCodeAt(3)];
            value2 = table[encoded.charCodeAt(2)];
            // fallthrough
        case 2:
            value1 = table[encoded.charCodeAt(1)];
            value0 = table[encoded.charCodeAt(0)];
            break;
    }

    switch (remainEncodedLength) {
        case 7:
            result[decodedOffset + 3] = (value4 << 7) | (value5 << 2) | (value6 >> 3);
            // fallthrough
        case 5:
            result[decodedOffset + 2] = (value3 << 4) | (value4 >> 1);
            // fallthrough
        case 4:
            result[decodedOffset + 1] = (value1 << 6) | (value2 << 1) | (value3 >> 4);
            // fallthrough
        case 2:
            result[decodedOffset] = (value0 << 3) | (value1 >> 2);
            break;
    }

    return result;
} 