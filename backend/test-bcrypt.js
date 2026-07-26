const bcrypt = require('bcryptjs');
async function test() {
    console.log('Hashing...');
    const hash = await bcrypt.hash('password123', 10);
    console.log('Hash:', hash);
    console.log('Comparing...');
    const match = await bcrypt.compare('password123', hash);
    console.log('Match:', match);
}
test();
