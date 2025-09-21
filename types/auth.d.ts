import type { DecodedIdToken } from "firebase-admin/auth";

export interface DecodedIdToken extends DecodedIdToken {
    /**
     * @inheritdoc {@link DecodedIdToken.uid}
     */
    user_id: string;
    name?: string;
}