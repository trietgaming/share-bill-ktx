import mongoose from "mongoose";

export function serializeDocument<T extends any>(
    doc: mongoose.Document | mongoose.Document[],
    options?: mongoose.ToObjectOptions
): T {
    if (Array.isArray(doc)) {
        return doc.map((d) => serializeDocument(d, options)) as unknown as T;
    }
    return doc.toJSON
        ? (doc.toJSON({
              /// @ts-ignore
              flattenObjectIds: true,
              virtuals: true,
              schemaFieldsOnly: true,
              /// @ts-ignore
              flattenMaps: true,
              ...options,
          }) as T)
        : (doc as T);
}
