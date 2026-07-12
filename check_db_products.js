import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const dbProducts = await Product.find({}).select('title image category');
        console.log(`Found ${dbProducts.length} products:`);
        dbProducts.forEach(p => {
            console.log(`- [${p.get('category')}] "${p.get('title')}" => ${p.get('image')}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
