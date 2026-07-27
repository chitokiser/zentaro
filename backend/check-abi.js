const { ethers } = require('ethers');

const OPBNB_RPC_URL = 'https://opbnb-rpc.publicnode.com';
const TARGET_ADDRESS = '0x58d567c90865EF5ccBF8291553D51d38DC63A7B1';

async function main() {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC_URL);

    const dispenserAbi = [
        'function poolBalance() view returns (uint256)',
        'function relayer() view returns (address)'
    ];

    const vaultAbi = [
        'function totalStaked() view returns (uint256)',
        'function adminReserve() view returns (uint256)',
        'function ztro() view returns (address)'
    ];

    console.log('--- Probing Dispenser functions ---');
    try {
        const contr = new ethers.Contract(TARGET_ADDRESS, dispenserAbi, provider);
        const balance = await contr.poolBalance();
        const rel = await contr.relayer();
        console.log(`Dispenser: poolBalance=${balance.toString()}, relayer=${rel}`);
    } catch (err) {
        console.log(`Dispenser check failed: ${err.message}`);
    }

    console.log('--- Probing Vault functions ---');
    try {
        const contr = new ethers.Contract(TARGET_ADDRESS, vaultAbi, provider);
        const ts = await contr.totalStaked();
        const ar = await contr.adminReserve();
        const ztToken = await contr.ztro();
        console.log(`Vault: totalStaked=${ts.toString()}, adminReserve=${ar.toString()}, ztro=${ztToken}`);
    } catch (err) {
        console.log(`Vault check failed: ${err.message}`);
    }
}

main();
