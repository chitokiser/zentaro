const { ethers } = require('ethers');

const OPBNB_RPC_URL = 'https://opbnb-mainnet-rpc.bnbchain.org';
const ZTRO_REWARD_CONTRACT_ADDRESS = '0xe0F8e9Ce505e62aBe40E84Ac49777fF8333eE46a';
const RELAYER_PRIVATE_KEY = '0xa6f90dbed3688521ec0820a34c9d0542b0dd0731470f83d156c2cd4eb9169a21';

async function main() {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC_URL);
    const abi = [
        'function owner() view returns (address)',
        'function relayer() view returns (address)'
    ];

    const contract = new ethers.Contract(ZTRO_REWARD_CONTRACT_ADDRESS, abi, provider);
    const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY);

    try {
        const ownerAddress = await contract.owner();
        const relayerAddress = await contract.relayer();

        console.log('--- CONTRACT DETAILS ---');
        console.log('Contract Address:', ZTRO_REWARD_CONTRACT_ADDRESS);
        console.log('Contract Owner  :', ownerAddress);
        console.log('Contract Relayer:', relayerAddress);
        console.log('Local Wallet (Relayer) Address:', relayerWallet.address);
        console.log('Does Local Wallet match Owner  ?', relayerWallet.address.toLowerCase() === ownerAddress.toLowerCase());
        console.log('Does Local Wallet match Relayer?', relayerWallet.address.toLowerCase() === relayerAddress.toLowerCase());
    } catch (err) {
        console.error('Error fetching owner info:', err);
    }
}

main();
