import { createClient } from "@/lib/supabase/server"


export async function POST(req: Request) {

    const supabase = await createClient();


    const { id } = await req.json();


    const { data, error } = await supabase
        .from("conversations")
        .insert({
            id,
            title:"新聊天"
        })
        .select()
        .single();


    console.log(
        "创建结果:",
        data,
        error
    );


    if(error){

        return Response.json(
            {
                error:error.message
            },
            {
                status:500
            }
        )
    }


    return Response.json({

        data

    });

}