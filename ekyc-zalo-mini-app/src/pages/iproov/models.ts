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
    data: Record<string, any>;
    signature: string;
    livenesScore: number;
    faceMatchingScore: number;
    success: boolean;
    sim: number;
    livenessType: string;
    message: string;
    code: string;
    request_id: string;
    faceMatchingResult: number;
} 