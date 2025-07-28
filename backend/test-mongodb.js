// test-mongodb.js - Save this in your backend folder
import 'dotenv/config';
import mongoose from 'mongoose';

const testMongoConnection = async () => {
    console.log('🔧 MongoDB Connection Test for Backend');
    console.log('====================================');
    
    // Check environment variables
    console.log('🔍 Environment Variables Check:');
    console.log('   - MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ Missing');
    console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ Missing');
    console.log('   - PORT:', process.env.PORT ? `✅ ${process.env.PORT}` : '❌ Missing');
    
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI not found in .env file!');
        console.log('💡 Make sure your .env file is in the backend folder');
        return;
    }
    
    // Show connection string (safely)
    const uri = process.env.MONGO_URI;
    const safeUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log('🔗 Connection URI:', safeUri);
    
    try {
        console.log('🔄 Attempting MongoDB connection...');
        
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
        });
        
        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);
        console.log(`🔌 Ready State: ${mongoose.connection.readyState}`);
        
        // Test basic operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📋 Collections: ${collections.length}`);
        if (collections.length > 0) {
            console.log(`📄 Collection names: ${collections.map(c => c.name).join(', ')}`);
        }
        
        console.log('✅ Connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB Connection Failed!');
        console.error('Error:', error.message);
        
        if (error.message.includes('ENOTFOUND') || error.message.includes('EBADR')) {
            console.log('\n💡 Network Error - Possible Solutions:');
            console.log('   1. Check MongoDB Atlas Network Access settings');
            console.log('   2. Add 0.0.0.0/0 to IP whitelist (for development)');
            console.log('   3. Verify your internet connection');
        }
        
        if (error.message.includes('authentication')) {
            console.log('\n💡 Authentication Error - Check:');
            console.log('   1. Username and password in connection string');
            console.log('   2. Database user permissions in MongoDB Atlas');
        }
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

testMongoConnection();