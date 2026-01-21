import mongoose  from "mongoose";
const connectDb = async ()=>{
    try {
        mongoose.connect(process.env.MONGODB_URL)
        console.log("db connected ");
        
    } catch (error) {
        console.log(error.message);
        
    }
}
export default connectDb