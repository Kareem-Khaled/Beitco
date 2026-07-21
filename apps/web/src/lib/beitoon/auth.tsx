// Auth context. Two backends behind the same surface (VITE_USE_API flag):
//  - mock (default): phone OTP simulated, user in localStorage.
//  - api: real OTP + JWT httpOnly cookies via the NestJS backend.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, UserRole, Gender } from "./types";
import { seedDemoForUser, saveUser } from "./store";
import {
  USE_API,
  apiRequestOtp,
  apiVerifyOtp,
  apiCompleteProfile,
  apiMe,
  apiLogout,
  apiUpdateMe,
} from "./api";

const KEY_CURRENT_USER = "beitco:currentUser";
const KEY_PENDING_PHONE = "beitco:pendingPhone";
const MOCK_OTP = "1234"; // dev-only  -  any input works, but this is the "real" one

// The frontend captures gender in Arabic; the API uses male/female.
const genderToApi = (g: Gender): "male" | "female" => (g === "ذكر" ? "male" : "female");

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

  // Hydrate on mount: API checks the session cookie; mock reads localStorage.
  useEffect(() => {
    if (!isBrowser) return;
    if (USE_API) {
      apiMe()
        .then((u) => setUser(u))
        .finally(() => setIsLoading(false));
      return;
    }
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
    if (USE_API) {
      const { devCode } = await apiRequestOtp(phone);
      if (isBrowser) {
        localStorage.setItem(KEY_PENDING_PHONE, phone);
        // Surface the dev code so login is testable without an SMS gateway.
        if (devCode) console.info(`[Beitoon] dev OTP for ${phone}: ${devCode}`);
      }
      return;
    }
    // Simulate network
    await new Promise((r) => setTimeout(r, 600));
    if (isBrowser) localStorage.setItem(KEY_PENDING_PHONE, phone);
  };

  const verifyOtp = async (phone: string, code: string) => {
    if (USE_API) {
      const { user: u, isNewUser } = await apiVerifyOtp(phone, code);
      // New users get a stub until they complete the profile step.
      if (!isNewUser) setUser(u);
      if (isBrowser) localStorage.setItem(KEY_PENDING_PHONE, phone);
      return { isNewUser };
    }
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
    if (USE_API) {
      apiCompleteProfile({ name, role, gender: genderToApi(gender) }).then((u) => {
        setUser(u);
        if (isBrowser) localStorage.removeItem(KEY_PENDING_PHONE);
      });
      return;
    }
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
    if (USE_API) {
      apiLogout();
      setUser(null);
      return;
    }
    if (isBrowser) localStorage.removeItem(KEY_CURRENT_USER);
    setUser(null);
  };

  // Patch the logged-in user (e.g. settings) and persist.
  const updateUser = (patch: Partial<User>) => {
    setUser((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      if (USE_API) {
        // Optimistic local update; persist the supported fields to the API.
        // Renter `profile` preferences upsert via PATCH /users/me (T-MATCH).
        if (
          patch.name !== undefined ||
          patch.role !== undefined ||
          patch.notifications !== undefined ||
          patch.profile !== undefined
        ) {
          apiUpdateMe(patch).catch(() => {
            /* keep optimistic state */
          });
        }
      } else {
        saveUser(next);
        if (isBrowser) localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(next));
      }
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
