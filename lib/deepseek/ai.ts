import https from "https";
import { createDeepSeek } from "@ai-sdk/deepseek";


export const deepseek = createDeepSeek({
    baseURL: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY,
    fetch: (url, options) => {
        const agent = new https.Agent({
            rejectUnauthorized: false,
            secureProtocol:
                "TLSv1_2_method",
            ciphers:
                "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-DSS-AES256-GCM-SHA384",
            minVersion: "TLSv1.2",
            maxVersion: "TLSv1.3"
        });


        return fetch(
            url,
            {
                ...options,
                agent
            } as any
        );

    }

});