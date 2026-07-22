import { NextRequest } from 'next/server';
import https from 'https';
import { streamText,generateText  } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek'; // 推荐用专用包
import {createClient} from "@/lib/supabase/server"
import { log } from 'console';


const deepseek = createDeepSeek({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
  fetch: (url, options) => {
    const agent = new https.Agent({
      rejectUnauthorized: false,
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-DSS-AES256-GCM-SHA384',
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
    });
    return fetch(url, { ...options, agent } as any);
  }
});



export async function POST(request: NextRequest) {
 const supabase=await createClient();
const {data:{user},error}=await supabase.auth.getUser();
if(!user){
 return new Response(
   "未登录",
   {
    status:401
   }
 )
}
  try {
    const { messages, conversationId } = await request.json();
    console.log(
      JSON.stringify(conversationId)
    );
    //这个是给AI模型用的数据处理
    const modelMessages = messages.map((msg: any) => ({
      role: msg.role,
      content:
        msg.parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("") || ""
    }));
    const lastMessage = messages[messages.length - 1];

    //这个是给数据库用的数据处理
    /**const userText =modelMessages[modelMessages.length-1].content;
     */
    const userText = lastMessage.parts.filter(
      (p: any) => p.type === 'text'
    ).map(
      (p: any) => p.text
    ).join("")
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id,title")
      .eq("id", conversationId)
      .single();
    if (!conversation) {
      await supabase
        .from("conversations")
        .insert({
          id: conversationId,
          title: "AI聊天",
          user_id:user?.id
        });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: userText
      });
    if (error) {
      console.error(
        "保存消息失败:***",
        error
      );
    }
    else {
      console.log(
        "保存成功****",
        data
      );

    }

    const result =  streamText({
      model: deepseek('deepseek-chat'),
      messages: modelMessages,
      onFinish: async ({ text }) => {
        await supabase
          .from("messages")
          .insert({
            conversation_id:
              conversationId,
            role: "assistant",
            content: text
          });
           if(!conversationId){
            return ;
          }
          const {data:conversation,error}=await supabase
          .from("conversations")
          .select("title")
          .eq("id",conversationId)
          .single()
         if(conversation?.title=== "AI聊天"){
          const titlePrompt = `
          请根据下面这段聊天内容生成一个简洁的聊天标题。
          要求：
          1. 不超过10个字
          2. 不要加引号
          3. 不要加句号
          4. 直接输出标题
          聊天内容：
          ${userText}`;
           const titleResult=await generateText({
            model: deepseek("deepseek-chat"),
             prompt: titlePrompt
         })
        const {data:updateData,error:updateError}= await supabase
         .from("conversations")
         .update({title:titleResult.text.trim()})
         .eq("id",conversationId);
         }
      }
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {

    console.error("流式接口出错:", err);

    return new Response(
      "流式处理失败",
      {
        status: 500
      }
    );
  }
}



/** 
export async function POST(request: NextRequest) {
  console.log(' 收到请求');

  try {
    const { message } = await request.json();
    console.log(' 用户消息:', message);

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    // 构造 payload（保持简洁）
    const payload = {
      model: 'deepseek-v4-pro',
      messages: [{ role: 'user', content: message }],
    };

    // -------- 核心：精细化配置 https.Agent --------
    const agent = new https.Agent({
      rejectUnauthorized: false,        // 开发环境忽略证书验证
      secureProtocol: 'TLSv1_2_method', // 强制 TLS 1.2（兼容性最好）
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
        'DHE-DSS-AES128-GCM-SHA256',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-DSS-AES256-GCM-SHA384',
      ].join(':'), // 指定一组现代且广泛支持的加密套件
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      // 如果上面不行，可以尝试启用更宽松的加密套件列表（取消注释下一行，并注释掉上面的 ciphers）
      // ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!SRP',
    });
    // -------- 配置结束 --------

    console.log('Agent 配置完成，强制 TLS 1.2，指定加密套件');

    // 发起请求
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(payload),
      // 关键：传入自定义 agent
      agent: agent,
    });

    // 读取响应（先获取文本用于调试）
    const responseText = await response.text();
    console.log('响应状态:', response.status);
    console.log(' 响应内容:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: `DeepSeek 错误 (${response.status}): ${responseText}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    const reply = data.choices?.[0]?.message?.content || '没有回复内容';
    console.log('AI 回复:', reply);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('错误详情:', error);
    return NextResponse.json(
      { error: '服务器错误：' + (error.message || '未知错误') },
      { status: 500 }
    );
  }
}*/