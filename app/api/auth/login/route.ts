import { createClient } from "@/lib/supabase/server";


export async function POST(req:Request){

    const {email,password}=await req.json();
    const supabase=await createClient();
    const {data,error}=await supabase.auth.signInWithPassword({
        email,
        password
    });
    if(error){
        return Response.json(
            {
                error:error.message
            },
            {
                status:400
            }
        );
    }


    return Response.json({
        user:data.user
    });

}