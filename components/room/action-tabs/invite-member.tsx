"use client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRoomQuery } from "../contexts/room-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Separator } from "@/components/ui/separator";
import { useConfirm } from "@/components/are-you-sure";

export function InviteMemberTab() {
    const { data: room } = useRoomQuery();
    const [isCopied, setIsCopied] = useState(false);
    const qrcodeRef = useRef<SVGSVGElement>(null);

    const inviteLink = room
        ? `${process.env.NEXT_PUBLIC_APP_ORIGIN}/room/join/${room._id}${
              room.isPrivate ? `?token=${room.inviteToken}` : ""
          }`
        : "";

    const handleCopy = async () => {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast.error("Sao chép liên kết thất bại");
        }
    };

    const handleShare = async () => {
        if (!inviteLink) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Mời tham gia phòng",
                    text: "Tham gia phòng của tôi bằng liên kết này:",
                    url: inviteLink,
                });
            } catch (error) {
                toast.error("Chia sẻ liên kết thất bại");
            }
        } else {
            toast.error("Trình duyệt không hỗ trợ chia sẻ");
        }
    };

    const handleDownloadQR = () => {
        try {
            const svg = qrcodeRef.current;

            if (!svg || svg.tagName.toLowerCase() !== "svg") {
                toast.error("Lỗi: không tìm thấy QRCode hợp lệ");
                return;
            }

            const title = room ? `Quét để tham gia phòng:` : "";
            const fileName = room ? `invite-qr-${room._id}` : "invite-qr";
            const size = 512; // Kích thước QR code

            // Clone và chuẩn bị SVG
            const clonedSvg = svg.cloneNode(true);

            // Tính toán kích thước canvas và padding
            const titleHeight = title ? Math.floor(size * 0.3) : 0; // 30% chiều cao cho title
            const titlePadding = Math.floor(size * 0.03); // 3% padding cho title
            const qrPadding = Math.floor(size * 0.08); // 8% padding xung quanh QR code
            const qrSize = size - qrPadding * 2; // Kích thước QR sau khi trừ padding
            const canvasHeight =
                size + titleHeight + (title ? titlePadding * 2 : 0);

            // Tạo canvas
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext("2d")!;

            // Tạo image từ SVG
            const img = new Image();
            const svgBlob = new Blob(
                [new XMLSerializer().serializeToString(clonedSvg)],
                { type: "image/svg+xml" }
            );
            const url = URL.createObjectURL(svgBlob);

            img.onload = function () {
                // Vẽ nền trắng
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, size, canvasHeight);

                let qrY = 0; // Vị trí Y của QR code

                // Vẽ title nếu có
                if (title) {
                    ctx.fillStyle = "#000000";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    // Tính font size phù hợp
                    const maxFontSize = Math.floor(titleHeight * 0.6);
                    let fontSize = maxFontSize;
                    ctx.font = `bold ${fontSize}px Arial, sans-serif`;

                    // Giảm font size nếu text quá dài
                    while (
                        ctx.measureText(title).width > size - qrPadding * 2 &&
                        fontSize > 12
                    ) {
                        fontSize -= 2;
                        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                    }

                    // Vẽ title
                    const titleY = titleHeight / 2 + qrPadding;
                    ctx.fillText(title, size / 2, titleY);
                    ctx.fillText(room.name, size / 2, titleY + 40); // Tên phòng cách title 40px

                    qrY = titleHeight + qrPadding;
                }

                // Vẽ QR code
                ctx.drawImage(img, qrPadding, qrY, qrSize, qrSize);

                // Chuyển canvas thành PNG và download
                canvas.toBlob(function (blob) {
                    const downloadUrl = URL.createObjectURL(blob!);
                    const downloadLink = document.createElement("a");
                    downloadLink.href = downloadUrl;
                    downloadLink.download = `${fileName}.png`;

                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    URL.revokeObjectURL(downloadUrl);
                    URL.revokeObjectURL(url);
                }, "image/png");
            };

            img.onerror = function () {
                toast.error("Lỗi: không thể tải hình ảnh QRCode");
            };

            img.src = url;
        } catch (error: any) {
            toast.error("Có lỗi xảy ra khi tải QR code: " + error?.message);
        }
    };

    async function handleCreateNewLink() {
        toast("Chức năng này đang được phát triển");
    }

    const confirmCreateNewLink = useConfirm(handleCreateNewLink, {
        title: "Bạn có chắc chắn muốn tạo liên kết mới?",
        description:
            "Khi tạo liên kết mới, các liên kết trước đó sẽ trở nên không hợp lệ nếu phòng bạn ở chế độ riêng tư",
        confirmText: "Tạo liên kết mới",
        cancelText: "Hủy",
        variant: "destructive",
    });

    return (
        <div className="w-full h-full bg-sidebar overflow-y-auto p-4 lg:p-6">
            <h2 className="text-lg font-semibold mb-4">Mời thành viên</h2>
            <Card>
                <CardHeader>
                    <CardDescription>
                        Gửi liên kết hoặc mã QR cho bạn bè để mời họ tham gia
                        phòng.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        onClick={(e) => e.currentTarget.select()}
                        readOnly
                        value={inviteLink}
                    />
                    <Button
                        className="mt-4 w-full"
                        disabled={isCopied || !inviteLink}
                        onClick={handleCopy}
                    >
                        {isCopied ? "✅ Đã sao chép" : "Sao chép liên kết"}
                    </Button>
                    {/* Share button */}
                    <Button
                        className="mt-4 w-full"
                        variant="outline"
                        disabled={!inviteLink}
                        onClick={handleShare}
                    >
                        Chia sẻ liên kết
                    </Button>

                    <div className="mt-6 flex justify-center">
                        <QRCodeSVG
                            ref={qrcodeRef}
                            width={128}
                            height={128}
                            value={inviteLink}
                        />
                    </div>

                    {/* Download QR button */}
                    <Button
                        className="mt-4 w-full"
                        disabled={!inviteLink}
                        onClick={handleDownloadQR}
                    >
                        Tải mã QR
                    </Button>
                    <Separator className="my-4" />
                    <Button
                        onClick={confirmCreateNewLink}
                        variant="destructive"
                        className="w-full"
                    >
                        Tạo liên kết mới
                    </Button>
                    <div className="text-muted-foreground text-xs mt-2">
                        Khi tạo liên kết mới, các liên kết trước đó sẽ trở nên
                        không hợp lệ nếu phòng bạn ở chế độ riêng tư
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
