"use client";

import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./config";
import { getAuth } from "firebase/auth";

export const firebaseClientApp = initializeApp(firebaseConfig);

export const firebaseClientAuth = getAuth(firebaseClientApp);