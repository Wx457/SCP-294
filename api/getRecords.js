// api/getRecords.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    let dbConnection;
    try {
        dbConnection = await client.connect();
        const database = dbConnection.db('scp294');
        const collection = database.collection('test_logs');
        
        // 查找 'test_logs' 集合中的所有文档，并将它们作为数组返回
        const records = await collection.find({}).sort({ timestamp: -1 }).toArray();

        return res.status(200).json({ records });
    } catch (error) {
        console.error('Failed to retrieve records:', error);
        return res.status(500).json({ message: 'Failed to retrieve records' });
    } finally {
        if (dbConnection) {
            await dbConnection.close();
        }
    }
}