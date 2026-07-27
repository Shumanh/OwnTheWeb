import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { dbConnect } from "@/lib/db/mongodb";
import User from "@/models/User";

const ALLOWED_EMAIL = "theshumanhere@gmail.com";

function allowedEmail() {
  return (process.env.GOOGLE_ALLOWED_EMAIL || ALLOWED_EMAIL).toLowerCase();
}

export async function getUserFromCookies(){
  try{
    const cookieStore = await cookies()
    const userToken = cookieStore.get('token')?.value
    
    if(!userToken){
      return {
        error: true, 
        message: "Cookie could not be found" 
      }
    }
    
    const verifyUser = verifyToken(userToken)
    if(!verifyUser){
      return {
        error: true,
        message: "User could not be verified, invalid token"
      }
    }

    await dbConnect();
    const user = await User.findById(verifyUser.id).select("email username role");
    if (!user || user.email?.toLowerCase() !== allowedEmail()) {
      return {
        error: true,
        message: "This account is not allowed",
      };
    }

    return {
      error: false, 
      message: "Token verified successfully", 
      user: user.role,
      data: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
      }
    }
  }
  catch(error){
    console.error("Error in Cookies function:", error)
    return {
      error: true, 
      message: "Cookie error"
    }
  }
}
