import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser, Role } from "@/lib/types";

interface AuthValue {
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUpOrganizer: (input: {
    email: string;
    password: string;
    fullName: string;
    organizationName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function loadProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setProfile(user ? await loadProfile(user.uid) : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      firebaseUser,
      profile,
      loading,
      async signIn(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const p = await loadProfile(cred.user.uid);
        if (!p) {
          await signOut(auth);
          throw new Error("Aucun profil bTicket n'est associé à ce compte.");
        }
        setProfile(p);
        return p;
      },
      async signUpOrganizer({ email, password, fullName, organizationName, phone }) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newProfile: Omit<AppUser, "id"> = {
          email: email.trim(),
          fullName,
          organizationName,
          phone,
          role: "organizer" as Role,
          status: "pending",
        };
        await setDoc(doc(db, "users", cred.user.uid), { ...newProfile, createdAt: serverTimestamp() });
        setProfile({ id: cred.user.uid, ...newProfile });
      },
      async logout() {
        await signOut(auth);
        setProfile(null);
      },
      async refresh() {
        if (firebaseUser) setProfile(await loadProfile(firebaseUser.uid));
      },
    }),
    [firebaseUser, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
