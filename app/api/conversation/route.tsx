import {createClient} from "@/lib/supabase/server"


export async function POST(req:Request){

try{


const supabase=await createClient();


const {
 data:{
    user
 }
}=await supabase.auth.getUser();



if(!user){

 return Response.json(
 {
  error:"未登录"
 },
 {
  status:401
 }
 )

}



const {
 data,
 error
}=await supabase
.from("conversations")
.insert({

    title:"新对话",

    user_id:user.id

})
.select()
.single();



if(error){

 console.log(
 "创建conversation失败:",
 error
 );


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


}catch(error:any){


console.log(
 "conversation接口错误:",
 error
);


return Response.json(
{
 error:error.message
},
{
 status:500
}
)


}

}