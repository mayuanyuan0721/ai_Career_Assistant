import { createClient } from "@/lib/supabase/server";


export async function POST(req:Request){

    const supabase=await createClient();
   
    const {error} = await supabase.auth.signOut();
    if(error){
        return Response.json(
            {
                error:error.message
            },
            {
                status:500
            }
        );
    }


    return Response.json({
           success:true
    });

}