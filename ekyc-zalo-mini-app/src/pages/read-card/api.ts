import axios from 'axios';
import { IDCardReaderResponsable, IDCardInformationResponse } from './models';
import { appId, createJWSSignedRequestBody, DeviceManager, ekycUrl, generateTOTP, getEncryptedDeviceId } from '@/apis';

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

  const url = `${ekycUrl}${API_ENDPOINTS.registerDevice}`;
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

  const url = `${ekycUrl}${API_ENDPOINTS.initTransaction}`;

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

  const url = `${ekycUrl}${API_ENDPOINTS.readCard}`;
  const body = await createJWSSignedRequestBody(parameter);
  if (!body) {
    throw new Error('Failed to create JWS request body');
  }

  const response = await axios.post<IDCardInformationResponse>(url, body, { headers });

  console.debug('Response:', JSON.stringify(response.data, null, 2));

  return response.data;
}
