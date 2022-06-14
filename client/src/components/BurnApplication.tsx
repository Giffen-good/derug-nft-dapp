import React from 'react';
import {
    useWallet,
} from '@solana/wallet-adapter-react';
import { WalletManager } from './WalletManager';

export interface BurnApplicationProps {
}

export function BurnApplication(props: BurnApplicationProps) {
    const {
        connected,
        publicKey,
    } = useWallet();

    const address = React.useMemo(() => {
        if (!publicKey) {
            return;
        }

        const key = publicKey.toString();

        return key.slice(0, 4) + '...' + key.slice(key.length - 4);
    }, [publicKey]);

    // React.useEffect(() => {
    //     if (!adapter) {
    //         return;
    //     }
    //
    //     adapter.on('error', (err: { toString: () => string; }) => console.log('caught error: ' + err.toString()));
    // }, [adapter]);

    return (
        <div>
            <div>
                {!connected && (
                    <div>
                        <div>
                            <span>
                                to burn any unwanted NFTs or tokens and reclaim the rent
                            </span>
                        </div>
                    </div>
                )}

            </div>

            <hr
            />

            {connected &&
              <WalletManager/>
            }
        </div>
    );
}
