import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import Image from "next/image";

interface BankInfo {
    id: string;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
}

export function BankSelect({ ...props }: React.ComponentProps<typeof Select>) {
    const { data: banks, isLoading } = useQuery({
        queryKey: ['banks'],
        queryFn: async () => {
            const res = await fetch('https://api.vietqr.io/v2/banks', {
                "priority": "low"
            });
            const data = (await res.json()).data as BankInfo[];
            return data;
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        retry: false,
    })


    if (isLoading) {
        return <Skeleton className="h-10 w-full rounded-md" />;
    }

    return (
        <Select {...props}>
            <SelectTrigger>
                <SelectValue placeholder="Chọn ngân hàng" />
            </SelectTrigger>
            <SelectContent>
                {banks?.map(bank => {
                    return (
                        <SelectItem key={bank.id} value={bank.shortName}>
                            <div className="flex items-center">
                                <Image quality={40} fetchPriority="low" width={40} height={32} src={bank.logo} alt={bank.shortName} className="mr-2 object-contain" />
                                <span>{bank.shortName}</span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    )
}