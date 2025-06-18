import { appId, createJWSSignedRequestBody, DeviceManager, faceUrl, getEncryptedDeviceId } from "@/apis";
import { InitTransactionResponsable, LivenessResult, RegisterDeviceResponsable } from "./models";
import axios from "axios";

const API_ENDPOINTS = {
    registerDevice: '/eid/v3/registerDevice',
    resetDeviceSecret: '/eid/v3/updateDeviceSecret',
    initTransaction: '/eid/v3/initTransaction',
    verifyFace: '/eid/v3/verifyFace'
} as const;

interface InitTransactionOptions {
    duration?: number;
    withToken?: boolean;
    clientTransactionId?: string;
    additionalParams?: { [key: string]: any };
    additionalHeaderParams?: { [key: string]: string };
}

interface RegisterDeviceOptions {
    additionalParams?: { [key: string]: any };
    additionalHeaderParams?: { [key: string]: string };
  }
  
  export async function registerDeviceTokenApi(
    period: number = 30,
    deviceId: string = '',
    options: RegisterDeviceOptions = {}
  ): Promise<RegisterDeviceResponsable> {
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
  
    const url = `${faceUrl}${API_ENDPOINTS.registerDevice}`;
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
  
    const response = await axios.post<RegisterDeviceResponsable>(url, body, { headers });
  
    console.debug('Response:', JSON.stringify(response.data, null, 2));
  
    if (response.data.status === 200) {
      DeviceManager.encryptedDeviceId = params.deviceId || '';
      DeviceManager.secret = response.data.data;
      DeviceManager.isReadersRegister = 'true';
    }
  
    return response.data;
}

export async function initTransactionApi(options: InitTransactionOptions = {}): Promise<InitTransactionResponsable> {
  const {
    duration = 30,
    withToken, clientTransactionId,
    additionalParams = {},
    additionalHeaderParams = {}
  } = options;

  const url = `${faceUrl}${API_ENDPOINTS.initTransaction}`;

  const params: Record<string, any> = {
    deviceId: getEncryptedDeviceId(),
    duration,
    ...additionalParams,
    withToken,
    clientTransactionId
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

  const response = await axios.post<InitTransactionResponsable>(url, body, { headers });

  console.debug('Response:', JSON.stringify(response.data, null, 2));

  return response.data;
}

export async function verifyFaceApi(params: { transaction_id: string }): Promise<LivenessResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'appid': appId,
  };
  const body = await createJWSSignedRequestBody(params)
  if (!body) {
    throw new Error('Failed to create JWS request body');
  }
  const url = `${faceUrl}${API_ENDPOINTS.verifyFace}`;
  const response = await axios.post<LivenessResult>(url, body, { headers });
  console.debug('Response:', JSON.stringify(response.data, null, 2));
  return response.data;
}