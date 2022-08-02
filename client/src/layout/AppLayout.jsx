import { Route, Routes } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Logo from '../assets/logo.jpg'
import Home from '../pages/Home'
import GithubLogo from '../assets/github-logo.png'
const AppLayout = () => {
  return (
        <div style={{ minHeight: "100vh" }} className={' flex-col flex'}>
          <header className={'flex justify-end m-8 relative'}>
                <img alt={'Brave Cats Society logo'} className={'logo'} src={Logo} />
                <WalletMultiButton className="wallet-button" />
          </header>
          <main className={'flex-1 relative flex'}>
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
              <a target="_blank" rel="noreferrer"  className={'h-8 w-8 absolute bottom-4 left-4 z-20'} href={'https://github.com/Giffen-good/derug-nft-dapp'}><img alt={'github logo'} className={''} src={GithubLogo} /></a>
          </main>


        </div>
  );
};

export default AppLayout;
