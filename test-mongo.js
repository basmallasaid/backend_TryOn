const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://redolapyadmin_db_user:NEW_PASSWORD@rhqmsqv.mongodb.net/tryon_db?retryWrites=true&w=majority&appName=ReDolapy';

(async () => {
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 30000,
        family: 4,
    });
    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log('✅ Connected successfully');
        await client.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.cause) console.error('Cause:', e.cause);
    }
})();