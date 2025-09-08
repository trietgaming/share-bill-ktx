import mongoose from "mongoose";

export function serializeDocument<T extends any>(doc: mongoose.Document | mongoose.Document[]): T {
    if (Array.isArray(doc)) {
        return doc.map(d => d.toJSON({ "flattenObjectIds": true, virtuals: true, schemaFieldsOnly: true })) as unknown as T;
    }
    return doc.toJSON({ "flattenObjectIds": true, virtuals: true, schemaFieldsOnly: true }) as T;
}