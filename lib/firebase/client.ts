"use client";

import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./config";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, Messaging } from "firebase/messaging";

export const firebaseClientApp = initializeApp(firebaseConfig);

export const firebaseClientAuth = getAuth(firebaseClientApp);

export const firebaseMessaging = (typeof window !== "undefined" ? getMessaging(firebaseClientApp) : null) as Messaging;