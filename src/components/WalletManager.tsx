import React from 'react';
import {
    useWallet,
} from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TokenListProvider, TokenInfo, ENV } from '@solana/spl-token-registry';

import { RPC_URL } from '../lib/Constants';
import {
    getTokenAccounts,
    getMetadataAddresses,
    getMetadataAccounts,
    getMetadata,
} from '../lib/LoadWalletData';
import { WalletLoadingAnimation } from './WalletLoadingAnimation';
import { WalletContents } from './WalletContents';
import { Burnable, Metadata, Mint, BurnMode } from '../lib/Types';
import { getNameOnly } from '../lib/utilities';

export interface WalletManagerProps {
}

export interface TabHeaderProps {
    onClick: () => void;
    selected: boolean;
    header?: string;
    headerComponent?: React.ReactElement;
}

export interface HeaderProps {
    onClick: () => void;
    selected: boolean;
}

export interface UnknownTokenProps {
    setAcceptedDisclaimer: (val: boolean) => void;
}

function UnknownTokenDisclaimer(props: UnknownTokenProps) {
    const {
        setAcceptedDisclaimer,
    } = props;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70%', height: '380px' }}>
            <span
                style={{
                    fontSize: '26px',
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '30px',
                }}
            >
                WARNING: Unknown tokens could be NFTs, whitelist tokens, or other valuable items. If you do not know what a token is, do NOT burn it.
            </span>

            <span
                style={{
                    marginTop: '30px',
                    fontSize: '26px',
                    color: 'white',
                    textAlign: 'center',
                }}
            >
                By using this advanced feature, you acknowledge that you know what you are burning, and accept any and all responsibility for the unknown tokens you burn.
            </span>

            <button
                style={{
                    marginTop: '30px',
                    color: 'white',
                    backgroundColor: 'rgb(255, 97, 99)',
                    width: '200px',
                    height: '50px',
                    fontSize: '26px',
                    border: 'none',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                }}
                onClick={() => setAcceptedDisclaimer(true)}
            >
                Confirm
            </button>
        </div>
    );
}

function UnknownHeader(props: HeaderProps) {
    const {
        onClick,
        selected,
    } = props;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
                style={{
                    fontSize: '15px',
                    color: selected ? 'rgb(255, 97, 99)' : 'white',
                    textTransform: 'uppercase',
                    overflow: 'hidden',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '5px',
                }}
                onClick={onClick}
            >
                For Advanced Users
            </span>

            <span
                style={{
                    fontSize: '30px',
                    color: selected ? 'rgb(255, 97, 99)' : 'white',
                    textTransform: 'uppercase',
                    overflow: 'hidden',
                    textAlign: 'center',
                    cursor: 'pointer',
                }}
                onClick={onClick}
            >
                Burn Unknown Tokens
            </span>
        </div>
    );
}

function TabHeader(props: TabHeaderProps) {
    const {
        onClick,
        selected,
        header,
        headerComponent
    } = props;

    const text = React.useMemo(() => {
        if (headerComponent) {
            return headerComponent;
        }

        return (
            <span
                style={{
                    fontSize: '30px',
                    color: selected ? 'rgb(255, 97, 99)' : 'white',
                    textTransform: 'uppercase',
                    overflow: 'hidden',
                    textAlign: 'center',
                    cursor: 'pointer',
                }}
                onClick={onClick}
            >
                {header}
            </span>
        );
    }, [header, headerComponent, onClick, selected]);

    return (
        <div
            style={{ display: 'flex', justifyContent: 'center', width: '100%', cursor: 'pointer' }}
            onClick={onClick}
        >
            {text}
        </div>
    );
}

export function WalletManager(props: WalletManagerProps) {
    const {
        publicKey,
    } = useWallet();

    const [loading, setLoading] = React.useState(true);
    const [nftCount, setNftCount] = React.useState<number | null>(null);
    const [nftsLoaded, setNftsLoaded] = React.useState<number>(0);
    const [statusText, setStatusText] = React.useState<string | null>(null);

    const [nfts, setNfts] = React.useState<Metadata[]>([]);
    const [unknownTokens, setUnknownTokens] = React.useState<Mint[]>([]);
    const [knownTokens, setKnownTokens] = React.useState<Mint[]>([]);
    const [tokenMap, setTokenMap] = React.useState<Map<string, TokenInfo>>(new Map());
    console.log(BurnMode)
    const [burnMode, setBurnMode] = React.useState<BurnMode>(BurnMode.BurnNfts);

    const [acceptedDisclaimer, setAcceptedDisclaimer] = React.useState<boolean>(false);

    async function loadWalletContents(key: PublicKey) {
        const tokenList = (await new TokenListProvider().resolve()).filterByChainId(ENV.MainnetBeta).getList();

        const map = tokenList.reduce((map, item) => {
            map.set(item.address, item);
            return map;
        }, new Map<string, TokenInfo>());

        setTokenMap(map);

        setStatusText('Loading token accounts...');

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

        const metadataAccounts = await getMetadataAccounts(
            connection,
            metadataAddresses,
            setStatusText,
        );

        if (metadataAccounts.length !== metadataAddresses.length) {
            setNftCount(metadataAccounts.length);
        }

        setStatusText('Loading token metadata...');

        const { tokens, nfts: nftData } = await getMetadata(
            metadataAccounts,
            setStatusText,
            setNftsLoaded,
        );

        nftData.sort((a, b) => getNameOnly(a, map).localeCompare(getNameOnly(b, map)));

        setNfts(nftData);

        const discovered: Set<string> = new Set((tokens as Burnable[]).concat(nftData as Burnable[]).map((m) => m.mint));

        const knownTokenAccs: Mint[] = tokens;
        const unknownTokenAccs = [];

        for (const token of tokenMints) {
            if (!discovered.has(token.mint)) {
                const tokenData = map.get(token.mint);

                if (tokenData) {
                    console.log(`Fetched token data for ${tokenData.name}...`);
                    knownTokenAccs.push(token);
                } else {
                    console.log(`Failed to find token data for ${token.mint}...`);
                    unknownTokenAccs.push(token);
                }
            }
        }

        setKnownTokens(knownTokenAccs.sort((a, b) => getNameOnly(a, map).localeCompare(getNameOnly(b, map))));
        setUnknownTokens(unknownTokenAccs);

        setStatusText('Loading complete.');

        setLoading(false);
    }

    React.useEffect(() => {
        if (!publicKey) {
            return;
        }

        loadWalletContents(publicKey);
    }, [publicKey]);

    const setBurnNfts = setBurnMode.bind(null, BurnMode.BurnNfts);
    const setBurnKnownTokens = setBurnMode.bind(null, BurnMode.BurnKnownTokens);
    const setBurnUnknownTokens = setBurnMode.bind(null, BurnMode.BurnUnknownTokens);

    const contents = React.useMemo(() => {
        if (burnMode === BurnMode.BurnNfts) {
            return (
                <WalletContents
                    nfts={nfts}
                    setNfts={(setNfts as any)}
                    tokenMap={tokenMap}
                    burnMode={burnMode}
                />
            );
        }

        if (burnMode === BurnMode.BurnKnownTokens) {
            return (
                <WalletContents
                    nfts={knownTokens}
                    setNfts={(setKnownTokens as any)}
                    tokenMap={tokenMap}
                    burnMode={burnMode}
                />
            );
        }

        if (burnMode === BurnMode.BurnUnknownTokens) {
            if (!acceptedDisclaimer) {
                return (
                    <UnknownTokenDisclaimer
                        setAcceptedDisclaimer={setAcceptedDisclaimer}
                    />
                );
            }

            return (
                <WalletContents
                    nfts={unknownTokens}
                    setNfts={(setUnknownTokens as any)}
                    tokenMap={tokenMap}
                    burnMode={burnMode}
                />
            );
        }
    }, [
        burnMode,
        knownTokens,
        unknownTokens,
        nfts,
        tokenMap,
        acceptedDisclaimer,
    ]);

    if (!publicKey) {
        return null;
    }

    if (loading) {
        return (
            <WalletLoadingAnimation
                nftCount={nftCount}
                nftsLoaded={nftsLoaded}
                statusText={statusText}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'end' }}>
                <TabHeader
                    onClick={setBurnNfts}
                    header={'Burn NFTs'}
                    selected={burnMode === BurnMode.BurnNfts}
                />

                <TabHeader
                    onClick={setBurnKnownTokens}
                    header={'Burn Tokens'}
                    selected={burnMode === BurnMode.BurnKnownTokens}
                />

                <TabHeader
                    onClick={setBurnUnknownTokens}
                    headerComponent={(
                        <UnknownHeader
                            onClick={setBurnUnknownTokens}
                            selected={burnMode === BurnMode.BurnUnknownTokens}
                        />
                    )}
                    selected={burnMode === BurnMode.BurnUnknownTokens}
                />
            </div>

            <hr
                style={{
                    width: '100%',
                    height: '2px',
                    border: 'none',
                    background: 'rgb(255, 97, 99)',
                }}
            />

            {contents}
        </div>
    );
}
