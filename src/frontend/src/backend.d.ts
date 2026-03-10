import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Labour {
    id: bigint;
    workType: string;
    dailyWage: number;
    name: string;
    totalPaid: number;
    pendingPayment: number;
    siteId: bigint;
    phone: string;
}
export type Time = bigint;
export type RegisterUserResult = {
    __kind__: "ok";
    ok: bigint;
} | {
    __kind__: "emailTaken";
    emailTaken: null;
} | {
    __kind__: "userIdTaken";
    userIdTaken: null;
};
export interface Transaction {
    id: bigint;
    transactionType: TransactionType;
    date: Time;
    notes: string;
    paymentMode: string;
    siteId: bigint;
    amount: number;
}
export interface WorkProgress {
    id: bigint;
    taskName: string;
    progressPercent: number;
    notes: string;
    siteId: bigint;
}
export interface AppUser {
    id: bigint;
    userId: string;
    name: string;
    createdAt: Time;
    email: string;
    passwordHash: string;
}
export interface Site {
    id: bigint;
    status: SiteStatus;
    clientName: string;
    name: string;
    totalAmount: number;
    notes: string;
    location: string;
    expectedEndDate: Time;
    startDate: Time;
}
export type SessionVerificationResult = {
    __kind__: "ok";
    ok: AppUser;
} | {
    __kind__: "expired";
    expired: null;
} | {
    __kind__: "notFound";
    notFound: null;
};
export type LoginResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "userNotFound";
    userNotFound: null;
} | {
    __kind__: "invalidCredentials";
    invalidCredentials: null;
};
export interface UserProfile {
    name: string;
    email: string;
}
export enum ChangePasswordResult {
    ok = "ok",
    sessionInvalid = "sessionInvalid",
    invalidCredentials = "invalidCredentials"
}
export enum SiteStatus {
    active = "active",
    completed = "completed"
}
export enum TransactionType {
    miscExpense = "miscExpense",
    labourPayment = "labourPayment",
    paymentReceived = "paymentReceived",
    materialPurchase = "materialPurchase"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changePassword(token: string, oldPassword: string, newPassword: string): Promise<ChangePasswordResult>;
    createLabour(siteId: bigint, name: string, phone: string, workType: string, dailyWage: number): Promise<bigint>;
    createSite(name: string, clientName: string, location: string, startDate: Time, expectedEndDate: Time, totalAmount: number, notes: string): Promise<bigint>;
    createTransaction(siteId: bigint, date: Time, transactionType: TransactionType, amount: number, paymentMode: string, notes: string): Promise<bigint>;
    createWorkProgress(siteId: bigint, taskName: string, progressPercent: number, notes: string): Promise<bigint>;
    deleteLabour(id: bigint): Promise<void>;
    deleteSite(id: bigint): Promise<void>;
    deleteTransaction(id: bigint): Promise<void>;
    getAllSites(): Promise<Array<Site>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLabour(id: bigint): Promise<Labour>;
    getLaboursBySiteId(siteId: bigint): Promise<Array<Labour>>;
    getSite(id: bigint): Promise<Site>;
    getTransaction(id: bigint): Promise<Transaction>;
    getTransactionsBySiteId(siteId: bigint): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkProgress(id: bigint): Promise<WorkProgress>;
    getWorkProgressBySiteId(siteId: bigint): Promise<Array<WorkProgress>>;
    isCallerAdmin(): Promise<boolean>;
    loginUser(userId: string, password: string): Promise<LoginResult>;
    logoutSession(token: string): Promise<void>;
    registerUser(userId: string, name: string, email: string, password: string): Promise<RegisterUserResult>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateLabour(id: bigint, name: string, phone: string, workType: string, dailyWage: number, totalPaid: number, pendingPayment: number): Promise<void>;
    updateSite(id: bigint, name: string, clientName: string, location: string, startDate: Time, expectedEndDate: Time, totalAmount: number, notes: string, status: SiteStatus): Promise<void>;
    updateWorkProgress(id: bigint, taskName: string, progressPercent: number, notes: string): Promise<void>;
    verifySession(token: string): Promise<SessionVerificationResult>;
}
