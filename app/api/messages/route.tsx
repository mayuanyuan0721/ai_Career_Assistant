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


export async function POST(req:Request){
    const supabase=await createClient();
    const body=await req.json();
    console.log("保存AI发送消息",body);
    const {conversationId,role,content}=body;
    const {data,error}=await supabase
    .from("messages")
    .insert({
        conversation_id:conversationId,
        role,
        content
    })
    .select()
    .single();
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
        data
    })
}