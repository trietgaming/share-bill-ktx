import "server-only";
import mongoose, { Schema } from "mongoose";
import type { IBankAccount, IUserData } from "@/types/UserData";
import { Room } from "@/models/Room";

export const bankAccountSchema = new Schema<IBankAccount>({
    accountNumber: {
        type: String,
        required: true,
        trim: true,
        maxLength: [30, 'Account number can not be more than 30 characters']
    },
    accountName: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, 'Account name can not be more than 100 characters']
    },
    bankName: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, 'Bank name can not be more than 100 characters']
    },
})


export const userDataSchema = new Schema<IUserData>({
    _id: {
        type: String,
        required: true,
        trim: true
    },

    displayName: {
        type: String,
        trim: true,
        maxLength: [100, 'Display name can not be more than 100 characters'],
        default: 'Noname'
    },

    email: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, 'Email can not be more than 100 characters'],
    },

    photoURL: {
        type: String,
        trim: true,
    },

    phoneNumber: {
        type: String,
        trim: true,
        maxLength: [20, 'Phone number can not be more than 20 characters'],
    },

    bankAccounts: {
        type: [bankAccountSchema],
        maxLength: [5, 'Cannot have more than 5 bank accounts'],
    },

    roomsJoined: {
        type: [{
            type: String,
            ref: 'Room'
        }],
        maxLength: [10, 'Cannot join more than 10 rooms'],
    }
}, {
    timestamps: true,
    _id: false
})

export const UserData: mongoose.Model<IUserData> = mongoose.models.UserData || mongoose.model("UserData", userDataSchema);