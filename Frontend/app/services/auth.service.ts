import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { firebaseAuth } from "../config/firebase";
import { api } from "./http";
import type {
  User,
  CompleteRegisterRequest,
  CompleteRegisterResponse,
  RegisterCredentialsRequest,
  RegisterCredentialsResponse,
  SessionStatusResponse,
  MeResponse,
} from "./types";

export const authService = {
  registerCredentials: async (
    body: RegisterCredentialsRequest,
  ): Promise<RegisterCredentialsResponse> => {
    const { data } = await api.post<RegisterCredentialsResponse>(
      "/auth/register/credentials",
      body,
    );

    return data;
  },

  completeRegister: async (
    body: CompleteRegisterRequest,
  ): Promise<CompleteRegisterResponse> => {
    const { data } = await api.post<CompleteRegisterResponse>(
      "/auth/register/details",
      body,
    );

    return data;
  },

  login: async (email: string, password: string): Promise<{ user: User }> => {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password,
    );

    if (!credential.user.emailVerified) {
      await signOut(firebaseAuth);
      throw new Error("Please verify your email before logging in.");
    }
    const token = await credential.user.getIdToken(true);
    console.log("Firebase ID token Frontend:", token);
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data;
  },

  logout: async (): Promise<void> => {
    await signOut(firebaseAuth);
  },

  me: async (): Promise<MeResponse> => {
    const { data } = await api.get<MeResponse>("/auth/me");
    return data;
  },

  checkLogin: async (): Promise<SessionStatusResponse> => {
    try {
      if (!firebaseAuth.currentUser) {
        return { isLoggedIn: false, isPendingStep3: false, user: null };
      }

      await firebaseAuth.currentUser.reload();

      if (!firebaseAuth.currentUser.emailVerified) {
        return { isLoggedIn: false, isPendingStep3: false, user: null };
      }

      const { data } = await api.get<SessionStatusResponse>("/auth/session");
      return data;
    } catch {
      return { isLoggedIn: false, isPendingStep3: false, user: null };
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(firebaseAuth, email);
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser?.email) {
      throw new Error("Not logged in");
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword,
    );

    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  },
};