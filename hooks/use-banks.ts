import { useQuery } from "@tanstack/react-query";

interface BankInfo {
    id: string;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
}

export function useBanks() {
    const query = useQuery({
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
    });

    const getBankLogoByShortName = (shortName: string) => {
        return query.data?.find(bank => bank.shortName === shortName)?.logo;
    }

    return {
        query,
        getBankLogoByShortName
    };
}