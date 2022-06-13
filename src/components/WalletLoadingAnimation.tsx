import React from 'react';

export interface WalletLoadingProps {
    nftCount: number | null;
    nftsLoaded: number;
    statusText: string | null;
}

export function WalletLoadingAnimation(props: WalletLoadingProps) {
    const {
        nftCount,
        nftsLoaded,
        statusText,
    } = props;

    const text = React.useMemo(() => {
        if (nftCount === null) {
            return 'Loading NFTs...';
        }

        return `Loaded ${nftsLoaded} of ${nftCount} NFT${nftCount !== 1 ? 's' : ''}...`;
    }, [nftCount, nftsLoaded]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '40px',
        }}>
            <span >
                {statusText}
            </span>
            <hr
                id='wallet-loading'
                style={{
                    height: '5px',
                    border: 'none',
                    width: '100%',
                }}
            />
            <span>
                {text}
            </span>
        </div>
    );
}
