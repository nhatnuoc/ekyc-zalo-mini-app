export interface InitTransactionData { transactionId: string; verifyToken: string }

export interface InitTransactionResponsable {
    status: number;
    data: string | InitTransactionData;
    signature: string;
    code: string;
    message: string;
}

export interface RegisterDeviceResponsable {
    status: number;
    data: string;
    signature: string;
    code: string;
    message: string;
}

export interface LivenessResult {
    status: number;
    data: LivenessResultData;
    signature: string;
    success: boolean;
    message: string;
    code: string;
    request_id: string;
} 

interface LivenessResultData {
    livenesScore: number;
    livenessScore: number;
    faceMatchingScore: number;
    sim: number;
    livenessType: string;
    faceMatchingResult: number;
    success: boolean;
}