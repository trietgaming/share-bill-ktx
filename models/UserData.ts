import "server-only";
import mongoose, { Schema } from "mongoose";
import type { IUserData } from "@/types/UserData";

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
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', }],
        validate: {
            validator: function (v: mongoose.Types.ObjectId[]) {
                console.log("SHOUD VALIDATE", v);
                return v.length <= 5;
            },
            message: 'Cannot have more than 5 bank accounts'
        },
    },

    roomsJoined: {
        type: [{
            type: String,
            ref: 'Room'
        }],
        validate: {
            validator: function (v: string[]) {
                return v.length <= 10;
            },
            message: 'Cannot join more than 10 rooms'
        }
    }
}, {
    timestamps: true,
    _id: false
})

export const UserData: mongoose.Model<IUserData> = mongoose.models.UserData || mongoose.model("UserData", userDataSchema);