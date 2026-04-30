import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const FIX = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected");
    await mongoose.connection.db.collection('app_config').deleteOne({ key: 'app-icon' });
    await mongoose.connection.db.collection('app_config').deleteOne({ key: 'app-icon-192' });
    await mongoose.connection.db.collection('app_config').deleteOne({ key: 'app-icon-512' });
    console.log("Deleted");
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
FIX();
