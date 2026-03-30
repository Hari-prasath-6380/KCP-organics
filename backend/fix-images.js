// Fix broken image references in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const Product = require('./models/Product');

async function fixBrokenImages() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const uploadsDir = path.join(__dirname, 'uploads/products');
        
        // Get all image files that exist on disk
        const existingFiles = new Set(fs.readdirSync(uploadsDir));
        console.log(`📁 Found ${existingFiles.size} image files on disk\n`);

        // Get all products
        const allProducts = await Product.find({});
        console.log(`📦 Processing ${allProducts.length} products...\n`);

        let fixedCount = 0;
        let brokenCount = 0;
        const brokenProducts = [];

        for (const product of allProducts) {
            if (!product.image) continue;

            // Extract just the filename from the path
            const imagePath = product.image;
            let filename = imagePath;

            if (imagePath.includes('/')) {
                filename = imagePath.split('/').pop();
            }

            // Check if file exists (skip product.jpg as it's the default)
            if (!existingFiles.has(filename) && filename !== 'product.jpg') {
                console.log(`❌ Missing: "${product.name}" -> ${filename}`);
                brokenProducts.push({
                    name: product.name,
                    oldImage: imagePath,
                    filename: filename
                });
                brokenCount++;

                // Fix by setting to product.jpg
                product.image = 'product.jpg';
                await product.save();
                fixedCount++;
            } else if (existingFiles.has(filename)) {
                console.log(`✅ OK: "${product.name}"`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📊 SUMMARY:`);
        console.log(`   Total products: ${allProducts.length}`);
        console.log(`   Broken images found: ${brokenCount}`);
        console.log(`   Fixed: ${fixedCount}`);
        console.log('='.repeat(60));

        if (brokenProducts.length > 0) {
            console.log('\n📝 Broken image details:');
            brokenProducts.forEach(p => {
                console.log(`   - ${p.name}: ${p.filename}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n✅ Done! Database updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixBrokenImages();
