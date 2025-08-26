// cleanup-mpesa.js
// Run this file with: node cleanup-mpesa.js

import mongoose from 'mongoose';

// Replace with your actual MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

async function removeMpesaField() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('transactions');
    
    console.log('Starting cleanup of mpesaReceiptNumber field...');
    
    // Step 1: Check existing indexes
    console.log('Checking existing indexes...');
    const indexes = await collection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key })));
    
    // Step 2: Drop any index related to mpesaReceiptNumber
    const mpesaIndexes = indexes.filter(index => 
      index.key && index.key.mpesaReceiptNumber
    );
    
    if (mpesaIndexes.length > 0) {
      for (const index of mpesaIndexes) {
        console.log(`Dropping index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Successfully dropped index: ${index.name}`);
        } catch (error) {
          console.log(`⚠️ Could not drop index ${index.name}:`, error.message);
        }
      }
    } else {
      console.log('No mpesaReceiptNumber indexes found');
    }
    
    // Step 3: Remove the field from all documents
    console.log('Removing mpesaReceiptNumber field from all documents...');
    const result = await collection.updateMany(
      {}, // Match all documents
      { $unset: { mpesaReceiptNumber: "" } } // Remove the field
    );
    
    console.log(`✅ Updated ${result.modifiedCount} documents`);
    
    // Step 4: Verify cleanup
    const remainingDocs = await collection.countDocuments({
      mpesaReceiptNumber: { $exists: true }
    });
    
    if (remainingDocs === 0) {
      console.log('✅ All mpesaReceiptNumber fields have been successfully removed');
    } else {
      console.log(`⚠️ ${remainingDocs} documents still have the mpesaReceiptNumber field`);
    }
    
    // Step 5: Show final indexes
    const finalIndexes = await collection.listIndexes().toArray();
    console.log('Final indexes:', finalIndexes.map(i => ({ name: i.name, key: i.key })));
    
    await mongoose.disconnect();
    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Run the cleanup
removeMpesaField();