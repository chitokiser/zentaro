const { ethers } = require('ethers');

const OPBNB_RPC_URL = 'https://opbnb-rpc.publicnode.com';
const TARGET_ADDRESS = '0xB019DF1086b634Abd4459cCD96BeD3aa56b0fd45';

async function main() {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC_URL);

    // Probe for ZtroRewardDispenser functions vs ZTROVaultDAO functions
    console.log(`Probing contract at ${TARGET_ADDRESS}...`);

    try {
        const code = await provider.getCode(TARGET_ADDRESS);
        console.log(`Bytecode length: ${code.length}`);
        if (code === '0x') {
            console.log('No code at address!');
            return;
        }
    } catch (err) {
        console.error('Error fetching bytecode:', err);
    }

    // Probe functions
    const dispenserAbi = ['function poolBalance() view returns (uint256)'];
    const vaultAbi = ['function totalStaked() view returns (uint256)'];

    try {
        const dispenserContract = new ethers.Contract(TARGET_ADDRESS, dispenserAbi, provider);
        const balance = await dispenserContract.poolBalance();
        console.log(`Dispenser check succeeded. poolBalance: ${balance.toString()}`);
    } catch (err) {
        console.log(`Dispenser check failed: ${err.message}`);
    }

    try {
        const vaultContract = new ethers.Contract(TARGET_ADDRESS, vaultAbi, provider);
        const totalStaked = await vaultContract.totalStaked();
        console.log(`Vault check succeeded. totalStaked: ${totalStaked.toString()}`);
    } catch (err) {
        console.log(`Vault check failed: ${err.message}`);
    }
}

main();
