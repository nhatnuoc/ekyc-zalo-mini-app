/**
 * TOTP Generator
 * Based on RFC 6238
 */

// Convert number to bytes
function intToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = num & 0xff;
    num = num >>> 8;
  }
  return bytes;
}

// Convert bytes to number
function bytesToInt(bytes: Uint8Array): number {
  let num = 0;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8) | bytes[i];
  }
  return num;
}

// Generate HMAC-SHA1
async function hmacSHA1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    message
  );

  return new Uint8Array(signature);
}

// Generate TOTP
export async function generate(
  digits: number = 6,
  secret: Uint8Array,
  timeStep: number = 30,
  time: Date = new Date()
): Promise<string> {
  // Calculate counter
  const counter = Math.floor(time.getTime() / 1000 / timeStep);
  const counterBytes = intToBytes(counter);

  // Generate HMAC
  const hmac = await hmacSHA1(secret, counterBytes);

  // Get offset
  const offset = hmac[hmac.length - 1] & 0xf;

  // Get binary code
  const binary = ((hmac[offset] & 0x7f) << 24) |
                ((hmac[offset + 1] & 0xff) << 16) |
                ((hmac[offset + 2] & 0xff) << 8) |
                (hmac[offset + 3] & 0xff);

  // Generate TOTP
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

export enum OTPDigits {
  six = 6,
  seven = 7,
  eight = 8
}

/**
 * Generates a range of TOTP tokens to a specific degree.
 * @param degree Number of codes to generate in both forward and backward direction
 * @param digits Number of digits to include in the password
 * @param secret Secret key as Buffer
 * @param date Date to generate the TOTP for
 * @returns Array of TOTP codes
 */
// export function generateRange(
//   degree: number,
//   digits: OTPDigits = OTPDigits.six,
//   secret: Buffer,
//   date: Date = new Date()
// ): string[] {
//   const res: string[] = [
//     generate(digits, secret, 0, date)
//   ];

//   for (let i = 1; i <= degree; i++) {
//     res.push(generate(digits, secret, i, date));
//     res.push(generate(digits, secret, -1 * i, date));
//   }

//   return res;
// }

/**
 * Helper function to convert string to Buffer
 * @param str String to convert
 * @returns Buffer containing the string data
 */
// export function stringToBuffer(str: string): Buffer {
//   return Buffer.from(str);
// }

// /**
//  * Helper function to convert Buffer to string
//  * @param buffer Buffer to convert
//  * @returns String representation of the buffer
//  */
// export function bufferToString(buffer: Buffer): string {
//   return buffer.toString();
// } 