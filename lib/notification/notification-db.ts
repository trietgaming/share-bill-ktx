"use client";

import { NotificationRecord } from "@/types/notification";
import Dexie, { EntityTable } from "dexie";

const notificationDb = new Dexie("NotificationDatabase") as Dexie & {
    notifications: EntityTable<
        NotificationRecord,
        "_id" // primary key "id" (for the typings only)
    >;
};

notificationDb.version(2).stores({
    notifications: "++_id, [userId+receivedAt], [userId+status+receivedAt]", // Primary key and indexed props
});

export { notificationDb };
