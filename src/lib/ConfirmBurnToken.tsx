import { TokenInfo } from '@solana/spl-token-registry';
import React from 'react';

import { Burnable, BurnMode } from './Types';
import { getName, getImage } from './utilities';

export interface ConfirmBurnTokenProps {
    onConfirm: () => void;

    onCancel: () => void;

    burnType: string;

    burning: Burnable[];

    tokenMap: Map<string, TokenInfo>;

    burnMode: BurnMode;
}

export function ConfirmBurnToken(props: ConfirmBurnTokenProps) {
    const {
        onConfirm,
        onCancel,
        burnType,
        burning,
        tokenMap,
        burnMode,
    } = props;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70%', minHeight: '380px' }}>
            <span
                style={{
                    fontSize: '26px',
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '30px',
                    marginBottom: '20px',
                }}
            >
                Are you sure you want to burn:
            </span>

            {burning.map((t) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '15px', }} key={t.mint}>
                    <img
                        alt='token'
                        src={getImage(t, tokenMap)}
                        style={{
                            width: '48px',
                            height: '48px',
                            marginRight: '10px',
                        }}
                    />

                    <span
                        style={{
                            fontSize: '26px',
                            color: 'white',
                            textAlign: 'center',
                        }}
                    >
                        {`${getName(t, tokenMap, burnMode === BurnMode.BurnNfts)}`}
                    </span>
                </div>
            ))}

            {burnMode === BurnMode.BurnUnknownTokens && (
                <span
                    style={{
                        marginTop: '30px',
                        fontSize: '26px',
                        color: 'white',
                        textAlign: 'center',
                    }}
                >
                    REMINDER: Unknown tokens could be NFTs, whitelist tokens, or other valuable items. If you do not know what a token is, do NOT burn it.
                </span>
            )}

            <span
                style={{
                    marginTop: '30px',
                    fontSize: '26px',
                    color: 'white',
                    textAlign: 'center',
                }}
            >
                {`These ${burnType}s will be burned by executing the burn instruction. This process cannot be reversed. Make sure you have the correct ${burnType}s selected!`}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '50px', marginBottom: '30px' }}>
                <button
                    style={{
                        color: 'white',
                        backgroundColor: 'rgb(255, 97, 99)',
                        width: '200px',
                        height: '50px',
                        fontSize: '26px',
                        border: 'none',
                        textTransform: 'uppercase',
                        marginRight: '20px',
                        cursor: 'pointer',
                    }}
                    onClick={onConfirm}
                >
                    Confirm
                </button>

                <button
                    style={{
                        color: 'white',
                        backgroundColor: 'rgb(255, 97, 99)',
                        width: '200px',
                        height: '50px',
                        fontSize: '26px',
                        border: 'none',
                        textTransform: 'uppercase',
                        marginLeft: '20px',
                        cursor: 'pointer',
                    }}
                    onClick={onCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
