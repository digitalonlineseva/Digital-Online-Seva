
export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  price: number;
  helpLink: string;
  serviceUrl?: string;
  requiresBiometrics?: boolean;
  requiresMotherName?: boolean;
  requiresFatherName?: boolean; // New: Configurable via Admin
  requiresDob?: boolean; // New: Configurable via Admin
  requiresEpic?: boolean;
  requiresAddress?: boolean;
  requiresPhoto?: boolean;
  requiresSignature?: boolean;
  requiresLandDetails?: boolean;
  allowAdditionalMembers?: boolean; // New: Enables the "Add Member" (Max 3) feature
}

export interface Transaction {
  id: string;
  type: 'Credit' | 'Debit' | 'Withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'Pending' | 'Success' | 'Rejected';
  utr?: string;
  bankDetails?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'retailer';
  fullName: string;
  shopName?: string;
  email?: string;
  mobileNumber?: string;
  aadharNumber?: string;
  panNumber?: string;
  status: 'Active' | 'Pending' | 'Rejected' | 'Suspended';
  registeredAt?: string;
  customPassword?: string;
  walletBalance: number;
  transactions?: Transaction[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Application {
  id: string;
  serviceId: string;
  serviceName: string;
  fullName: string;
  motherName?: string;
  dob: string;
  fatherName: string;
  mobileNumber: string;
  status: 'Pending' | 'Processed' | 'Approved' | 'Rejected';
  submittedAt: string;
  documentName: string;
  documentUrl?: string;
  photoName?: string;
  photoUrl?: string;
  signatureName?: string;
  signatureUrl?: string;
  processedDocumentName?: string;
  processedDocumentUrl?: string;
  amountPaid: number;
  userId?: string;
  roleAtSubmission?: string;
  assignedToId?: string;
  assignedToName?: string;
  remark?: string; 
  rationType?: 'New' | 'AddName';
  additionalNames?: string[];
  epicNumber?: string;
  addressInfo?: {
    state: string;
    block?: string;
    anchal?: string;
    anumandal?: string;
    panchayat?: string;
    postOffice?: string;
    pinCode?: string;
    village?: string;
  };
  landInfo?: {
    district: string;
    anchal: string;
    halka: string;
    mauja: string;
    plotNumber?: string;
    khataNumber?: string;
  };
  paymentMethod?: 'Wallet' | 'UPI';
}

export type ViewState = 'home' | 'form' | 'admin' | 'status' | 'receipt' | 'login' | 'register' | 'forget-password' | 'wallet' | 'profile' | 'policy' | 'download';

export interface FormData {
  fullName: string;
  motherName: string;
  dob: string;
  fatherName: string;
  mobileNumber: string;
  document: File | null;
  photo: File | null;
  signature: File | null;
  rationType?: 'New' | 'AddName';
  additionalNames: string[];
  epicNumber?: string;
  state: string;
  block: string;
  anumandal: string;
  anchal: string;
  panchayat: string;
  postOffice: string;
  pinCode: string;
  district: string;
  halka: string;
  mauja: string;
  plotNumber: string;
  khataNumber: string;
  village?: string;
}
