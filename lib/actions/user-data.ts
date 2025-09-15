"use server";

import { getAuthenticatedUser } from "@/lib/firebase/server";
import { getUserData } from "@/lib/user-data";
import { serializeDocument } from "../serializer";
import { IUserData, IUserDataWithBankAccounts } from "@/types/UserData";
import { authenticate } from "../prechecks/auth";
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { BankAccount } from "@/models/BankAccount";
import { UserData } from "@/models/UserData";
import mongoose from "mongoose";
import { IBankAccount, IClientBankAccount } from "@/types/BankAccount";
import { uploadFileToCloudinary } from "../cloudinary";
import { AppError } from "../errors";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function getAuthenticatedUserData() {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const userData = await (await getUserData(user)).populate<{ bankAccounts: IBankAccount[] }>("bankAccounts");

    return serializeDocument<IUserDataWithBankAccounts>(userData);
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export async function updateUserPhoto(photo: File) {
    const user = await authenticate();
    // only support jpg, jpeg, png, webp
    if (!SUPPORTED_IMAGE_TYPES.includes(photo.type)) {
        throw new AppError("Invalid file type");
    }
    if (photo.size > MAX_FILE_SIZE) {
        throw new AppError("File size must be less than 5MB");
    }

    const imageId = `user_photo_${user.uid}`;

    // Upload an image
    const uploadResult = await uploadFileToCloudinary(photo, {
        folder: 'share-bill-ktx',
        public_id: imageId,
        overwrite: true,
        resource_type: 'image',
        upload_preset: 'avatar_upload'
    });

    const photoURL = uploadResult?.url;
    if (!photoURL) {
        throw new AppError("Failed to upload image");
    }

    const userData = await getUserData(user);
    userData.photoURL = photoURL;
    await userData.save();

    return photoURL;
}

export interface UpdateUserDataFormData {
    displayName: string;
}

export async function updateUserData(data: UpdateUserDataFormData) {
    const user = await authenticate();
    const userData = await getUserData(user);

    userData.displayName = data.displayName;
    await userData.save();
}

export interface CreateOrUpdateUserBankAccountFormData {
    id?: string;
    accountNumber?: string;
    accountName?: string;
    bankName: string;
    qrCodeFile?: File;
}

export async function createOrUpdateUserBankAccount(data: CreateOrUpdateUserBankAccountFormData): Promise<IClientBankAccount> {
    const user = await authenticate();
    const userData = await getUserData(user);

    if (data.id && userData.bankAccounts.every(bankId => !bankId.equals(data.id))) {
        throw new AppError("Bank account not found");
    }

    const isUpdate = Boolean(data.id);

    const bankAccount = isUpdate ?
        (await BankAccount.findById(data.id))! :
        new BankAccount();

    if (data.qrCodeFile) {
        if (!SUPPORTED_IMAGE_TYPES.includes(data.qrCodeFile.type)) {
            throw new AppError("Invalid file type");
        }
        if (data.qrCodeFile.size > MAX_FILE_SIZE) {
            throw new AppError("File size must be less than 1MB");
        }

        const imageId = `bank_account_qr_${bankAccount._id}`;

        const uploadResult = await uploadFileToCloudinary(data.qrCodeFile, {
            folder: 'share-bill-ktx',
            public_id: imageId,
            overwrite: true,
            resource_type: 'image',
            upload_preset: 'avatar_upload'
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
    })

    return serializeDocument<IClientBankAccount>(newBankAccount);
}

export async function deleteUserBankAccount(bankAccountId: string) {
    const user = await authenticate();
    const userData = await getUserData(user);

    if (!userData.bankAccounts.some(bankId => bankId.equals(bankAccountId))) {
        throw new AppError("Bank account not found");
    }

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
        await BankAccount.findByIdAndDelete(bankAccountId, { session });

        await UserData.findByIdAndUpdate(user.uid, {
            $pull: {
                bankAccounts: new mongoose.Types.ObjectId(bankAccountId)
            }
        }, { session, runValidators: true });
    });
}