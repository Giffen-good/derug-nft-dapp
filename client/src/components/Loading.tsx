import React from 'react';

export interface WalletLoadingProps {
    nftCount: number | null;
    statusText: string | null;
}

export function Loading(props: WalletLoadingProps) {
    const {
        statusText,
    } = props;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
                Loading NFTs...
            </span>
        </div>
    );
}
