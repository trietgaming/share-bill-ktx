"use server";

import { getAuthenticatedUser } from "@/lib/firebase/server";
import { getUserData } from "@/lib/user-data";
import { serializeDocument } from "../serializer";
import { IUserData, IUserDataWithBankAccounts } from "@/types/user-data";
import { authenticate } from "../prechecks/auth";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { BankAccount } from "@/models/BankAccount";
import { UserData } from "@/models/UserData";
import mongoose from "mongoose";
import { IBankAccount, IClientBankAccount } from "@/types/bank-account";
import { uploadFileToCloudinary } from "../cloudinary";
import { ServerActionResponse } from "@/types/actions";
import {
    createErrorResponse,
    createSuccessResponse,
    handleServerActionError,
} from "@/lib/actions-helper";
import { ErrorCode } from "@/enums/error";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getAuthenticatedUserData(
    _idToken?: string | null
): ServerActionResponse<IUserDataWithBankAccounts | null> {
    const user = await getAuthenticatedUser(_idToken);
    if (!user) return createSuccessResponse(null);

    const userData = await (
        await getUserData(user)
    ).populate<{ bankAccounts: IBankAccount[] }>("bankAccounts");

    return createSuccessResponse(
        serializeDocument<IUserDataWithBankAccounts>(userData)
    );
}

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export async function updateUserPhoto(
    photo: File
): ServerActionResponse<string> {
    const user = await authenticate();
    // only support jpg, jpeg, png, webp
    if (!SUPPORTED_IMAGE_TYPES.includes(photo.type)) {
        return createErrorResponse(
            "Định dạng file không hợp lệ",
            ErrorCode.INVALID_INPUT
        );
    }
    if (photo.size > MAX_FILE_SIZE) {
        return createErrorResponse(
            "Tệp phải nhỏ hơn 5MB!",
            ErrorCode.INVALID_INPUT
        );
    }

    const imageId = `user_photo_${user.uid}`;

    try {
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
            return createErrorResponse(
                "Failed to upload image",
                ErrorCode.UNKNOWN
            );
        }

        const userData = await getUserData(user);
        userData.photoURL = photoURL;

        await userData.save();
        return createSuccessResponse(photoURL);
    } catch (err) {
        return handleServerActionError(err);
    }
}

export interface UpdateUserDataFormData {
    displayName: string;
}

export async function updateUserData(
    data: UpdateUserDataFormData
): ServerActionResponse<void> {
    const user = await authenticate();
    const userData = await getUserData(user);

    userData.displayName = data.displayName;

    try {
        await userData.save();
    } catch (err) {
        return handleServerActionError(err);
    }
    return createSuccessResponse(void 0);
}

export interface CreateOrUpdateUserBankAccountFormData {
    id?: string;
    accountNumber?: string;
    accountName?: string;
    bankName: string;
    qrCodeFile?: File;
}

export async function createOrUpdateUserBankAccount(
    data: CreateOrUpdateUserBankAccountFormData
): ServerActionResponse<IClientBankAccount> {
    const user = await authenticate();
    const userData = await getUserData(user);

    if (
        data.id &&
        userData.bankAccounts.every((bankId) => !bankId.equals(data.id))
    ) {
        return createErrorResponse(
            "Không tìm thấy tài khoản ngân hàng",
            ErrorCode.NOT_FOUND
        );
    }

    const isUpdate = Boolean(data.id);

    try {
        const bankAccount = isUpdate
            ? (await BankAccount.findById(data.id))!
            : new BankAccount();

        if (data.qrCodeFile) {
            if (!SUPPORTED_IMAGE_TYPES.includes(data.qrCodeFile.type)) {
                return createErrorResponse(
                    "Định dạng file không hợp lệ",
                    ErrorCode.INVALID_INPUT
                );
            }
            if (data.qrCodeFile.size > MAX_FILE_SIZE) {
                return createErrorResponse(
                    "Tệp phải nhỏ hơn 1MB",
                    ErrorCode.INVALID_INPUT
                );
            }

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

        return createSuccessResponse(
            serializeDocument<IClientBankAccount>(newBankAccount)
        );
    } catch (error) {
        return handleServerActionError(error);
    }
}

export async function deleteUserBankAccount(
    bankAccountId: string
): ServerActionResponse<void> {
    const user = await authenticate();
    const userData = await getUserData(user);

    if (!userData.bankAccounts.some((bankId) => bankId.equals(bankAccountId))) {
        return createErrorResponse(
            "Không tìm thấy tài khoản ngân hàng",
            ErrorCode.NOT_FOUND
        );
    }

    try {
        const session = await mongoose.startSession();

        await session.withTransaction(async () => {
            await BankAccount.findByIdAndDelete(bankAccountId, { session });

            await UserData.findByIdAndUpdate(
                user.uid,
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
        return createSuccessResponse(void 0);
    } catch (error) {
        return handleServerActionError(error);
    }
}
