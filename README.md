# Derug NFT Dapp

The purpose of this Dapp is to burn and mint a new copy of an NFT.

## Description
Simple burn and mint application.

Server reads a mapping between hahes of existing NFTs and their related metadata in order to:
1. Identify which NFTs to burn in the user's wallet on the client side
2. Mint an NFT using the associated metadata

Transactions are built and partially signed on server to register update authority as a verified creator before being sent back to the client to sign and send the transaction.

## Getting Started
- [todo] import test scripts to mint and map a sample collection for use on server side
- Fill out relevant environment variables, then build and start client and server apps

## Authors

Giffen Good: [@_GiffenGood](https://twitter.com/_GiffenGood)

## Version History

* 0.1
    * Initial Release

## License

This project is licensed under the GNU General Public License - see [here](https://www.gnu.org/licenses/gpl-3.0.html) for details

## Acknowledgments

Inspiration, code snippets, etc.
* [Metaplex](https://discord.gg/VChzv2Hv) and it's community developers, who provided guidance on best practices while building this app.
* [Solana Cookbook](https://solanacookbook.com/#contributing)
* [yihau](https://yihau.github.io/solana-web3-demo/)
* [Sol-Slugs](https://www.sol-incinerator.com/#/)
