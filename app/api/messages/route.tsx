import {createClient} from "@/lib/supabase/server"
import { NextRequest } from "next/server";


export async function GET(req:NextRequest) {
 const supabase=await createClient();

    const conversationId=req.nextUrl.searchParams.get('conversationId');
    if(!conversationId){
        return Response.json({error:"Missing conversationId"})
    }
    const { data, error } = await supabase
        .from("messages")
         .select('id,  role, content, created_at')
        .eq('conversation_id', conversationId)
         .order('created_at', { ascending: true });
        if(error){
            return Response.json({error:error.message}, { status: 500 })
        }
        
    return Response.json({
        messages:data
    });
}