const { ethers } = require('ethers');

const OPBNB_RPC_URL = 'https://opbnb-mainnet-rpc.bnbchain.org';
const ZTRO_TOKEN_ADDRESS = '0xF4E758D3461886f7dD5af3E86f622e171113A568';
const ZTRO_REWARD_CONTRACT_ADDRESS = '0xB019DF1086b634Abd4459cCD96BeD3aa56b0fd45';
const ADMIN_WALLET_ADDRESS = '0xE1F72796e5d76193fC38e976B033b5C646e6C230';

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
