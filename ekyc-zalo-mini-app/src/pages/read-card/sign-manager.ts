/**
 * JWS (JSON Web Signature) implementation using Web Crypto API
 */

import * as jose from 'jose';

export enum SignManagerError {
  badParameter = 'badParameter',
  signatureError = 'signatureError'
}

// Convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to base64url string
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert base64url string to Uint8Array
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const base64Padded = base64 + padding;
  const binary = atob(base64Padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert PEM to binary data
async function convertPEMToBinary(pemKey: string): Promise<Uint8Array> {
  try {
    // Remove header, footer, and whitespace
    const base64 = pemKey
      .replace(/-----BEGIN (?:PRIVATE KEY|PUBLIC KEY|CERTIFICATE)-----/g, '')
      .replace(/-----END (?:PRIVATE KEY|PUBLIC KEY|CERTIFICATE)-----/g, '')
      .replace(/\s/g, '');

    // Convert base64 to binary
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  } catch (error) {
    console.error('Error converting PEM to binary:', error);
    throw new Error('Failed to convert PEM to binary');
  }
}

// Create JWE using jose library
async function createJWE(data: Uint8Array, publicKey: string): Promise<string | null> {
  try {
    console.log('Creating JWE with data:', new TextDecoder().decode(data));
    console.log('Public key:', publicKey);

    // Import certificate (use PEM string directly)
    const publicKeyObj = await jose.importX509(publicKey, 'RSA-OAEP-256');

    // Create JWE
    const jwe = await new jose.CompactEncrypt(data)
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(publicKeyObj);

    console.log('JWE created successfully');
    return jwe;
  } catch (error) {
    console.error('Error creating JWE:', error);
    return null;
  }
}

// Create JWS using jose library
async function createJWS(data: Uint8Array, privateKey: string): Promise<string | null> {
  try {
    // Import private key (use PEM string directly)
    const privateKeyObj = await jose.importPKCS8(privateKey, 'PS256');

    // Create JWS
    const jws = await new jose.CompactSign(data)
      .setProtectedHeader({ 
        alg: 'PS256',
        typ: 'JOSE',
        cty: 'JWE'
      })
      .sign(privateKeyObj);

    console.log('JWS created successfully');
    return jws;
  } catch (error) {
    console.error('Error creating JWS:', error);
    return null;
  }
}

// Verify JWS and convert to JWE
async function verifyJWSandConvertToJWE(jws: string, publicKey: string): Promise<string | null> {
  try {
    // Import certificate (use PEM string directly)
    const publicKeyObj = await jose.importX509(publicKey, 'PS256');

    // Verify JWS
    const { payload } = await jose.compactVerify(jws, publicKeyObj);
    const message = new TextDecoder().decode(payload);
    console.log('JWS verified successfully');
    return message;
  } catch (error) {
    console.error('Error verifying JWS:', error);
    return null;
  }
}

// Convert JWE to JSON object
async function convertJWEToJSONObject(jwe: string, privateKey: string): Promise<string | null> {
  try {
    // Import private key (use PEM string directly)
    const privateKeyObj = await jose.importPKCS8(privateKey, 'RSA-OAEP-256');

    // Decrypt JWE
    const { plaintext } = await jose.compactDecrypt(jwe, privateKeyObj);
    const message = new TextDecoder().decode(plaintext);
    console.log('JWE decrypted successfully');
    return message;
  } catch (error) {
    console.error('Error decrypting JWE:', error);
    return null;
  }
}

// Create JWS request body
export async function createJWSRequestBody(
  params: Record<string, any>,
  publicKey: string,
  privateKeyPem: string
): Promise<Uint8Array | null> {
  try {
    // First create JSON string from parameters
    const jsonString = JSON.stringify(params);
    const jsonData = new TextEncoder().encode(jsonString);
    console.log('jsonData', jsonString);

    // Create JWE from the JSON data
    const jwe = await createJWE(jsonData, publicKey);
    if (!jwe) {
      throw new Error('Failed to create JWE');
    }

    // Create JWS from the JWE data
    const jweData = new TextEncoder().encode(jwe);
    const jws = await createJWS(jweData, privateKeyPem);
    if (!jws) {
      throw new Error('Failed to create JWS');
    }

    // Create final JSON with jws field
    const finalJson = JSON.stringify({ jws });
    return new TextEncoder().encode(finalJson);
  } catch (error) {
    console.error('Error creating JWS request body:', error);
    return null;
  }
}

// Create JSON from JWS
export async function createJSONFromJWS(
  jws: string,
  privateKey: string,
  publicKey: string
): Promise<string | null> {
  try {
    // Verify JWS and get JWE
    const jwe = await verifyJWSandConvertToJWE(jws, publicKey);
    if (!jwe) {
      throw new Error('Failed to verify JWS');
    }

    // Convert JWE to JSON
    const json = await convertJWEToJSONObject(jwe, privateKey);
    if (!json) {
      throw new Error('Failed to convert JWE to JSON');
    }

    return json;
  } catch (error) {
    console.error('Error creating JSON from JWS:', error);
    return null;
  }
} 