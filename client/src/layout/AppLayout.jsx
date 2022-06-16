import logo from "../assets/sol.png";
import { Route, Routes } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Home from '../pages/Home'

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
          </main>
        </div>
  );
};

export default AppLayout;
