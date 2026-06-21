// Mock auth — phone OTP simulated. Stores current user in localStorage.
// Swap for real JWT/cookie flow when API is wired.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, UserRole, Gender } from "./types";
import { seedDemoForUser, saveUser } from "./store";

const KEY_CURRENT_USER = "beitco:currentUser";
const KEY_PENDING_PHONE = "beitco:pendingPhone";
const MOCK_OTP = "1234"; // dev-only — any input works, but this is the "real" one

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (data: { name: string; role: UserRole; gender: Gender }) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const isBrowser = typeof window !== "undefined";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (!isBrowser) return;
    const raw = localStorage.getItem(KEY_CURRENT_USER);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        seedDemoForUser(parsed);
        setUser(parsed);
      } catch {
        // ignore
      }
    }
    setIsLoading(false);
  }, []);

  const requestOtp = async (phone: string) => {
    // Simulate network
    await new Promise((r) => setTimeout(r, 600));
    if (isBrowser) localStorage.setItem(KEY_PENDING_PHONE, phone);
  };

  const verifyOtp = async (phone: string, code: string) => {
    await new Promise((r) => setTimeout(r, 500));
    // Accept any 4+ digit code in mock mode (real flow checks against backend)
    if (code.length < 4) throw new Error("الكود غلط");
    void MOCK_OTP; // hint to devs

    // Check if user already exists
    const usersRaw = isBrowser ? localStorage.getItem("beitco:users") : null;
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    const existing = users.find((u) => u.phone === phone);
    if (existing) {
      seedDemoForUser(existing);
      setUser(existing);
      if (isBrowser) localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(existing));
      return { isNewUser: false };
    }
    // Stash the phone for the profile completion step
    if (isBrowser) localStorage.setItem(KEY_PENDING_PHONE, phone);
    return { isNewUser: true };
  };

  const completeProfile = ({
    name,
    role,
    gender,
  }: {
    name: string;
    role: UserRole;
    gender: Gender;
  }) => {
    if (!isBrowser) return;
    const phone = localStorage.getItem(KEY_PENDING_PHONE) || "";
    if (!phone) throw new Error("مفيش رقم تليفون مسجّل");
    const newUser: User = {
      id: `u-${Date.now()}`,
      phone,
      name,
      role,
      trust: 5.0,
      verified: false,
      createdAt: new Date().toISOString(),
      profile: { selfGender: gender },
    };
    const usersRaw = localStorage.getItem("beitco:users");
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    users.push(newUser);
    localStorage.setItem("beitco:users", JSON.stringify(users));
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(newUser));
    localStorage.removeItem(KEY_PENDING_PHONE);
    seedDemoForUser(newUser);
    setUser(newUser);
  };

  const logout = () => {
    if (isBrowser) localStorage.removeItem(KEY_CURRENT_USER);
    setUser(null);
  };

  // Patch the logged-in user (e.g. save renter preferences) and persist.
  const updateUser = (patch: Partial<User>) => {
    setUser((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      saveUser(next);
      if (isBrowser) localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, requestOtp, verifyOtp, completeProfile, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Convenience: validate Egyptian phone number format
export function isValidEgyptianPhone(phone: string): boolean {
  // Accepts: +201XXXXXXXXX or 01XXXXXXXXX
  const cleaned = phone.replace(/\s+/g, "");
  return /^(\+20|0)1[0125]\d{8}$/.test(cleaned);
}

export function normalizeEgyptianPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("+20")) return cleaned;
  if (cleaned.startsWith("0")) return "+20" + cleaned.slice(1);
  return cleaned;
}
