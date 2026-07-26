const { ethers } = require('ethers');

// Faster RPC
const OPBNB_RPC_URL = 'https://opbnb.publicnode.com';
const ZTRO_TOKEN_ADDRESS = '0x4c88B8b5caC7F6c3F28612fe4DcCA94e76541cee';
const ZTRO_REWARD_CONTRACT_ADDRESS = '0x9880728c28B6B03057225F70738a0B9e4Bed2ac2';

async function main() {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC_URL);

    // ZTRO ERC20 balance check
    const erc20Abi = ['function balanceOf(address account) view returns (uint256)'];
    const tokenContract = new ethers.Contract(ZTRO_TOKEN_ADDRESS, erc20Abi, provider);

    try {
        const rawBalance = await tokenContract.balanceOf(ZTRO_REWARD_CONTRACT_ADDRESS);
        console.log('--- SCAN COMPLETED ---');
        console.log(`ZTRO Reward Contract: ${ZTRO_REWARD_CONTRACT_ADDRESS}`);
        console.log(`ZTRO Pool Balance: ${ethers.formatUnits(rawBalance, 0)} ZTRO`);
    } catch (err) {
        console.error('Error fetching on-chain balance:', err);
    }
}

main();
