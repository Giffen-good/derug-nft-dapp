import {useWallet} from "@solana/wallet-adapter-react";
import { WalletManager } from "../components/WalletManager";
import fomoImg from '../assets/fomo-bombs.png'
const Home = () => {
    const { publicKey, connected } = useWallet();
    return (
        <>
            <div className={'flex-auto md:flex-1 h-full md:w-auto w-full'}>
                <img alt={"A pfp of a FOMO Bomb"} src={fomoImg} className={'absolute bottom-0 max-w-full sm:max-w-[50%]'} />
            </div>
            <div className={' flex-auto md:flex-1 flex pt-10 sm:pt-0 sm:items-center z-10 max-w-full'}>
                <div className={'heading-offset pr-4 mx-auto max-w-full w-full w-[650px]'}>
                    <h1 className={`uppercase text-3xl sm:text-5xl md:text-6xl ${process.env.SECRET === 'secret' ? 'secret secure': 'or is it'}`}>Here is to a new beginning BOMBS</h1>
                    {connected && publicKey ? <WalletManager /> : <h2 className={""}>Please Connect your wallet to begin.</h2>}
                </div>
            </div>
        </>
    )
}

export default Home