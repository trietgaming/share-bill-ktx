import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import Image from "next/image";
import { useBanks } from "@/hooks/use-banks";

export function BankSelect({ ...props }: React.ComponentProps<typeof Select>) {
    const { data: banks, isLoading } = useBanks().query;


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