const test = require("node:test");
const assert = require("node:assert/strict");
const createLoader = require("./load-ts.cjs");
require("fake-indexeddb/auto");

const load = createLoader();
const { calculateShare } = load("@/lib/utils");
const { InvoiceSplitMethod } = load("@/enums/invoice");
const { PresenceStatus: S } = load("@/enums/presence");
const { NotificationType: T, NotificationClickAction: A } = load("@/enums/notification");
const { createNotification } = load("@/lib/notification/notification-factory");
const { notificationTarget } = load("@/lib/notification/notification-target");

function invoice(overrides = {}) {
    return { roomId: "room", monthApplied: "2026-10", applyTo: ["a", "b"],
        amount: 620, splitMethod: InvoiceSplitMethod.BY_PRESENCE, ...overrides };
}
function presence(userId, days, overrides = {}) {
    return { roomId: "room", month: "2026-10", userId, presence: days, ...overrides };
}
function share(bill, userId, days = []) {
    return Array.from(calculateShare(bill, userId, days));
}
function payload(type = T.PRESENCE_REMINDER, overrides = {}) {
    return { messageId: "fcm-1", data: {
        type, roomId: "room", roomName: "101", month: "2026-10", day: "4",
        recipientId: "a", messageId: "event-1", invoiceId: "invoice",
        invoiceName: "Điện nước", invoiceAmount: "620", memberName: "Member",
        updateUserName: "Updater", deleteUserName: "Deleter", ...overrides,
    } };
}

test("unmarked days and entirely missing members are present and payable", () => {
    assert.deepEqual(share(invoice(), "a"), [310, true]);
    assert.deepEqual(share(invoice(), "b"), [310, true]);
    const days = [presence("a", Array(31).fill(S.UNDETERMINED))];
    assert.deepEqual(share(invoice(), "a", days), [310, true]);
    assert.deepEqual(share(invoice(), "b", days), [310, true]);
});

test("only explicit absence reduces a member's presence weight", () => {
    const days = [presence("a", [...Array(15).fill(S.ABSENT), ...Array(16).fill(S.UNDETERMINED)])];
    assert.deepEqual(share(invoice({ amount: 470 }), "a", days), [160, true]);
    assert.deepEqual(share(invoice({ amount: 470 }), "b", days), [310, true]);
});

test("a fully absent member owes zero; all absent members have no ratio", () => {
    const days = [presence("a", Array(31).fill(S.ABSENT))];
    assert.deepEqual(share(invoice(), "a", days), [0, true]);
    assert.deepEqual(share(invoice(), "b", days), [620, true]);
    days.push(presence("b", Array(31).fill(S.ABSENT)));
    assert.deepEqual(share(invoice(), "a", days), [0, false]);
});

test("month length, leap years and short legacy arrays use present defaults", () => {
    const bill = invoice({ monthApplied: "2024-02", amount: 570 });
    const days = [presence("a", [S.ABSENT], { month: "2024-02" })];
    assert.deepEqual(share(bill, "a", days), [280, true]);
    assert.deepEqual(share(bill, "b", days), [290, true]);
});

test("unrelated rooms, months and members do not affect shares", () => {
    const days = [presence("a", Array(31).fill(S.ABSENT), { roomId: "elsewhere" }),
        presence("a", Array(31).fill(S.ABSENT), { month: "2026-09" }),
        presence("outsider", Array(31).fill(S.PRESENT))];
    assert.deepEqual(share(invoice(), "a", days), [310, true]);
});

test("presence shares sum exactly to the invoice amount after rounding", () => {
    const bill = invoice({ amount: 100, applyTo: ["a", "b", "c"] });
    const amounts = bill.applyTo.map((user) => share(bill, user)[0]);
    assert.deepEqual(amounts, [34, 33, 33]);
    assert.equal(amounts.reduce((total, amount) => total + amount, 0), 100);
});

test("other split methods retain their behavior", () => {
    assert.deepEqual(share(invoice({ splitMethod: InvoiceSplitMethod.BY_EQUALLY }), "a"), [310, true]);
    assert.deepEqual(share(invoice({ splitMethod: InvoiceSplitMethod.BY_FIXED_AMOUNT, splitMap: { a: 200, b: 420 } }), "a"), [200, true]);
    assert.deepEqual(share(invoice({ splitMethod: InvoiceSplitMethod.BY_PERCENTAGE, splitMap: { a: 25, b: 75 } }), "a"), [155, true]);
});

test("every declared notification type has content, preserves data and opens a target", () => {
    for (const type of Object.values(T)) {
        const message = payload(type);
        const [title, options, additional] = createNotification(message);
        assert.notEqual(title, "Có cập nhật mới từ ShareBillKTX", type);
        assert.equal(options.data, message.data, type);
        assert.equal(additional.messageId, "event-1");
        assert.ok(notificationTarget(options.data).startsWith("/"));
        if (type === T.PRESENCE_REMINDER) {
            assert.deepEqual(Array.from(options.actions, (action) => action.action), [A.MARK_PRESENT, A.MARK_ABSENT]);
        }
    }
});

test("unknown and legacy notifications preserve data and sender overrides", () => {
    const message = payload("unknown", { title: "Custom title", body: "Custom body" });
    const [title, options] = createNotification(message);
    assert.equal(title, "Custom title");
    assert.equal(options.body, "Custom body");
    assert.equal(options.data, message.data);
    const [legacyTitle, legacyOptions] = createNotification({ ...payload(), notification: { title: "Legacy title" } });
    assert.equal(legacyTitle, "Legacy title");
    assert.equal(legacyOptions.actions.length, 2);
    assert.doesNotThrow(() => createNotification(payload("__proto__")));
});

test("removed rooms open home; presence and invoice messages open the right tab", () => {
    assert.equal(notificationTarget(payload(T.ROOM_DELETED).data), "/");
    assert.equal(notificationTarget(payload(T.KICKED_FROM_ROOM).data), "/");
    assert.equal(notificationTarget(payload().data), "/room/room/presence");
    assert.equal(notificationTarget(payload(T.NEW_INVOICE).data), "/room/room/invoices");
});

test("both presence actions reach the API and invalidate all presence queries", async () => {
    const requests = [], invalidations = [];
    const loader = createLoader({ "@/lib/query-client": {
        presenceQueryKey: (roomId) => ["presence", roomId],
        queryClient: { invalidateQueries: async (query) => invalidations.push(query.queryKey) },
    } }, { fetch: async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return { ok: true }; } });
    const { dispatchAction } = loader("@/lib/notification/action-dispatcher");
    await dispatchAction(A.MARK_PRESENT, payload().data, true);
    await dispatchAction(A.MARK_ABSENT, payload().data, true);
    assert.deepEqual(requests.map((request) => request.body.status), [S.PRESENT, S.ABSENT]);
    assert.equal(requests[0].body.recipientId, "a");
    assert.equal(requests[0].body.day, 4);
    assert.deepEqual(invalidations.map((key) => Array.from(key)), [["presence", "room"], ["presence", "room"]]);
});

test("API failure and unsupported actions reject so the notification is retryable", async () => {
    const loader = createLoader({ "@/lib/query-client": {} }, {
        fetch: async () => ({ ok: false, status: 401 }),
    });
    const { dispatchAction } = loader("@/lib/notification/action-dispatcher");
    await assert.rejects(dispatchAction(A.MARK_PRESENT, payload().data), /đăng nhập/);
    await assert.rejects(dispatchAction(A.MARK_ABSENT, payload(T.NEW_INVOICE).data), /không phù hợp/);
    await assert.rejects(dispatchAction("unknown", payload().data), /chưa được hỗ trợ/);
    await assert.rejects(dispatchAction(A.MARK_PRESENT, undefined), /thiếu dữ liệu/);
});

test("every declared type is handled in the foreground, including room removal", async () => {
    const invalidations = [], roomChanges = [], warnings = [];
    const loader = createLoader({ "@/lib/query-client": {
        queryClient: { invalidateQueries: async ({ queryKey }) => invalidations.push(queryKey) },
        invoicesQueryKey: (roomId) => ["invoices", roomId],
        paidInvoicesQueryKey: (roomId) => ["paid-invoices", roomId],
        presenceQueryKey: (roomId) => ["presence", roomId],
        userRoomsQueryKey: () => ["user-rooms"],
        invalidateAllRoomQuery: (roomId) => roomChanges.push(roomId),
    } }, { console: { log() {}, warn: (...args) => warnings.push(args) } });
    const { handleForegroundMessage } = loader("@/lib/notification/foreground-message-dispatcher");
    for (const type of Object.values(T)) await handleForegroundMessage(payload(type));
    assert.equal(warnings.length, 0);
    assert.equal(roomChanges.length, 4);
    assert.ok(invalidations.some((key) => key[0] === "presence"));
    assert.ok(invalidations.some((key) => key[0] === "user-rooms"));
});

test("IndexedDB saves one copy across worker/tabs, isolates accounts and honors persistence", async () => {
    const { notificationDb: db, storeNotification, removeActionNotification } = load("@/lib/notification/notification-db");
    try {
        await db.notifications.clear();
        const saved = await Promise.all([storeNotification(payload(), "a"), storeNotification(payload(), "a")]);
        assert.equal(saved.filter(Boolean).length, 1);
        assert.equal(await db.notifications.count(), 1);
        assert.equal(await storeNotification(payload(), "b"), false);
        assert.equal(await storeNotification(payload(T.NEW_INVOICE, { persistent: "false", messageId: "temporary" }), "a"), false);
        assert.equal(await storeNotification(payload(T.NEW_INVOICE, { recipientId: "b" }), "b"), true);
        assert.equal(await db.notifications.count(), 2);
        await removeActionNotification(payload().data);
        assert.equal(await db.notifications.count(), 1);
        assert.equal((await db.notifications.toArray())[0].userId, "b");
    } finally { await db.delete(); }
});

test("timestamp ties do not skip notifications on subsequent pages", async () => {
    const { notificationDb: db, getNotificationPage } = load("@/lib/notification/notification-db");
    try {
        await db.open();
        const records = Array.from({ length: 45 }, (_, i) => ({
            title: String(i), data: {}, status: "unread", receivedAt: 1000,
            messageId: String(i), userId: "a",
        }));
        await db.notifications.bulkAdd(records);
        const ids = [];
        let cursor = null;
        do {
            const { items, nextCursor } = await getNotificationPage("a", cursor);
            ids.push(...items.map((item) => item._id));
            cursor = nextCursor;
        } while (cursor);
        assert.equal(ids.length, 45);
        assert.equal(new Set(ids).size, 45);
    } finally { await db.delete(); }
});

test("background messages are stored and displayed with all tabs closed", async () => {
    const stored = [], shown = [];
    const loader = createLoader({ "@/lib/notification/notification-db": {
        storeNotification: async (...args) => stored.push(args),
    } }, { self: { clients: { matchAll: async () => [] },
        registration: { showNotification: async (...args) => shown.push(args) } } });
    await loader("@/sw/handle-background-message").handleBackgroundMessage(payload());
    assert.equal(stored[0][1], "a");
    assert.equal(shown.length, 1);
    assert.equal(shown[0][1].actions.length, 2);
});

test("background persistence failures do not suppress OS notification or client delivery", async () => {
    const forwarded = [], shown = [];
    const loader = createLoader({ "@/lib/notification/notification-db": {
        storeNotification: async () => { throw new Error("disk unavailable"); },
    } }, { console: { log() {}, error() {} }, self: {
        clients: { matchAll: async () => [{ visibilityState: "hidden", postMessage: (data) => forwarded.push(data) }] },
        registration: { showNotification: async (...args) => shown.push(args) },
    } });
    await loader("@/sw/handle-background-message").handleBackgroundMessage(payload());
    assert.equal(forwarded.length, 1);
    assert.equal(shown.length, 1);
});

function clickEvent(action, data) {
    return { action, notification: { data, close() {} }, stopImmediatePropagation() {},
        waitUntil(promise) { this.done = promise; } };
}

test("worker action keeps the event alive through API, cleanup and UI refresh", async () => {
    const calls = [];
    let complete;
    const pending = new Promise((resolve) => { complete = resolve; });
    const loader = createLoader({
        "@/lib/notification/action-dispatcher": { dispatchAction: async () => { calls.push("action"); await pending; } },
        "@/lib/notification/notification-db": { removeActionNotification: async () => calls.push("cleanup") },
    }, { self: { clients: { matchAll: async () => [{ postMessage: (data) => calls.push(data.type) }] } } });
    const event = clickEvent(A.MARK_PRESENT, payload().data);
    loader("@/sw/handle-notification-click").handleNotificationClick(event);
    assert.equal(typeof event.done.then, "function");
    assert.deepEqual(calls, ["action"]);
    complete();
    await event.done;
    assert.deepEqual(calls, ["action", "cleanup", "NOTIFICATION_ACTION_COMPLETED"]);
});

test("failed worker action retains a retryable notification and does not delete it", async () => {
    const shown = [];
    const loader = createLoader({
        "@/lib/notification/action-dispatcher": { dispatchAction: async () => { throw new Error("offline"); } },
        "@/lib/notification/notification-db": { removeActionNotification: async () => assert.fail("must retain notification") },
    }, { console: { error() {} }, self: {
        registration: { showNotification: async (...args) => shown.push(args) },
    } });
    const event = clickEvent(A.MARK_ABSENT, payload().data);
    loader("@/sw/handle-notification-click").handleNotificationClick(event);
    await event.done;
    assert.equal(shown[0][1].body, "offline");
    assert.equal(shown[0][1].actions.length, 2);
});

test("body clicks on legacy notifications navigate and focus the correct page", async () => {
    const navigations = [];
    const loader = createLoader({ "@/lib/notification/notification-db": {} }, { self: {
        location: { origin: "https://app.example" },
        clients: { matchAll: async () => [{ url: "https://app.example/", navigate: async (url) => navigations.push(url), focus: async () => navigations.push("focus") }] },
    } });
    const event = clickEvent("", { FCM_MSG: { data: payload(T.UPDATE_INVOICE).data } });
    loader("@/sw/handle-notification-click").handleNotificationClick(event);
    await event.done;
    assert.deepEqual(navigations, ["https://app.example/room/room/invoices", "focus"]);
});

test("room deletion notification uses the saved room instead of querying a deleted document", async () => {
    let sent;
    const loader = createLoader({
        "@/models/Room": { Room: { findById: () => assert.fail("room already deleted") } },
        "@/models/UserData": { UserData: {
            find: () => ({ lean: async () => [{ _id: "a", fcmTokens: ["token"] }, { _id: "admin", fcmTokens: ["admin-token"] }] }),
            findById: () => ({ lean: async () => ({ displayName: "Admin" }) }),
        } },
        "@/lib/notify": { notifyUsers: async (users, options) => { sent = { users, options }; } },
    });
    await loader("@/lib/messages/room").sendRoomDeletedNotification("admin", { _id: "room", name: "101", members: ["a", "admin"] });
    assert.equal(sent.users.length, 1);
    assert.equal(sent.options.data.type, T.ROOM_DELETED);
    assert.equal(sent.options.data.roomId, "room");
});

test("all recipients are awaited and retried with a stable event ID", async () => {
    const sends = [], waiting = [];
    let failures = 0;
    const loader = createLoader({
        "server-only": {}, "./firebase/admin": { adminApp: {} }, "@/models/UserData": {},
        "./utils": { delay: async () => {} },
        "firebase-admin/messaging": { FirebaseMessagingError: Error, MessagingClientErrorCode: {}, getMessaging: () => ({
            sendEachForMulticast: async (message) => {
                sends.push(message);
                if (message.tokens[0] === "retry" && failures++ === 0) throw new Error("temporary failure");
                await new Promise((resolve) => waiting.push(resolve));
                return { responses: [{ success: true }] };
            },
        }) },
    });
    const { notifyUsers } = loader("@/lib/notify");
    let done = false;
    const work = notifyUsers([{ _id: "a", fcmTokens: ["first"] }, { _id: "b", fcmTokens: ["retry"] }],
        { notification: { title: "Custom" }, data: { type: T.NEW_INVOICE } }).then(() => { done = true; });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(done, false);
    assert.equal(sends.length, 3);
    assert.equal(sends[1].data.messageId, sends[2].data.messageId);
    assert.equal(sends[2].data.recipientId, "b");
    assert.equal(sends[0].notification, undefined);
    assert.equal(sends[0].data.title, "Custom");
    waiting.forEach((resolve) => resolve());
    await work;
    assert.equal(done, true);
});

function notificationInitializer(subscribe) {
    const values = new Map();
    const permission = { permission: "granted" };
    const registration = {};
    const loader = createLoader({
        "firebase/messaging": { getToken: async () => "token" },
        "../firebase/client": { firebaseMessaging: {} },
        "../actions/notification": { subscribeToNotification: subscribe },
    }, {
        window: { Notification: permission }, Notification: permission,
        navigator: { serviceWorker: { register: async () => registration, ready: Promise.resolve(registration) } },
        localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
        process: { env: {} },
    });
    return { values, initialize: loader("@/lib/notification/notification").initializeNotification };
}

test("failed token subscription does not cache success and can retry", async () => {
    let attempts = 0;
    const { initialize, values } = notificationInitializer(async () => {
        if (attempts++ === 0) throw new Error("offline");
        return { error: null, data: undefined };
    });
    await assert.rejects(initialize("a"), /offline/);
    assert.equal(values.size, 0);
    await initialize("a");
    assert.equal(attempts, 2);
    assert.equal(values.size, 0);
});

test("every initialization reconciles tokens with the server, including account switches", async () => {
    let attempts = 0;
    const { initialize } = notificationInitializer(async () => { attempts++; return { error: null, data: undefined }; });
    await initialize("a");
    await initialize("b");
    await initialize("a");
    await initialize("a");
    assert.equal(attempts, 4);
});

function presenceApi(user) {
    const saved = [], invalidated = [];
    class MonthPresence {
        constructor(data) { Object.assign(this, data); }
        static async findOne() { return null; }
        async save() { saved.push(this); }
    }
    const loader = createLoader({
        "@/lib/firebase/server": { getAuthenticatedUser: async () => user },
        "@/models/Membership": { Membership: { findOne: () => ({ lean: async () => ({}) }) } },
        "@/models/MonthPresence": { MonthPresence },
        "@/lib/db-connect": { ensureDbConnection: async () => {} },
        "next/cache": { revalidateTag: (tag) => invalidated.push(tag) },
        "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    });
    return { POST: loader("@/app/api/presence/route").POST, saved, invalidated };
}

test("presence endpoint rejects expired sessions, another recipient and invalid calendar days", async () => {
    const body = { roomId: "room", month: "2026-02", day: 27, status: S.PRESENT, recipientId: "a" };
    const request = (data) => ({ json: async () => data });
    assert.equal((await presenceApi(null).POST(request(body))).status, 401);
    assert.equal((await presenceApi({ uid: "b" }).POST(request(body))).status, 403);
    assert.equal((await presenceApi({ uid: "a" }).POST(request({ ...body, day: 28 }))).status, 400);
    const { POST, saved, invalidated } = presenceApi({ uid: "a" });
    assert.equal((await POST(request(body))).status, 200);
    assert.equal(saved[0].presence.length, 28);
    assert.equal(saved[0].presence[27], S.PRESENT);
    assert.ok(invalidated.includes("room-month-presence-room-2026-02"));
});

test("custom notification click listener is installed before Firebase's listener", () => {
    const listeners = [];
    const loader = createLoader({
        "firebase/app": { initializeApp: () => ({}) },
        "firebase/messaging/sw": { getMessaging: () => { listeners.push("firebase-click"); return {}; }, onBackgroundMessage() {} },
        "@/lib/firebase/config": { firebaseConfig: {} },
        "@/sw/handle-background-message": { handleBackgroundMessage() {} },
        "@/sw/handle-notification-click": { handleNotificationClick() {} },
    }, { self: { __WB_MANIFEST: [], addEventListener: (type) => listeners.push(type) } });
    loader("@/firebase-messaging-sw");
    assert.ok(listeners.indexOf("notificationclick") < listeners.indexOf("firebase-click"));
});

test("version 2 notification records survive the IndexedDB upgrade", async () => {
    const Dexie = require("dexie").default;
    const legacy = new Dexie("NotificationDatabase");
    legacy.version(2).stores({ notifications: "++_id, [userId+receivedAt], [userId+status+receivedAt]" });
    await legacy.table("notifications").add({ title: "Legacy", data: {}, userId: "a", receivedAt: 1, status: "unread" });
    legacy.close();
    const { notificationDb: db, getNotificationPage } = load("@/lib/notification/notification-db");
    try {
        await db.open();
        const { items } = await getNotificationPage("a");
        assert.equal(items.length, 1);
        assert.equal(items[0].title, "Legacy");
    } finally { await db.delete(); }
});

function notificationList(dispatchAction) {
    const removed = [], errors = [];
    const [title, options, additional] = createNotification(payload());
    const notification = { _id: 1, userId: "a", title, ...options, ...additional };
    const loader = createLoader({
        react: { useState: (value) => [value, () => {}], useRef: (value) => ({ current: value }) },
        "@/components/ui/button": { Button: "button" },
        "@/components/ui/dropdown-menu": {}, "@/components/ui/badge": {},
        "lucide-react": { Bell: "bell", X: "x" }, "next/image": "image",
        "next/navigation": { useRouter: () => ({ push() {} }) },
        "./notification-context": { useNotification: () => ({
            notifications: [notification], notificationQuery: {},
            removeNotification: async (id) => removed.push(id), markNotificationRead: async () => {},
        }) },
        "@/lib/notification/notification": {},
        "@/lib/notification/action-dispatcher": { dispatchAction },
        sonner: { toast: { error: (message) => errors.push(message) } },
    });
    const tree = loader("@/components/notification-dropdown").NotificationList();
    const buttons = [];
    function walk(node) {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node?.props) return;
        if (node.type === "button") buttons.push(node);
        walk(node.props.children);
    }
    walk(tree);
    return { buttons, removed, errors };
}

test("notification UI blocks conflicting double clicks until the action completes", async () => {
    let calls = 0, complete;
    const pending = new Promise((resolve) => { complete = resolve; });
    const { buttons, removed } = notificationList(async () => { calls++; await pending; });
    const work = buttons.find((button) => button.props.children === "Có mặt").props.onClick();
    await buttons.find((button) => button.props.children === "Vắng mặt").props.onClick();
    assert.equal(calls, 1);
    assert.equal(removed.length, 0);
    complete();
    await work;
    assert.deepEqual(removed, [1]);
});

test("notification UI retains a failed action and allows another attempt", async () => {
    let calls = 0;
    const { buttons, removed, errors } = notificationList(async () => { calls++; throw new Error("offline"); });
    const click = buttons.find((button) => button.props.children === "Có mặt").props.onClick;
    await click();
    await click();
    assert.equal(calls, 2);
    assert.equal(removed.length, 0);
    assert.deepEqual(errors, ["offline", "offline"]);
});

function paymentAction(monthPresences) {
    const bill = { ...invoice(), _id: "invoice", payInfo: [], save: async () => {} };
    const loader = createLoader({
        "@/lib/prechecks/auth": {},
        "@/lib/prechecks/room": { _verifyMembership: async () => {} },
        "@/models/Invoice": { Invoice: { findById: () => ({ session: async () => bill }) } },
        "@/models/MonthPresence": { MonthPresence: { find: () => ({ session: async () => monthPresences }) } },
        "@/models/Room": {}, "@/lib/messages/invoice": {},
        "@/lib/serializer": { serializeDocument: (document) => document },
        "../actions-helper": { serverAction: (options) => options.fn },
        mongoose: { startSession: async () => ({ withTransaction: async (fn) => fn() }) },
        "next/cache": { revalidateTag() {} },
        "@/lib/actions/room-activity": { logRoomActivity: async () => {} },
    });
    return { bill, pay: loader("@/lib/actions/invoice").payInvoice };
}

test("server payment accepts an invoice before anyone has marked presence", async () => {
    const { bill, pay } = paymentAction([]);
    await pay({ user: { uid: "a" } }, "invoice", 310);
    assert.equal(bill.payInfo.length, 1);
    assert.equal(bill.payInfo[0].amount, 310);
});

test("server payment does not create a zero-amount payment for an absent member", async () => {
    const { bill, pay } = paymentAction([presence("a", Array(31).fill(S.ABSENT))]);
    await assert.rejects(pay({ user: { uid: "a" } }, "invoice", 310), /không có phần tiền/);
    assert.equal(bill.payInfo.length, 0);
});

test("token subscription uses a conditional atomic push instead of overwriting the device list", async () => {
    const updates = [];
    const loader = createLoader({
        "@/lib/prechecks/auth": {},
        "@/lib/user-data": { getUserData: async () => ({}) },
        "@/lib/actions-helper": { serverAction: (options) => options.fn },
        "@/models/UserData": { MAX_FCM_TOKENS: 5, UserData: {
            updateMany: async (...args) => updates.push(args),
            updateOne: async (...args) => updates.push(args),
        } },
    });
    await loader("@/lib/actions/notification").subscribeToNotification({ user: { uid: "a" } }, "token");
    assert.equal(updates[0][0]._id.$ne, "a");
    assert.equal(updates[1][0].fcmTokens.$ne, "token");
    assert.equal(updates[1][1].$push.fcmTokens.$each[0], "token");
    assert.equal(updates[1][1].$push.fcmTokens.$slice, -5);
});
