import { createClient } from "@supabase/supabase-js";
const  supabaseUrl =process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

//创建Supabase 客户端，将客户端配置放在单独的文件里，以后所有需要数据库的地方都从这里导入，避免重复创建
export const supabase =createClient(supabaseUrl,supabaseAnonKey);