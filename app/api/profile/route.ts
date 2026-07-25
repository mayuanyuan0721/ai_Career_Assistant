import { createClient } from "@/lib/supabase/server";

export async function POST(req:Request){
    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){
        return Response.json({
            error:"未登录"
        },{
            status:401
        })
    }

    const profile=await req.json();
    const {data,error}=await supabase
    .from("profiles")
    .upsert({
        id:user.id,
        ...profile
    });
    if(error){
        return Response.json({
            error:error.message
        },{
            status:500
        })
    }
    return Response.json(data)
}