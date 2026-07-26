const { ethers } = require('ethers');

const OPBNB_RPC_URL = 'https://opbnb-mainnet-rpc.bnbchain.org';
const ZTRO_TOKEN_ADDRESS = '0x4c88B8b5caC7F6c3F28612fe4DcCA94e76541cee';
const ZTRO_REWARD_CONTRACT_ADDRESS = '0x9880728c28B6B03057225F70738a0B9e4Bed2ac2';
const ADMIN_WALLET_ADDRESS = '0xd0b8E0Dbb658d24cA59aa7108f582daD98Dd2A27';

async function main() {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC_URL);

    const tokenAbi = ['function balanceOf(address account) view returns (uint256)'];
    const tokenContract = new ethers.Contract(ZTRO_TOKEN_ADDRESS, tokenAbi, provider);

    try {
        const adminBal = await tokenContract.balanceOf(ADMIN_WALLET_ADDRESS);
        const contractBal = await tokenContract.balanceOf(ZTRO_REWARD_CONTRACT_ADDRESS);

        console.log('--- ZTRO BALANCES ---');
        console.log(`Admin Wallet (${ADMIN_WALLET_ADDRESS}) balance: ${adminBal.toString()} ZTRO`);
        console.log(`Contract (${ZTRO_REWARD_CONTRACT_ADDRESS}) balance: ${contractBal.toString()} ZTRO`);
    } catch (err) {
        console.error('Error fetching ZTRO balances:', err);
    }
}

main();
