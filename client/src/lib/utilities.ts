import { TokenInfo } from '@solana/spl-token-registry';

import { Burnable } from './Types';

export async function fetchWithRetry(
    url: string,
    retries: number = 3,
    timeout: number = 10000) {

    let fails = 0;

    while (true) {
        const controller = new AbortController();

        setTimeout(() => {
            controller.abort();
        }, 1000 * 10);

        try {
            const res = await fetch(url, {
                signal: controller.signal,
            });

            const text = await res.text();

            try {
                const data = JSON.parse(text);

                return {
                    success: true,
                    data,
                }
            } catch (err) {
                return {
                    success: false,
                    error: `Failed to parse JSON: ${text}`,
                };
            }
        } catch (err) {
            fails++;

            if (fails > 3) {
                return {
                    success: false,
                    error: 'Timed out',
                };
            }
        }
    }
}

export function getImage(nft: Burnable, tokenMap: Map<string, TokenInfo>) {
    const n = (nft as any);

    if (n.image) {
        return n.image;
    }

    const token = tokenMap.get(nft.mint);

    if (token) {
        return token.logoURI;
    }

    return '';
}

export function formatTokenAmount(amount: number, forceHuman: boolean) {
    if (amount % 1 === 0) {
        return amount;
    }

    if (forceHuman) {
        const regex = /(?:^0.0*)?(.+)/;
        const [ formatted ] = (amount.toString().match(regex) || []);

        if (formatted) {
            return formatted;
        }
    }

    if (amount > 0.01) {
        return amount.toFixed(2);
    }

    if (amount > 0.000001) {
        return amount.toFixed(6);
    }

    return '< 0.000001';
}

export function getNameOnly(nft: Burnable, tokenMap: Map<string, TokenInfo>) {
    const n = (nft as any);

    if (n.name) {
        return n.name;
    }

    const token = tokenMap.get(nft.mint);

    if (token) {
        return token.name;
    }

    return nft.mint.toString();
}

export function getName(nft: Burnable, tokenMap: Map<string, TokenInfo>, forceHuman: boolean) {
    const n = (nft as any);

    const amount = nft.uiAmount || nft.count;

    if (!amount) {
        return '';
    }

    if (n.name) {
        if (nft.count === 1) {
            return n.name;
        } else {
            return `${formatTokenAmount(amount, forceHuman)} ${n.name}`;
        }
    }

    const token = tokenMap.get(nft.mint);

    if (token) {
        return `${formatTokenAmount(amount, forceHuman)} ${token.name}`;
    }

    return `${formatTokenAmount(amount, forceHuman)} ${nft.mint.toString()}`;
}
