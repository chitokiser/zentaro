const email = `testuser_${Math.floor(Math.random() * 100000)}@example.com`;
const password = "password123";
const displayName = "Test User";

async function run() {
    console.log(`Testing with email: ${email}`);

    // 1. Try to register
    try {
        console.log("Sending POST /api/auth/register...");
        const regRes = await fetch("http://localhost:3001/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, displayName })
        });
        console.log("Register response status:", regRes.status);
        const regBody = await regRes.text();
        console.log("Register response body:", regBody);
    } catch (err) {
        console.error("Register request failed:", err);
    }

    // 2. Try to login
    try {
        console.log("Sending POST /api/auth/login...");
        const loginRes = await fetch("http://localhost:3001/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        console.log("Login response status:", loginRes.status);
        const loginBody = await loginRes.text();
        console.log("Login response body:", loginBody);
    } catch (err) {
        console.error("Login request failed:", err);
    }
}

run();
