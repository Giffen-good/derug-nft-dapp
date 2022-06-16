import logo from "../assets/sol.png";
import { Route, Routes } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Home from '../pages/Home'
import GithubLogo from '../assets/github-logo.png'
const AppLayout = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  return (
        <div style={{ minHeight: "100vh" }} className={'bg-green-fomo flex-col flex'}>
          <header className={'flex justify-end p-8'}>
                <WalletMultiButton className="wallet-button" />
          </header>
          <main className={'flex-1 relative flex'}>
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
              <a target="_blank" className={'h-8 w-8 absolute bottom-4 right-4 z-20'} href={'https://github.com/Giffen-good/derug-nft-dapp'}><img className={''} src={GithubLogo} /></a>
          </main>


        </div>
  );
};

export default AppLayout;
