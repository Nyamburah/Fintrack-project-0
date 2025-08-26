// Replace your current MongoDB connection with this:

const mongoose = require('mongoose');

// Try local MongoDB first (easier for development)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fintrack";

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials in logs
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Network error - check your internet connection or MongoDB Atlas settings');
      console.log('💡 Trying local MongoDB as fallback...');
      
      try {
        await mongoose.connect("mongodb://localhost:27017/fintrack", {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('✅ Connected to local MongoDB');
      } catch (localError) {
        console.error('❌ Local MongoDB also failed:', localError.message);
        console.log('💡 Please install and start MongoDB locally');
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

// Call this function before starting your server
connectDB();

// Your server setup continues here...
const app = express();
// ... rest of your code