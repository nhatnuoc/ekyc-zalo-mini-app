export enum PassportAuthenticationStatus {
  notDone = 'notDone'
}

export interface IDCardRawData {
  faceString: string;
  documentCertificate: string;
  dg13Data: number[];
  chipAuthStatus: PassportAuthenticationStatus;
  passiveAuthStatus: PassportAuthenticationStatus;
  dg14Data: number[];
  dg1Data: number[];
  dg2Data: number[];
  sodData: number[];
}

export interface IDCardInformation {
  cert: string;
  citizen_identify: string;
  dateProvide: string;
  date_of_birth: string;
  date_of_expiry: string;
  date_provide: string;
  ethnic: string;
  face_image: string;
  father_name: string;
  full_name: string;
  gender: string;
  hex: string;
  mother_name: string;
  nationality: string;
  old_citizen_identify: string;
  otherName: string;
  partner_name: string;
  personal_identification: string;
  place_of_origin: string;
  place_of_residence: string;
  religion: string;
}

export interface IDCardInformationResponse {
  status: number;
  code: string;
  message: string;
  requestId: string;
  faceString: string;
  data?: IDCardInformation;
  chipAuthStatus: PassportAuthenticationStatus;
  passiveAuthStatus: PassportAuthenticationStatus;
}

export interface IDCardValidationData {
  status: number;
  code: string;
  result: boolean;
  message: string;
  time: number;
}

export interface IDCardValidationResponse {
  status: number;
  code: string;
  message: string;
  data?: IDCardValidationData;
}

export interface PassiveAuthInformation {
  id: number;
  status: number;
  type: string;
  requestId: string;
  cardId: string;
  cardHolderName: string;
  address: string;
  faceImage: string;
}

export interface IDCardPassiveAuthenticationResponse {
  status: number;
  code: string;
  message: string;
  requestId: string;
  data?: PassiveAuthInformation;
  cardData?: IDCardInformation;
}

export interface IDCardReaderResponsable {
  status: number;
  data: string;
  signature: string;
  code: string;
  message: string;
}

export interface IDCardReaderRegisterDeviceResponse {
  status: number;
  code: string;
  message: string;
  secret: string;
  signature: string;
}

export enum CardValidationError {
  badParameter = 'badParameter',
  badResponse = 'badResponse',
  missingParameter = 'missingParameter',
  licenseOrAppNotFound = 'licenseOrAppNotFound',
  licenseExpired = 'licenseExpired',
  merchantNotFound = 'merchantNotFound',
  invalidSignature = 'invalidSignature',
  appIdNotFound = 'appIdNotFound',
  merchantAccountNotFound = 'merchantAccountNotFound',
  merchantAccountLocked = 'merchantAccountLocked',
  noPermission = 'noPermission',
  duplicateUniqueData = 'duplicateUniqueData',
  dataNotFound = 'dataNotFound',
  ipBlocked = 'ipBlocked',
  systemMaintenance = 'systemMaintenance',
  transactionNotFound = 'transactionNotFound',
  systemBusy = 'systemBusy',
  noMatchedCard = 'noMatchedCard',
  checkCertFailed = 'checkCertFailed',
  passiveAuthError = 'passiveAuthError',
  signatureError = 'signatureError',
  transactionNotFoundNoMatchMerchant = 'transactionNotFoundNoMatchMerchant',
  unknowError = 'unknowError'
}

export const getCardValidationError = (code: string): CardValidationError => {
  const errorMap: { [key: string]: CardValidationError } = {
    '001': CardValidationError.missingParameter,
    '002': CardValidationError.licenseOrAppNotFound,
    '003': CardValidationError.licenseExpired,
    '004': CardValidationError.merchantNotFound,
    '005': CardValidationError.invalidSignature,
    '006': CardValidationError.appIdNotFound,
    '007': CardValidationError.merchantAccountNotFound,
    '008': CardValidationError.merchantAccountLocked,
    '009': CardValidationError.noPermission,
    '010': CardValidationError.duplicateUniqueData,
    '011': CardValidationError.dataNotFound,
    '012': CardValidationError.ipBlocked,
    '013': CardValidationError.systemMaintenance,
    '014': CardValidationError.transactionNotFound,
    '015': CardValidationError.systemBusy,
    '019': CardValidationError.transactionNotFoundNoMatchMerchant,
    'NO_MATCHED_CARD': CardValidationError.noMatchedCard,
    'ERROR_CHECK_CERT': CardValidationError.checkCertFailed,
    'PASSIVE_AUTH_ERR': CardValidationError.passiveAuthError
  };

  return errorMap[code] || CardValidationError.unknowError;
}; 