declare namespace NodeJS {
    export interface ProcessEnv {
        NEXT_PUBLIC_FIREBASE_API_KEY: string;
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
        NEXT_PUBLIC_FIREBASE_APP_ID: string;
        FIRESTORE_CONNECTION_URI: string;
        APP_DOMAIN: string;
        APP_ORIGIN: string;
        CLOUDINARY_URL: string;
        CLOUDINARY_API_SECRET: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_CLOUD_NAME: string;
    }
}
