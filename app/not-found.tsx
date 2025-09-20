import Link from "next/link";

// Not found page
export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-6xl font-bold">404</h1>
            <p className="text-2xl mt-4">Trang không tồn tại</p>
            <Link href="/" className="mt-6 text-blue-500 hover:underline">
                Quay về trang chủ
            </Link>
        </div>
    );
}
