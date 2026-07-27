const { ethers } = require('ethers');

// Faster RPC
const OPBNB_RPC_URL = 'https://opbnb.publicnode.com';
const ZTRO_TOKEN_ADDRESS = '0xF4E758D3461886f7dD5af3E86f622e171113A568';
const ZTRO_REWARD_CONTRACT_ADDRESS = '0xB019DF1086b634Abd4459cCD96BeD3aa56b0fd45';

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
