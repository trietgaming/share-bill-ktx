export function WebviewNotSupported() {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-4">
                <h3 className="font-semibold text-lg">
                    Ứng dụng không hỗ trợ WebView
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Vui lòng mở ứng dụng bằng trình duyệt để
                    sử dụng đầy đủ các tính năng.
                </p>
            </div>
        </div>
    );
}