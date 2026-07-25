import { createClient } from "@/lib/supabase/server";

export async function POST(req:Request) {
    const supabase=await createClient();
    const {content,filename}=await req.json();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){
        return Response.json({
            error:"未登录"
        },
        {
            status:401
        }
    )
    }
    const {data,error}=await supabase
    .from("resumes")
    .insert({
        user_id:user.id,
        filename,
        content
    })
    .select()
    .single()
    if(error){
        console.log(error);
        return Response.json(
            {
                error:error.message
            },{
                status:500
            }
        )
    }
    return Response.json({
        resumeId:data.id
    })
}