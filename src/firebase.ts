import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must include database ID to connect to the provisioned Firestore database instance
// experimentalForceLongPolling: true ensures stable connection in sandboxed iframe & proxy environments
// without 10-second streaming timeout warnings
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as { code?: string })?.code || '';

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error:', JSON.stringify(errInfo));

  // If operation failed due to permissions, throw structured error per security rules requirement
  if (
    errCode === 'permission-denied' ||
    errMessage.toLowerCase().includes('permission') ||
    errMessage.toLowerCase().includes('insufficient')
  ) {
    throw new Error(JSON.stringify(errInfo));
  }

  return errInfo;
}

export async function testConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('the client is offline - connection timed out')), 5000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'workspaces', 'default')),
      timeoutPromise,
    ]);
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('timed out'))) {
      console.warn('Firestore operating in offline/cached mode:', error.message);
    }
    return false;
  }
}

