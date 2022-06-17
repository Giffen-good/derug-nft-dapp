import React from 'react';
import {
    useWallet,
} from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_URL } from '../lib/Constants';
import {
    getTokenAccounts,
    getMetadataAddresses,
    getMetadataAccounts,
} from '../lib/LoadWalletData';
import { WalletLoadingAnimation } from './WalletLoadingAnimation';
import { WalletContents } from './WalletContents';
import { Burnable, BurnMode } from '../lib/Types';

export function WalletManager() {
    const {
        publicKey,
    } = useWallet();

    const [loading, setLoading] = React.useState(true);
    const [nftCount, setNftCount] = React.useState<number | null>(null);
    const [statusText, setStatusText] = React.useState<string | null>(null);

    const [nfts, setNfts] = React.useState<Burnable[]>([]);
    const [burnMode] = React.useState<BurnMode>(BurnMode.BurnNfts);

    async function loadWalletContents(key: PublicKey) {


        const connection = new Connection(RPC_URL, {
            confirmTransactionInitialTimeout: 10 * 1000,
        });

        const tokenMints = await getTokenAccounts(connection, key);

        setStatusText('Looking up token metadata addresses...');

        setNftCount(tokenMints.length);

        const metadataAddresses = await getMetadataAddresses(
            connection,
            tokenMints,
        );

        if (metadataAddresses.length !== tokenMints.length) {
            setNftCount(metadataAddresses.length);
        }

        setStatusText('Loading token on chain metadata...');

        const nftData = await getMetadataAccounts(
            connection,
            metadataAddresses,
            setStatusText,
        );

        if (nftData.length !== nftCount) {
            setNftCount(nftData.length);
        }

        setNfts(nftData);
        setStatusText('Loading complete.');
        setLoading(false);
    }

    React.useEffect(() => {
        if (!publicKey) {
            return;
        }

        loadWalletContents(publicKey);
    }, [publicKey]);


    const contents = React.useMemo(() => {
        if (burnMode === BurnMode.BurnNfts) {
            return (
                <WalletContents
                    nfts={nfts}
                    setNfts={(setNfts as any)}
                    burnMode={burnMode}
                />
            );
        }
    }, [
        burnMode,
        nfts,
    ]);

    if (!publicKey) {
        return null;
    }

    if (loading) {
        return (
            <WalletLoadingAnimation
                nftCount={nftCount}
                statusText={statusText}
            />
        );
    }

    return (
        <div>
            {contents}
        </div>
    );
}
