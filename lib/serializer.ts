import mongoose from "mongoose";

export function serializeDocument<T extends any>(doc: mongoose.Document | mongoose.Document[]): T {
    if (Array.isArray(doc)) {
        return doc.map(d => serializeDocument(d)) as unknown as T;
    }
    return doc.toJSON ? doc.toJSON({ "flattenObjectIds": true, virtuals: true, schemaFieldsOnly: true }) as T : doc as T;
}