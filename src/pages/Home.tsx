import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import { WalletManager } from "../components/WalletManager";
import fomoImg from '../assets/fomo-bombs.png'
const Home = () => {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    return (
            <div className={'h-full flex absolute w-full'}>
                <div className={'flex-1 h-full relative'}>
                        <img src={fomoImg} className={'absolute bottom-0'} />
                </div>
                <div className={'flex-1 flex items-center '}>
                    <div className={'pb-20 pr-4 mx-auto max-w-2xl'}>
                        <h1 className={'uppercase text-6xl '}>Here is to a new beginning BOMBS</h1>
                        {connected && publicKey ? <WalletManager /> : <h2 className={"font-sans"}>Please Connect your wallet to begin.</h2>}
                    </div>
                </div>
            </div>
    )
}

export default Home