const { Client, LocalAuth } = require('./index');

console.log('Starting WhatsApp client with VISIBLE browser...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ],
        defaultViewport: null // This ensures the browser opens in full screen
    }
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', async (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('✅ AUTHENTICATED');
});

client.on('ready', () => {
    console.log('✅ READY - WhatsApp Web should be visible in browser!');
    console.log('WWebVersion = ' + client.info.webVersion);
});

client.on('message', async msg => {
    console.log('📩 Message received:', msg.body);

    if (msg.body === '!ping') {
        msg.reply('pong');
        console.log('✅ Replied with pong');
    }
});

client.initialize();

console.log('🔍 If you don\'t see the browser window:');
console.log('   1. Press Cmd+Tab to switch to Chrome');
console.log('   2. Check Mission Control (swipe up with 3 fingers)');
console.log('   3. Look in your Dock for Chrome');
