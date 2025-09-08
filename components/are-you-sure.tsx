"use client";
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { AlertTriangle, X } from "lucide-react";
import { useState, useCallback, useContext, createContext } from "react";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConfirmModalContext {
    showConfirmModal: (options: ConfirmOptions) => void;
}

const ConfirmModalContext = createContext<ConfirmModalContext>({} as ConfirmModalContext);

interface ConfirmOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    dontAskAgainKey?: string;
    onConfirm?: (...args: any[]) => void | null;
    onCancel?: (() => void) | null;
}

interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: 'default' | 'destructive';
    dontAskAgainKey?: string;
    onConfirm: (...args: any[]) => void;
    onCancel: (() => void) | null;
}

const defaultConfirmOptions = {
    title: 'Bạn có chắc chắn?',
    description: 'Hành động này không thể hoàn tác. Bạn có muốn tiếp tục?',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
};

// Provider component
export const ConfirmModalProvider = ({ children }: { children: React.ReactNode }) => {
    const [modalState, setModalState] = useState<ConfirmModalState>({
        isOpen: false,
        title: '',
        description: '',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        variant: 'default',
        onConfirm: () => { },
        onCancel: () => setModalState(prev => ({ ...prev, isOpen: false })),
    });

    const showConfirmModal = useCallback((options: ConfirmOptions) => {
        return setModalState({
            isOpen: true,
            title: options.title || defaultConfirmOptions.title,
            description: options.description || defaultConfirmOptions.description,
            confirmText: options.confirmText || defaultConfirmOptions.confirmText,
            cancelText: options.cancelText || defaultConfirmOptions.cancelText,
            variant: options.variant || "default",
            dontAskAgainKey: options.dontAskAgainKey,
            onConfirm: () => {
                setModalState(prev => ({ ...prev, isOpen: false }));
                options.onConfirm?.();
            },
            onCancel: () => {
                setModalState(prev => ({ ...prev, isOpen: false }));
                options.onCancel?.();
            },
        });
    }, []);

    return (
        <ConfirmModalContext.Provider value={{ showConfirmModal }}>
            {children}
            <GlobalConfirmModal modalState={modalState} />
        </ConfirmModalContext.Provider>
    );
};

export function useConfirm<T extends (...args: any[]) => void>(onConfirmFn: T, options: ConfirmOptions) {
    const context = useContext(ConfirmModalContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmModalProvider');
    }

    const dontAskAgain = options.dontAskAgainKey && localStorage.getItem(`dont-ask-again-${options.dontAskAgainKey}`) === 'true';

    return dontAskAgain ? onConfirmFn : (...args: Parameters<T>) => {
        context.showConfirmModal({
            ...options,
            onConfirm: () => {
                onConfirmFn(...args);
            }
        });

    };
};

// Global Modal Component
const GlobalConfirmModal = ({ modalState }: { modalState: ConfirmModalState }) => {
    const [dontAskAgain, setDontAskAgain] = useState(false);

    const handleConfirm = () => {
        if (modalState.onConfirm) {
            modalState.onConfirm();
            if (modalState.dontAskAgainKey && dontAskAgain) {
                localStorage.setItem(`dont-ask-again-${modalState.dontAskAgainKey}`, 'true');
            }
        }
        setDontAskAgain(false); // Reset state
    };

    const handleCancel = () => {
        if (modalState.onCancel) {
            modalState.onCancel();
            if (modalState.dontAskAgainKey && dontAskAgain) {
                localStorage.setItem(`dont-ask-again-${modalState.dontAskAgainKey}`, 'true');
            }
        }
        setDontAskAgain(false); // Reset state
    };

    const iconColor = modalState.variant === "destructive" ? "text-red-500" : "text-yellow-500";

    return (
        <Dialog open={modalState.isOpen} onOpenChange={handleCancel}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
                        <DialogTitle>{modalState.title}</DialogTitle>
                    </div>
                </DialogHeader>
                <p className="text-gray-600 leading-relaxed">{modalState.description}</p>

                {modalState.dontAskAgainKey && (
                    <div className="flex items-center gap-2 mt-4">
                        <Input
                            type="checkbox"
                            id="dontAskAgain"
                            checked={dontAskAgain}
                            onChange={(e) => setDontAskAgain(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="dontAskAgain" className="text-sm text-gray-600">
                            Không hỏi lại lần sau
                        </label>
                    </div>
                )}
                <DialogFooter>
                    <Button
                        onClick={handleCancel}
                        variant={"outline"}
                    >
                        {modalState.cancelText}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant={modalState.variant}
                    >
                        {modalState.confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};