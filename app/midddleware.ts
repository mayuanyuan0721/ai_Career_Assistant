import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";


export async function middleware(req:NextRequest){

    let response = NextResponse.next({
        request:req
    });


    const supabase=createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies:{
                getAll(){
                    return req.cookies.getAll();
                },

                setAll(cookiesToSet){

                    cookiesToSet.forEach(
                        ({name,value})=>{
                            response.cookies.set(
                                name,
                                value
                            )
                        }
                    )

                }
            }
        }
    );


   const {data:{user}}= await supabase.auth.getUser();
   if(!user){
    return NextResponse.redirect(new URL("/login",req.url))

   }
return response;

}


export const config={
    matcher:[
        "/chat/:path*",
         "/api/:path*"
    ]
}