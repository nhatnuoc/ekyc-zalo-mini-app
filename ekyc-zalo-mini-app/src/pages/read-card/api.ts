import axios, { AxiosRequestHeaders } from 'axios';
import { IDCardReaderResponsable, IDCardInformationResponse } from './models';
import { generate } from './totp-generator';
import { createJWSRequestBody } from './sign-manager';
import { base32DecodeToData } from './base32';

// API Endpoints
const API_ENDPOINTS = {
  registerDevice: '/eid/v3/registerDevice',
  resetDeviceSecret: '/eid/v3/updateDeviceSecret',
  initTransaction: '/eid/v3/initTransaction',
  readCard: '/eid/v3/read',
  verifyFace: '/eid/v3/verifyFace'
} as const;

interface InitTransactionOptions {
  duration?: number;
  additionalParams?: { [key: string]: any };
  additionalHeaderParams?: { [key: string]: string };
}

interface ReadCardOptions {
  additionalParams?: { [key: string]: any };
  additionalHeaderParams?: { [key: string]: string };
}

interface RegisterDeviceOptions {
  additionalParams?: { [key: string]: any };
  additionalHeaderParams?: { [key: string]: string };
}

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCiOMdedNfAhAdI
M1YmUd2hheu2vDMmFHjCfWHon8wv0doubYPY6/uhMcUERpPiFddWqe+Dfr/XwCsa
EaPOa27ghyUQ8HjdzAxcZ1yTWrgWttGruHlrHoXDPaov3QqvJTUrBclsH8p3ufPp
gmBC0HrFD0Pl4+vEpki4VvCDJFEGuBaSAqFe7JqUuaOVRG9mBBZWslkNi8XNkAQT
/Es+zReMf4EXIO2+wMo3aPIhe+sSZ3e3VqFL/10EJqNhurOT5ijUwReMlNb9wcxu
drfSKjLOgW1n+ZLjo16GdS2ye68B7ZaA0J3DPuDdRXJ5YuoW4UQd8o6CyezIHWpP
vH1tWFABAgMBAAECggEAB485yy8Kts/wPu8Vfqel+lbxSwyuHYIqtnV9UIfRzhCr
aCp2UG9+xF47Xh2j2o9F/6XfoXMQoY808vwLdB0Rh6kEkyuBlmRh1xSB/ePmXDic
wLHSBqnfdd+zxJM6YjsLpTuZzU4V80pZEXKf5b0tW22Arn/Whs1w6hYzEwloNTXf
4K974i+st1E5/0JjufTBTOTlBtwbphwN9ia/Xs2EY3D6kuJhYZ5lCWDocD21xYWd
NPM2CWqVXjJYEaqDTIWGwNGb2hkwNG5t/9MnN2On6BR7kgOWU4XxXHoLD3XoErwB
M3J8QAXGZwb+wRtkzRCVgojA6AQXfu9/QyPjyHW4oQKBgQDYMEC+LuNtjrNju8yF
LHMFbYbSfBQITE+kJn7iemezkwJw25NuKWl0pcxPe+NtpaHNFDmHnTVrlICTh90c
qrtge1vsqtgEoaZfdYqkUVvl1jJWBJ+VqQNO2Nxos/6fM0ARDC/9YXHoDWKC4WeS
PvYJ55MkMHseddpKIUGrZ1xO5QKBgQDAGGFxC9xWhG/CEm/JAFul+uyp9ncG6ro/
47Tw75M5+2K9wsP2R2c0uoXZtQHFvvi9CADaQkSYrzY3wCqgjDhsR+3psN1R+Pkw
bgMf3Rt6bMrYemPaGOe9qZ+Dpw/2GnLZfmCcJfKoRfY73YsxlL4/0Zf1va/qZnbp
pGh4IlvO7QKBgD87teQq0Mi9wYi9aG/XdXkz9Qhh1HYs4+qOe/SAew6SRFeAUhoZ
sMe2qxDgmr/6f139uWoKOJLT59u/FJSK962bx2JtAiwwn/ox5jBzv551TVnNlmPv
AJGyap2RcDtegTG7T9ocA3YtXBAOH/4tvkddXbNrHsflDsk5+vxIij5lAoGAFli/
vS7sCwSNG76ZUoDAKKbwMTWC00MrN5N90SmNrwkXi4vE0DmuP+wS9iigdCirNxJf
RwS+hiSb4hBw5Qxq4+3aN31jwc18761cn7BRKgTN9DEIvK55Bw9chyxAJxkck0Co
bIHdoMXCx2QWdUYge7weOXA/rr0MyFFf9dnJZGECgYEAuhJrRoxLdyouTd6X9+R1
8FWY0XGfsBp+PkN/nnPuK6IJR/IeI+cdiorfm45l4ByF0XEBCDz2xXQ6MVBNz3zF
MjEQ61dTFRfiTW2ZDqhMTtZH4R4T5NLWf+3ItjkAkOdStszplhHy0bUQIYgptYXd
5Sw/UvMv83CmlztVC5tGG9o=
-----END PRIVATE KEY-----
`
const publicKey = `-----BEGIN CERTIFICATE-----
MIIE8jCCA9qgAwIBAgIQVAESDxKv/JtHV15tvtt1UjANBgkqhkiG9w0BAQsFADAr
MQ0wCwYDVQQDDARJLUNBMQ0wCwYDVQQKDARJLUNBMQswCQYDVQQGEwJWTjAeFw0y
MzA2MDcwNjU1MDNaFw0yNjA2MDkwNjU1MDNaMIHlMQswCQYDVQQGEwJWTjESMBAG
A1UECAwJSMOgIE7hu5lpMRowGAYDVQQHDBFRdeG6rW4gSG/DoG5nIE1haTFCMEAG
A1UECgw5Q8OUTkcgVFkgQ1AgROG7ikNIIFbhu6QgVsOAIEPDlE5HIE5HSOG7hiBT
4buQIFFVQU5HIFRSVU5HMUIwQAYDVQQDDDlDw5RORyBUWSBDUCBE4buKQ0ggVuG7
pCBWw4AgQ8OUTkcgTkdI4buGIFPhu5AgUVVBTkcgVFJVTkcxHjAcBgoJkiaJk/Is
ZAEBDA5NU1Q6MDExMDE4ODA2NTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAJO6JDU+kNEUIiO6m75LOfgHkwGExYFv0tILHInS9CkK2k0FjmvU8VYJ0cQA
sGGabpHIwfh07llLfK3TUZlhnlFZYRrYvuexlLWQydjHYPqT+1c3iYaiXXcOqEjm
OupCj71m93ThFrYzzI2Zx07jccRptAAZrWMjI+30vJN7SDxhYsD1uQxYhUkx7psq
MqD4/nOyaWzZHLU94kTAw5lhAlVOMu3/6pXhIltX/097Wji1eyYqHFu8w7q3B5yW
gJYugEZfplaeLLtcTxok4VbQCb3cXTOSFiQYJ3nShlBd89AHxaVE+eqJaMuGj9z9
rdIoGr9LHU/P6KF+/SLwxpsYgnkCAwEAAaOCAVUwggFRMAwGA1UdEwEB/wQCMAAw
HwYDVR0jBBgwFoAUyCcJbMLE30fqGfJ3KXtnXEOxKSswgZUGCCsGAQUFBwEBBIGI
MIGFMDIGCCsGAQUFBzAChiZodHRwczovL3Jvb3RjYS5nb3Yudm4vY3J0L3ZucmNh
MjU2LnA3YjAuBggrBgEFBQcwAoYiaHR0cHM6Ly9yb290Y2EuZ292LnZuL2NydC9J
LUNBLnA3YjAfBggrBgEFBQcwAYYTaHR0cDovL29jc3AuaS1jYS52bjA0BgNVHSUE
LTArBggrBgEFBQcDAgYIKwYBBQUHAwQGCisGAQQBgjcKAwwGCSqGSIb3LwEBBTAj
BgNVHR8EHDAaMBigFqAUhhJodHRwOi8vY3JsLmktY2Eudm4wHQYDVR0OBBYEFE6G
FFM4HXne9mnFBZInWzSBkYNLMA4GA1UdDwEB/wQEAwIE8DANBgkqhkiG9w0BAQsF
AAOCAQEAH5ifoJzc8eZegzMPlXswoECq6PF3kLp70E7SlxaO6RJSP5Y324ftXnSW
0RlfeSr/A20Y79WDbA7Y3AslehM4kbMr77wd3zIij5VQ1sdCbOvcZXyeO0TJsqmQ
b46tVnayvpJYW1wbui6smCrTlNZu+c1lLQnVsSrAER76krZXaOZhiHD45csmN4dk
Y0T848QTx6QN0rubEW36Mk6/npaGU6qw6yF7UMvQO7mPeqdufVX9duUJav+WBJ/I
Y/EdqKp20cAT9vgNap7Bfgv5XN9PrE+Yt0C1BkxXnfJHA7L9hcoYrknsae/Fa2IP
99RyIXaHLJyzSTKLRUhEVqrycM0UXg==
-----END CERTIFICATE-----
`
const appId = 'com.pvcb'
const serverUrl = 'https://ekyc-sandbox.eidas.vn/ekyc'

// Mock DeviceManager
const DeviceManager = {
  encryptedDeviceId: '',
  secret: '',
  isReadersRegister: 'false',
  
  isRegisteredDevice(): boolean {
    return this.isReadersRegister === 'true';
  },
  
  getDeviceInformations(deviceId: string): Record<string, any> {
    return {
      deviceId: deviceId || this.encryptedDeviceId,
      // Add other device information as needed
    };
  }
};

function getEncryptedDeviceId(): string {
  return DeviceManager.encryptedDeviceId;
}

function getSecretKey(): string {
  return DeviceManager.secret;
}

export async function createJWSSignedRequestBody(params: Record<string, any>): Promise<string | null> {
  try {
    const jwsBody = await createJWSRequestBody(params, publicKey, privateKey);
    if (!jwsBody) return null;
    
    // Convert Uint8Array to string
    const jwsString = new TextDecoder().decode(jwsBody);
    return jwsString;
  } catch (error) {
    console.error('Error creating JWS request body:', error);
    return null;
  }
}

export async function generateTOTP(): Promise<number> {
  const secretKey = getSecretKey();
  const secret = base32DecodeToData(secretKey);
  
  if (!secret) {
    return 0;
  }

  const time = new Date();
  const totp = await generate(6, secret, 0, time);
  
  return parseInt(totp) || 0;
}

export async function registerDeviceToken(
  period: number = 30,
  deviceId: string = '',
  options: RegisterDeviceOptions = {}
): Promise<IDCardReaderResponsable> {
  if (DeviceManager.isRegisteredDevice()) {
    return {
      status: 200,
      data: DeviceManager.secret,
      signature: '',
      code: '',
      message: ''
    };
  }

  const {
    additionalParams = {},
    additionalHeaderParams = {}
  } = options;

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'appid': appId
  };

  if (deviceId) {
    headers['deviceId'] = deviceId;
  }

  // Add additional headers
  for (const [key, value] of Object.entries(additionalHeaderParams)) {
    if (key.toLowerCase() === 'appid' || key.toLowerCase() === 'content-type') continue;
    headers[key] = value;
  }

  // Prepare parameters
  const params = DeviceManager.getDeviceInformations(deviceId);
  params.period = period;

  // Add additional parameters
  for (const [key, value] of Object.entries(additionalParams)) {
    if (!(key in params)) {
      params[key] = value;
    }
  }

  const url = `${serverUrl}${API_ENDPOINTS.registerDevice}`;
  console.log('params', params);
  const body = await createJWSSignedRequestBody({
    "deviceId": "82gg22da-258c-4155-815c-0a1af073bf4b",
    "deviceName": "iPhone 14 Pro Max",
    "deviceOs": "iOS 16.2.9",
    "period": 6000,
    "secret": "HVR4CFHAFOWFGGFC"
  });
  if (!body) {
    throw new Error('Failed to create JWS request body');
  }

  const response = await axios.post<IDCardReaderResponsable>(url, body, { headers });

  console.debug('Response:', JSON.stringify(response.data, null, 2));

  if (response.data.status === 200) {
    DeviceManager.encryptedDeviceId = params.deviceId || '';
    DeviceManager.secret = response.data.data;
    DeviceManager.isReadersRegister = 'true';
  }

  return response.data;
}

export async function initTransaction(options: InitTransactionOptions = {}): Promise<IDCardReaderResponsable> {
  const {
    duration = 30,
    additionalParams = {},
    additionalHeaderParams = {}
  } = options;

  const url = `${serverUrl}${API_ENDPOINTS.initTransaction}`;

  const params: Record<string, any> = {
    deviceId: getEncryptedDeviceId(),
    duration,
    ...additionalParams,
  };

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'appid': appId,
  };

  for (const key in additionalHeaderParams) {
    if (key.toLowerCase() === 'appid' || key.toLowerCase() === 'content-type') continue;
    headers[key] = additionalHeaderParams[key];
  }

  const body = await createJWSSignedRequestBody(params);
  if (!body) {
    throw new Error('Failed to create JWS request body');
  }

  const response = await axios.post<IDCardReaderResponsable>(url, body, { headers });

  console.debug('Response:', JSON.stringify(response.data, null, 2));

  return response.data;
}

export async function readCard(
  sod: string,
  dg1DataB64: string,
  dg2DataB64: string,
  dg13DataB64: string,
  dg14DataB64: string,
  transactionId: string,
  backCardImage?: string,
  options: ReadCardOptions = {}
): Promise<IDCardInformationResponse> {
  const {
    additionalParams = {},
    additionalHeaderParams = {}
  } = options;

  const parameter: Record<string, any> = {
    sodData: sod,
    dg1DataB64: dg1DataB64,
    dg13DataB64: dg13DataB64,
    dg14DataB64: dg14DataB64
  };

  if (dg2DataB64) {
    parameter.dg2DataB64 = dg2DataB64;
  }

  if (backCardImage) {
    parameter.backCardImage = backCardImage;
  }

  parameter.totp = await generateTOTP();
  parameter.transactionId = transactionId;

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'appid': appId,
    'devicetype': 'ios',
    'deviceId': getEncryptedDeviceId()
  };

  // Add additional headers
  for (const [key, value] of Object.entries(additionalHeaderParams)) {
    if (key.toLowerCase() === 'appid' || key.toLowerCase() === 'content-type') continue;
    headers[key] = value;
  }

  // Add additional parameters
  for (const [key, value] of Object.entries(additionalParams)) {
    if (!(key in parameter)) {
      parameter[key] = value;
    }
  }

  const url = `${serverUrl}${API_ENDPOINTS.readCard}`;
  const body = await createJWSSignedRequestBody(parameter);
  if (!body) {
    throw new Error('Failed to create JWS request body');
  }

  const response = await axios.post<IDCardInformationResponse>(url, body, { headers });

  console.debug('Response:', JSON.stringify(response.data, null, 2));

  // Store request_id and card_id if available
  if (response.data.requestId) {
    // You might want to store these in a more appropriate way
    console.log('Request ID:', response.data.requestId);
    if (response.data.data?.citizenIdentify) {
      console.log('Card ID:', response.data.data.citizenIdentify);
    }
  }

  return response.data;
}
