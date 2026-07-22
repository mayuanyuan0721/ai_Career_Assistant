"use client"
import styles from "@/css/authModal.module.css"
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";


interface Props {
    onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState < "login" | "register" > ("login");
    const handleLogin = async () => {
        setLoading(true);
        const res = await fetch(
            "/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );
        const data = await res.json();
        if (!res.ok) {
            alert("登录失败，请输入正确的邮箱和密码");
        } else {
            alert("登录成功");
            window.location.reload();
        }
        setLoading(false)
    }

    async function register() {
        const res = await fetch(
            "/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        )
        const data = await res.json();
        console.log(data);

    }

    //做了一个重置清空
    const changeMode=(newMode: "login" | "register")=>{
        setMode(newMode);
        setEmail("");
        setPassword("");
        
    }
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>
                    {
                        mode == "login" ? "登录" : "注册"
                    }
                </h2>
                <input placeholder="邮箱" value={email} onChange={e => { setEmail(e.target.value) }} />
                <input placeholder="密码" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button onClick={mode == "login" ? handleLogin : register} disabled={loading}>
                    {
                        mode == "login" ? "登录" : "注册"
                    }
                </button>
                <button onClick={onClose}>关闭</button>
                {
                    mode === "login"
                        ?
                        <p>
                            没有账号？
                            <button onClick={() => changeMode("register")} >
                                注册
                            </button>
                        </p>
                        :
                        <p>
                            已有账号？
                            <button onClick={() => changeMode("login")}>
                                登录
                            </button>
                        </p>
                }
            </div>

        </div>
    )
}