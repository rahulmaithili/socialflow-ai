import { collection, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface LicenseData {
  key: string;
  clientName: string;
  plan: 'trial' | 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'banned';
  boundHwid?: string;
  maxDevices: number;
  activatedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

const STORAGE_KEY = 'socialflow_active_license';

/**
 * Get Hardware ID (HWID) from Electron or generate fallback browser fingerprint
 */
export async function getMachineHWID(): Promise<string> {
  if (window.electronAPI?.getMachineId) {
    try {
      return await window.electronAPI.getMachineId();
    } catch {
      // fallback
    }
  }

  // Web fallback fingerprint
  let fp = localStorage.getItem('socialflow_hwid_fp');
  if (!fp) {
    const raw = `${navigator.userAgent}_${navigator.language}_${screen.width}x${screen.height}_${Date.now()}_${Math.random()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    fp = `HWID-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
    localStorage.setItem('socialflow_hwid_fp', fp);
  }
  return fp;
}

/**
 * Verify license key against Firestore database
 */
export async function verifyLicenseKey(
  inputKey: string, 
  hwid: string
): Promise<{ success: boolean; license?: LicenseData; message: string }> {
  const cleanKey = inputKey.trim().toUpperCase();

  if (!cleanKey) {
    return { success: false, message: 'Please enter a valid License Key.' };
  }

  // Developer Master Bypass Key (Always valid for system admin)
  if (cleanKey === 'SF-ADMIN-LIFETIME-PRO' || cleanKey === 'SF-RAHUL-SCRIPTS-MASTER') {
    const adminLicense: LicenseData = {
      key: cleanKey,
      clientName: 'Rahul Scripts Admin',
      plan: 'lifetime',
      status: 'active',
      boundHwid: hwid,
      maxDevices: 999,
      activatedAt: new Date().toISOString(),
      expiresAt: '2099-12-31T23:59:59.000Z',
      createdAt: new Date().toISOString()
    };
    saveActiveLicense(adminLicense);
    return { success: true, license: adminLicense, message: 'Master Admin License Activated! Full Unlimited Access.' };
  }

  try {
    const docRef = doc(db, 'licenses', cleanKey);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, message: 'License key not found. Please verify your purchase or contact support.' };
    }

    const data = snap.data() as LicenseData;

    if (data.status === 'banned') {
      return { success: false, message: 'This license key has been suspended or revoked.' };
    }

    // Check expiration
    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      return { success: false, message: `License expired on ${new Date(data.expiresAt).toLocaleDateString()}. Please renew your subscription.` };
    }

    // Bind to machine HWID if not already bound
    if (!data.boundHwid) {
      await setDoc(docRef, {
        ...data,
        boundHwid: hwid,
        activatedAt: new Date().toISOString()
      }, { merge: true });
      data.boundHwid = hwid;
    } else if (data.boundHwid !== hwid && data.maxDevices <= 1) {
      return { success: false, message: 'This license is already registered to another PC (HWID Mismatch). Contact admin to transfer license.' };
    }

    saveActiveLicense(data);
    return { success: true, license: data, message: `License successfully activated! Plan: ${data.plan.toUpperCase()}` };
  } catch (err: any) {
    // If offline or permission notice, check local cached license
    const cached = getActiveLicense();
    if (cached && cached.key === cleanKey) {
      return { success: true, license: cached, message: 'Validated using local cached license.' };
    }
    return { success: false, message: err.message || 'Error validating license key.' };
  }
}

/**
 * Get active cached license
 */
export function getActiveLicense(): LicenseData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as LicenseData;
    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveActiveLicense(license: LicenseData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
}

export function clearActiveLicense(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Admin helper to generate brand-new license keys for selling to customers
 */
export async function generateNewLicenseKey(
  plan: 'trial' | 'monthly' | 'yearly' | 'lifetime',
  clientName: string
): Promise<LicenseData> {
  const randomSeg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  const key = `SF-${randomSeg()}-${randomSeg()}-${randomSeg()}`;

  let validityDays = 30;
  if (plan === 'trial') validityDays = 7;
  else if (plan === 'monthly') validityDays = 30;
  else if (plan === 'yearly') validityDays = 365;
  else if (plan === 'lifetime') validityDays = 36500;

  const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

  const newLicense: LicenseData = {
    key,
    clientName: clientName.trim() || 'Valued Client',
    plan,
    status: 'active',
    maxDevices: 1,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'licenses', key), newLicense);
  } catch (e) {
    console.warn('[LicenseService] Firestore key save note:', e);
  }

  return newLicense;
}

export const generateNewLicense = async (
  clientName: string,
  plan: 'trial' | 'monthly' | 'yearly' | 'lifetime' = 'lifetime'
): Promise<LicenseData> => {
  return generateNewLicenseKey(plan, clientName);
};
