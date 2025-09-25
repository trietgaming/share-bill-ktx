"use server";

import { getAuthenticatedUser } from "@/lib/firebase/server";
import { getUserData } from "@/lib/user-data";
import { serializeDocument } from "../serializer";
import { IUserDataWithBankAccounts } from "@/types/user-data";
import { _authenticate, UserCtx } from "../prechecks/auth";
import { v2 as cloudinary } from "cloudinary";
import { BankAccount } from "@/models/BankAccount";
import { UserData } from "@/models/UserData";
import mongoose from "mongoose";
import { IBankAccount, IClientBankAccount } from "@/types/bank-account";
import { uploadFileToCloudinary } from "../cloudinary";
import {
    serverAction,
} from "@/lib/actions-helper";
import { ErrorCode } from "@/enums/error";
import { AppError } from "../errors";
import { revalidateTag } from "next/cache";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getAuthenticatedUserData = serverAction<
    (_idToken?: string | null) => Promise<IUserDataWithBankAccounts | null>
>({
    initContext: async (ctx, _idToken) => {
        const user = await getAuthenticatedUser(_idToken);

        ctx.user = user;
    },
    fn: async function (ctx: UserCtx,
        _idToken?: string | null
    ) {
        if (!ctx.user) return null;

        const userData = await (
            await getUserData(ctx.user)
        ).populate<{ bankAccounts: IBankAccount[] }>("bankAccounts");

        return (
            serializeDocument<IUserDataWithBankAccounts>(userData)
        );
    },
    cache: (ctx) => {
        if (!ctx.user) return null
        return {
            tags: [`user-data-${ctx.user.uid}`],
        };
    }
})

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export const updateUserPhoto = serverAction<
    (photo: File) => Promise<string>
>({
    prechecks: [
        async (ctx, photo) => {
            // only support jpg, jpeg, png, webp
            if (!SUPPORTED_IMAGE_TYPES.includes(photo.type)) {
                throw new AppError(
                    "Định dạng file không hợp lệ",
                    ErrorCode.INVALID_INPUT
                );
            }
            if (photo.size > MAX_FILE_SIZE) {
                throw new AppError(
                    "Tệp phải nhỏ hơn 5MB!",
                    ErrorCode.INVALID_INPUT
                );
            }
        },
        _authenticate
    ],
    fn: async function (
        ctx: UserCtx,
        photo: File
    ) {
        const imageId = `user_photo_${ctx.user.uid}`;

        // Upload an image
        const uploadResult = await uploadFileToCloudinary(photo, {
            folder: "share-bill-ktx",
            public_id: imageId,
            overwrite: true,
            resource_type: "image",
            upload_preset: "avatar_upload",
        });

        const photoURL = uploadResult?.url;
        if (!photoURL) {
            throw new AppError(
                "Failed to upload image",
                ErrorCode.UNKNOWN
            );
        }

        const userData = await getUserData(ctx.user);
        userData.photoURL = photoURL;

        await userData.save();

        revalidateTag(`user-data-${ctx.user.uid}`);
        return photoURL;
    }
})

export interface UpdateUserDataFormData {
    displayName: string;
}

export const updateUserData = serverAction<
    (data: UpdateUserDataFormData) => Promise<void>
>(
    {
        prechecks: [_authenticate],
        fn: async function (
            ctx: UserCtx,
            data: UpdateUserDataFormData
        ) {
            const userData = await getUserData(ctx.user);

            userData.displayName = data.displayName;

            await userData.save();
            revalidateTag(`user-data-${ctx.user.uid}`);
        }
    }
)

export interface CreateOrUpdateUserBankAccountFormData {
    id?: string;
    accountNumber?: string;
    accountName?: string;
    bankName: string;
    qrCodeFile?: File;
}

export const createOrUpdateUserBankAccount = serverAction<
    (data: CreateOrUpdateUserBankAccountFormData) => Promise<IClientBankAccount>
>({
    prechecks: [
        async (ctx, data) => {
            if (data.qrCodeFile) {
                if (!SUPPORTED_IMAGE_TYPES.includes(data.qrCodeFile.type)) {
                    throw new AppError(
                        "Định dạng file không hợp lệ",
                        ErrorCode.INVALID_INPUT
                    );
                }
                if (data.qrCodeFile.size > MAX_FILE_SIZE) {
                    throw new AppError(
                        "Tệp phải nhỏ hơn 1MB",
                        ErrorCode.INVALID_INPUT
                    );
                }
            }
        },
        _authenticate
    ],
    fn: async function (
        ctx: UserCtx,
        data: CreateOrUpdateUserBankAccountFormData
    ) {
        const userData = await getUserData(ctx.user);

        if (
            data.id &&
            userData.bankAccounts.every((bankId) => !bankId.equals(data.id))
        ) {
            throw new AppError(
                "Không tìm thấy tài khoản ngân hàng",
                ErrorCode.NOT_FOUND
            );
        }

        const isUpdate = Boolean(data.id);

        const bankAccount = isUpdate
            ? (await BankAccount.findById(data.id))!
            : new BankAccount();

        if (data.qrCodeFile) {
            const imageId = `bank_account_qr_${bankAccount._id}`;

            const uploadResult = await uploadFileToCloudinary(data.qrCodeFile, {
                folder: "share-bill-ktx",
                public_id: imageId,
                overwrite: true,
                resource_type: "image",
                upload_preset: "avatar_upload",
            });

            const qrCodeUrl = uploadResult!.url;
            bankAccount.qrCodeUrl = qrCodeUrl;
        } else {
            bankAccount.accountName = data.accountName;
            bankAccount.accountNumber = data.accountNumber;
        }
        bankAccount.bankName = data.bankName;

        const session = await mongoose.startSession();

        const newBankAccount = await session.withTransaction(async () => {
            await bankAccount.save({ session });

            if (!isUpdate) {
                userData.bankAccounts.push(bankAccount._id);
                await userData.save({ session });
            }

            return bankAccount;
        });

        revalidateTag(`user-data-${ctx.user.uid}`);

        return (
            serializeDocument<IClientBankAccount>(newBankAccount)
        );
    }
})

export const deleteUserBankAccount = serverAction<
    (bankAccountId: string) => Promise<void>
>({
    prechecks: [_authenticate],
    fn: async function (
        ctx: UserCtx,
        bankAccountId: string
    ) {
        const userData = await getUserData(ctx.user);

        if (!userData.bankAccounts.some((bankId) => bankId.equals(bankAccountId))) {
            throw new AppError(
                "Không tìm thấy tài khoản ngân hàng",
                ErrorCode.NOT_FOUND
            );
        }

        const session = await mongoose.startSession();

        await session.withTransaction(async () => {
            await BankAccount.findByIdAndDelete(bankAccountId, { session });

            await UserData.findByIdAndUpdate(
                ctx.user.uid,
                {
                    $pull: {
                        bankAccounts: new mongoose.Types.ObjectId(
                            bankAccountId
                        ),
                    },
                },
                { session, runValidators: true }
            );
        });

        revalidateTag(`user-data-${ctx.user.uid}`);
    }
})
