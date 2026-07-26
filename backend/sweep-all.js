const { ethers } = require('ethers');

const OPBNB_RPC_URL = 'https://opbnb-mainnet-rpc.bnbchain.org';
const ZTRO_TOKEN_ADDRESS = '0x4c88B8b5caC7F6c3F28612fe4DcCA94e76541cee';
const ZTRO_REWARD_CONTRACT_ADDRESS = '0xe0F8e9Ce505e62aBe40E84Ac49777fF8333eE46a';
const RELAYER_PRIVATE_KEY = '0xa6f90dbed3688521ec0820a34c9d0542b0dd0731470f83d156c2cd4eb9169a21';

async function main() {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC_URL);
    const wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

    const tokenAbi = ['function balanceOf(address account) view returns (uint256)'];
    const tokenContract = new ethers.Contract(ZTRO_TOKEN_ADDRESS, tokenAbi, provider);

    const rewardAbi = [
        'function sweep(address to, uint256 amount) external',
        'function poolBalance() view returns (uint256)'
    ];
    const rewardContract = new ethers.Contract(ZTRO_REWARD_CONTRACT_ADDRESS, rewardAbi, wallet);

    try {
        const rawBalance = await tokenContract.balanceOf(ZTRO_REWARD_CONTRACT_ADDRESS);
        const balance = Number(rawBalance);
        console.log(`Current ZTRO Pool Balance to sweep: ${balance} ZTRO`);

        if (balance === 0) {
            console.log('No ZTRO tokens left to sweep.');
            return;
        }

        console.log(`Sending sweep transaction to transfer ${balance} ZTRO to admin: ${wallet.address}...`);
        // call sweep(to, amount)
        const tx = await rewardContract.sweep(wallet.address, rawBalance);
        console.log(`Transaction sent. Hash: ${tx.hash}`);

        console.log('Waiting for confirmation...');
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber} with status ${receipt.status}`);

        const finalBalance = await tokenContract.balanceOf(ZTRO_REWARD_CONTRACT_ADDRESS);
        console.log(`Final Pool Balance: ${ethers.formatUnits(finalBalance, 0)} ZTRO`);
    } catch (err) {
        console.error('Error executing sweep:', err);
    }
}

main();
