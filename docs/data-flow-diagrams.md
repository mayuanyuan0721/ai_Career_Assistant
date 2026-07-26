# AI Career Assistant — 全功能数据流程图（函数级精确版）

> 每个流程图精确标注：组件名 → 函数名 → API路径 → 数据库表 → 数据字段变换

---

## 1. 用户认证完整流程

### 1.1 页面加载 → 鉴权检查

```mermaid
graph TB
    A["app/page.tsx → Home()"] -->|"redirect('/chat')"| B["app/chat/page.tsx → ChatPage()"]
    B --> C["渲染 ChatLayout 组件"]
    C --> D["useEffect → checkUser()"]
    D -->|"fetch('/api/auth/user')"| E["app/api/auth/user/route.ts → GET()"]
    E -->|"createClient()"| F["lib/supabase/server.ts → createClient()"]
    F -->|"cookieStore.getAll()"| G["读取浏览器 Cookie 中的 JWT"]
    G -->|"supabase.auth.getUser()"| H["Supabase: 解析 JWT → 返回 user 对象"]
    H -->|"Response.json({user})"| I["ChatLayout.checkUser() 接收 data"]
    I -->|"setUser(data.user)"| J["ChatLayout state: user = {id, email, ...}"]
    I -->|"setChecked(true)"| K["ChatLayout state: checked = true"]
```

### 1.2 登录流程

```mermaid
graph TB
    A["ChatBox 顶部: 用户点击 Login 按钮"] -->|"onLogin() callback"| B["ChatLayout: setShowAuth(true)"]
    B --> C["渲染 AuthModal 组件"]
    C --> D["用户输入 email + password"]
    D -->|"点击登录按钮"| E["AuthModal.handleLogin()"]
    E -->|"fetch POST /api/auth/login\nbody: {email, password}"| F["app/api/auth/login/route.ts → POST()"]
    F -->|"createClient()"| G["lib/supabase/server.ts"]
    F -->|"req.json() → {email, password}"| H["supabase.auth.signInWithPassword({email, password})"]
    H -->|"成功"| I["Supabase 设置 auth Cookie\n返回 {user: {id, email}}"]
    H -->|"失败"| J["返回 400 {error: message}"]
    I -->|"Response.json({user})"| K["AuthModal: res.ok = true"]
    K -->|"alert('登录成功')"| L["window.location.reload()"]
    L -->|"页面重载"| M["重新触发 1.1 的 checkUser() 流程"]
```

### 1.3 注册流程

```mermaid
graph TB
    A["AuthModal: 点击'注册'切换"] -->|"changeMode('register')"| B["清空 email + password\nsetMode('register')"]
    B -->|"点击注册按钮"| C["AuthModal.register()"]
    C -->|"fetch POST /api/auth/register\nbody: {email, password}"| D["app/api/auth/register/route.ts → POST()"]
    D -->|"supabase.auth.signUp({email, password})"| E["Supabase: 创建用户 + 发送确认邮件"]
    E -->|"成功"| F["Response.json({user})"]
    E -->|"失败(邮箱已存在等)"| G["Response.json({error}, 400)"]
```

### 1.4 登出流程

```mermaid
graph TB
    A["ChatBox 顶部: 点击 Exit 按钮"] -->|"outLogout() callback"| B["ChatLayout.handleLogout()"]
    B -->|"fetch POST /api/auth/layout"| C["app/api/auth/layout/route.ts → POST()"]
    C -->|"supabase.auth.signOut()"| D["Supabase: 清除 auth Cookie"]
    D -->|"Response.json({success:true})"| E["handleLogout: res.ok = true"]
    E -->|"setUser(null)"| F["清空用户状态"]
    E -->|"setConversationId('')"| G["清空当前对话"]
    E -->|"setResume(null)"| H["清空简历数据"]
    E -->|"setReport(null)"| I["清空分析报告"]
    E -->|"setOptimizedSections({})"| J["清空优化段落"]
    E -->|"setAnalyzing(false)"| K["重置分析状态"]
    E -->|"setMode('resume_optimize')"| L["重置为默认模式"]
    E -->|"setRefresh(pre+1)"| M["Sidebar useEffect 重新触发\n但 isLogin=false → setConversations([])"]
```

---

## 2. 对话管理流程

### 2.1 创建新对话

```mermaid
graph TB
    A["Sidebar: 点击 '+ New Chat' 按钮"] -->|"检查 isLogin"| B{isLogin?}
    B -->|false| C["alert('Please login first')"]
    B -->|true| D["fetch POST /api/conversation"]
    D --> E["app/api/conversation/route.ts → POST()"]
    E -->|"createClient() → getUser()"| F["验证用户已登录"]
    F -->|"supabase.from('conversations').insert({title:'新对话', user_id:user.id})"| G["Supabase: conversations 表插入新行"]
    G -->|".select().single()"| H["返回 {data: {id, title, created_at, ...}}"]
    H -->|"Response.json({data})"| I["Sidebar: data.data.id"]
    I -->|"onSelectConversation(data.data.id)"| J["ChatLayout: setConversationId(newId)"]
    J -->|"useEffect [conversationId] 触发"| K["ChatBox useEffect: loadHistory()"]
    J -->|"useEffect [conversationId] 触发"| L["ChatLayout useEffect:\nsetResume(null), setReport(null),\nsetOptimizedSections({}), setAnalyzing(false)"]
    K -->|"fetch GET /api/messages?conversationId=newId"| M["返回空消息列表 {messages: []}"]
    M -->|"setMessages(history)"| N["ChatBox: 消息列表清空"]
```

### 2.2 切换对话

```mermaid
graph TB
    A["Sidebar: 点击对话列表项"] -->|"onSelectConversation(item.id)"| B["ChatLayout: setConversationId(id)"]
    B -->|"useEffect [conversationId]"| C["ChatBox useEffect: loadHistory()"]
    B -->|"useEffect [conversationId]"| D["ChatLayout useEffect: 重置简历状态"]
    C -->|"fetch GET /api/messages?conversationId=id"| E["app/api/messages/route.ts → GET()"]
    E -->|"验证 user + 验证 conversation 归属"| F["supabase.from('messages').select()\n.eq('conversation_id', id)\n.order('created_at', ASC)"]
    F -->|"返回 messages 数组"| G["ChatBox.loadHistory(): data.messages"]
    G -->|".map(msg => {id, role, parts:[{type:'text', text:msg.content}]})"| H["转换为 useChat 格式"]
    H -->|"setMessages(history)"| I["MessageList 渲染历史消息"]
```

### 2.3 删除对话

```mermaid
graph TB
    A["Sidebar: 点击 🗑 图标"] -->|"e.stopPropagation()\nconfirm('确认删除?')"| B["onDeleteConversation(item.id)"]
    B -->|"ChatLayout 内联函数"| C["fetch DELETE /api/conversations?id=xxx"]
    C --> D["app/api/conversations/route.ts → DELETE()"]
    D -->|"getUser() → 获取 user"| E["验证 user 已登录"]
    D -->|"searchParams.get('id')"| F["获取要删除的 id"]
    E -->|"supabase.from('conversations').select().eq('id',id).single()"| G["查询对话确认归属"]
    G -->|"conversation.user_id !== user.id"| H["返回 403 No permission"]
    G -->|"归属正确"| I["supabase.from('messages').delete().eq('conversation_id', id)"]
    I -->|"删除所有子消息"| J["supabase.from('conversations').delete().eq('id', id).select('id')"]
    J -->|"返回 deletedRows"| K["Response.json({success:true, deleted: N})"]
    K -->|"ChatLayout: res.ok"| L["setRefresh(pre+1) → Sidebar 重新加载"]
    K -->|"如果 id === conversationId"| M["setConversationId('') → 清空当前对话"]
```

### 2.4 加载对话列表

```mermaid
graph TB
    A["Sidebar useEffect\n触发条件: [refresh, isLogin]"] -->|"isLogin = false"| B["setConversations([])\nsetLoading(false)"]
    A -->|"isLogin = true"| C["fetch GET /api/conversations"]
    C --> D["app/api/conversations/route.ts → GET()"]
    D -->|"getUser()"| E["验证登录"]
    E -->|"supabase.from('conversations').select('id,title,created_at')\n.eq('user_id', user.id)\n.order('created_at', ASC)"| F["查询当前用户所有对话"]
    F -->|"Response.json({conversations: data})"| G["Sidebar: data.conversations ?? []"]
    G -->|"setConversations(list)"| H["渲染对话列表\n当前选中项高亮: activeId === item.id"]
```

---

## 3. AI 聊天消息流程

### 3.1 发送消息完整链路

```mermaid
graph TB
    A["InputBox: 用户输入文字 + 按 Enter"] -->|"handleKeyDown(e.key='Enter')"| B["InputBox.handleSubmit()"]
    B -->|"onSend(text) → ChatBox.handleSend(text)"| C["ChatBox.handleSend(text)"]
    C -->|"sendMessage({text})"| D["useChat hook 内部"]
    D -->|"构造请求体: {messages: [...], id}"| E["DefaultChatTransport.fetch() 拦截"]
    E -->|"解析原 body"| F["注入额外字段:\nconversationId: conversationIdRef.current\nmode: modeRef.current\nresume: resumeRef.current"]
    F -->|"fetch POST /api/chat\nbody: {messages, conversationId, mode, resume}"| G["app/api/chat/route.ts → POST()"]
```

### 3.2 /api/chat 内部处理流程

```mermaid
graph TB
    A["POST /api/chat"] -->|"createClient() → getUser()"| B["鉴权: 获取 user"]
    B -->|"request.json()"| C["解构: {messages, conversationId, mode, resume}"]
    C -->|"提取 userSkills = resume?.skills || []"| D["准备用户技能列表"]
    
    D --> E{"switch(mode)"}
    E -->|"'resume_optimize'"| F["getJobs({skills:userSkills, limit:5})\n→ 从 data/career-data/jobs/frontend_jobs.json 读取"]
    E -->|"'job_match'"| G["getJobs({skills:userSkills, limit:8})"]
    E -->|"'interview'"| H["categoryMap 映射 userSkills → category\ngetInterviewQuestions({category, limit:10})"]
    
    F -->|"formatJobsForPrompt(jobs)\n→ 拼接为紧凑文本(≤1500字符)"| I["buildResumeOptimizePrompt(jobsStr, examplesStr)\n→ 基础prompt + 市场岗位数据 + 优秀案例"]
    G -->|"formatJobsForPrompt(jobs)"| J["buildJobMatchPrompt(marketJobs)"]
    H -->|"formatInterviewForPrompt(questions)\n→ 编号列表(≤2000字符)"| K["buildInterviewPrompt(questions)"]
    
    I --> L["systemPrompt 就绪"]
    J --> L
    K --> L
    
    L -->|"提取最后一条用户消息 userText"| M["确保对话存在:\nsupabase.from('conversations').select().eq('id',conversationId)"]
    M -->|"不存在则 insert"| N["supabase.from('messages').insert({\nconversation_id, role:'user', content:userText\n})"]
    N -->|"保存用户消息完成"| O["streamText({\nmodel: deepseek('deepseek-v4-flash'),\ninstructions: systemPrompt,\nmessages: modelMessages\n})"]
    O -->|"返回流式响应"| P["result.toUIMessageStreamResponse()\n→ 前端实时渲染 AI 回复"]
```

### 3.3 AI 流式响应 + onFinish 回调

```mermaid
graph TB
    A["streamText onFinish({text})"] -->|"text = AI 完整回复"| B["supabase.from('messages').insert({\nconversation_id, role:'assistant', content:text\n})"]
    B -->|"保存 AI 回复到数据库"| C["查询对话标题:\nsupabase.from('conversations').select('title,user_id')\n.eq('id', conversationId).single()"]
    C --> D{title === 'New Chat' or '新对话'?}
    D -->|No| E["无需更新标题 → 完成"]
    D -->|Yes| F["generateText({\nmodel: deepseek,\nprompt: '根据内容生成≤10字中文标题...'\n})"]
    F -->|"titleResult.text.trim()"| G["supabase.from('conversations').update({title:newTitle})\n.eq('id',conversationId).eq('user_id',user.id)"]
    G -->|"标题更新完成"| H["前端: useChat onFinish 触发\nawait 3秒 → onTitleUpdate()"]
    H -->|"ChatLayout.handleRefresh()"| I["setRefresh(pre+1) → Sidebar 重新加载列表"]
```

### 3.4 消息渲染流程

```mermaid
graph TB
    A["ChatBox: useChat messages 数组"] -->|".map(m => adaptedMessages)"| B["提取 parts 中 type='text' 的文本\n拼接为 content 字符串"]
    B -->|"text === '__REPORT__'"| C["isReport = true"]
    B -->|"普通文本"| D["isReport = false"]
    C --> E["传给 MessageList"]
    D --> E
    E --> F{"msg.isReport && reportComponent?"}
    F -->|Yes| G["渲染 ResumeAnalysis 组件\n(替代文本气泡)"]
    F -->|No| H["渲染 Message 组件\n(用户/AI 气泡)"]
```

---

## 4. 简历优化完整流程（核心）

### 4.1 文件上传 + 文本提取

```mermaid
graph TB
    A["ResumeOptimizePanel: 渲染 ResumeUpload 组件\n(当 resume = null 时显示)"] --> B["用户选择文件(.md/.pdf/.docx)"]
    B -->|"input onChange"| C["ResumeUpload.uploadFile(e)"]
    C -->|"检查 conversationId 存在"| D{conversationId?}
    D -->|null| E["alert('请先点击新对话')"]
    D -->|存在| F["构造 FormData:\nformData.append('file', file)"]
    F -->|"fetch POST /api/resume/extract\nbody: FormData"| G["app/api/resume/extract/route.ts → POST()"]
    G -->|"req.formData() → file"| H["Buffer.from(file.arrayBuffer())"]
    H --> I{"文件名后缀判断"}
    I -->|".md / .txt"| J["buffer.toString('utf-8')\n→ text"]
    I -->|".pdf"| K["await import('pdf-parse')\npdfParse(buffer)\n→ pdfData.text"]
    I -->|".docx"| L["await import('mammoth')\nmammoth.extractRawText({buffer})\n→ result.value"]
    J --> M{"text.trim().length >= 20?"}
    K --> M
    L --> M
    M -->|No| N["返回 400: 文件内容过短"]
    M -->|Yes| O["Response.json({text, filename, charCount})"]
    O -->|"ResumeUpload 接收: {text, filename}"| P["text.length 个字符的简历纯文本"]
```

### 4.2 简历存储 + AI 结构化解析

```mermaid
graph TB
    A["ResumeUpload: 拿到 text 后"] --> B["步骤2: fetch POST /api/resume/upload\nbody: {filename, content: text}"]
    B --> C["app/api/resume/upload/route.ts → POST()"]
    C -->|"supabase.from('resumes').insert({\nuser_id, filename, content\n}).select().single()"| D["Supabase resumes 表: 存入原始文本"]
    D -->|"返回 {resumeId}"| E["存储完成"]
    
    A -->|"同时"| F["步骤3: fetch POST /api/resume/parse\nbody: {content: text}"]
    F --> G["app/api/resume/parse/route.ts → POST()"]
    G -->|"generateText({\nmodel: deepseek,\ninstructions: resumeParsePrompt,\nprompt: content\n})"| H["DeepSeek: 将简历文本解析为结构化 JSON"]
    H -->|"result.text"| I["JSON.parse(result.text)"]
    I -->|"返回 {success:true, data: jsonData}"| J["ResumeUpload: data.data"]
    J -->|"onParsed(resume)"| K["ChatLayout: setResume(resume)"]
    K -->|"resume = {basic:{name,email,phone},\nskills:[], projects:[{name,description,techStack}],\neducation:[]}"| L["整个应用状态更新:\nResumeOptimizePanel 显示'已上传'\nChatBox transport 注入 resume"]
```

### 4.3 用户画像生成 + 深度分析

```mermaid
graph TB
    A["ResumeUpload: 解析完成后"] -->|"步骤4 (非关键)"| B["fetch POST /api/profile/generate\nbody: {resume}"]
    A -->|"步骤5 (核心)"| C["onAnalysisStart()\n→ ChatLayout: setAnalyzing(true)"]
    C -->|"fetch POST /api/resume/analyze\nbody: {resume, skills: resume.skills}"| D["app/api/resume/analyze/route.ts → POST()"]
    
    B --> E["app/api/profile/generate/route.ts → POST()"]
    E -->|"generateText({model, prompt: profilePrompt + JSON(resume)})"| F["DeepSeek: 生成结构化用户画像"]
    F -->|"JSON.parse(cleanText)"| G["supabase.from('profiles').upsert({\nid: user.id, profile: profile\n})"]
    G -->|"存入 profiles 表"| H["画像生成完成 (不影响主流程)"]
    
    D -->|"getJobs({skills:userSkills, limit:5})"| I["从 frontend_jobs.json 加载\n按 skills 筛选相关岗位"]
    D -->|"getResumeExamples({limit:2})"| J["从 resume_examples.json 加载"]
    I -->|"formatJobsForPrompt(jobs)\n→ '- React前端 [middle] 15-25k | Skills: ...'"| K["jobsStr"]
    J -->|"formatExamplesForPrompt(examples)"| L["examplesStr"]
    K --> M["buildAnalyzePrompt(jobsStr, examplesStr)\n→ resumeAnalyzePrompt + 市场数据"]
    L --> M
    M -->|"prompt + JSON.stringify(resume)"| N["generateText({model, prompt})"]
    N -->|"DeepSeek 返回结构化 JSON"| O["清理 markdown 代码块"]
    O -->|"JSON.parse(text)"| P["report = {score:{total,content,structure,keywords},\nsummary, sections:[{type,name,original,optimized,changes,score}],\nkeyword_gaps, market_insights, next_steps}"]
    P -->|"JSON解析失败?"| Q["降级: report = {_raw:true, summary:result.text, ...}"]
    P -->|"Response.json({data: report})"| R["ResumeUpload: analyzeData.data"]
    R -->|"onAnalysis(report)"| S["ChatLayout: setReport(report)"]
```

### 4.4 报告注入聊天 + 标题生成 + 消息保存

```mermaid
graph TB
    A["ChatLayout: setReport(report) 触发"] -->|"ChatBox useEffect [report]"| B{"report && !reportAdded.current?"}
    B -->|Yes| C["reportAdded.current = true"]
    C -->|"setMessages(prev => [...prev, {\nid: crypto.randomUUID(),\nrole: 'assistant',\nparts: [{type:'text', text:'__REPORT__'}]\n}])"| D["消息列表末尾插入特殊标记消息"]
    D -->|"MessageList 渲染时检测 isReport"| E["用 ResumeAnalysis 组件替代文本"]
    E -->|"渲染: ScoreCircle + ScoreBar +\nSections(details) + Gaps + Insights + Steps"| F["用户看到完整分析报告"]
    
    G["ResumeUpload: 步骤6 (非关键)"] -->|"fetch POST /api/conversation/title\nbody: {conversationId, content: summary.substring(0,200)}"| H["app/api/conversation/title/route.ts"]
    H -->|"generateText → 生成标题"| I["supabase update conversations.title"]
    I -->|"onTitleUpdate()"| J["ChatLayout: setRefresh(+1)\n→ Sidebar 刷新显示新标题"]
    
    K["ResumeUpload: 步骤7 (非关键)"] -->|"fetch POST /api/messages\nbody: {conversationId, role:'assistant', content:summary}"| L["app/api/messages/route.ts → POST()"]
    L -->|"supabase.from('messages').insert({...})"| M["分析摘要存入消息历史"]
    
    N["ResumeUpload finally"] -->|"onAnalysisEnd()"| O["ChatLayout: setAnalyzing(false)"]
```

### 4.5 分段深度优化

```mermaid
graph TB
    A["ResumeOptimizePanel: 点击 '深度优化此段' 按钮"] -->|"handleDeepOptimize(sec, i)"| B["setOptimizingKey(key)"]
    B -->|"fetch POST /api/resume/optimize\nbody: {\n  section: sec.type,\n  sectionName: sec.name,\n  original: sec.original,\n  targetRole: '前端开发工程师',\n  skills: resume.skills\n}"| C["app/api/resume/optimize/route.ts → POST()"]
    C -->|"getJobs({skills, limit:3})"| D["加载相关岗位数据"]
    C -->|"getResumeExamples({limit:1})"| E["加载优秀案例"]
    D --> F["拼接 context: 市场参考 + 优秀写法"]
    E --> F
    F -->|"userPrompt = 目标岗位 + 优化部分 + 原始内容"| G["generateText({\nmodel,\nprompt: sectionOptimizePrompt + context + userPrompt\n})"]
    G -->|"DeepSeek 返回 JSON"| H["data = {\n  optimized: '优化后文本',\n  changes: [{what, why}],\n  interview_questions: ['追问1','追问2'],\n  tech_highlights: ['亮点1']\n}"]
    H -->|"Response.json({data})"| I["ResumeOptimizePanel: data.data"]
    I -->|"setOptimizeResult(data)"| J["显示面试追问预测"]
    I -->|"onSectionOptimized(key, data.optimized)"| K["ChatLayout.handleSectionOptimized(key, optimized)"]
    K -->|"setOptimizedSections(prev => {\n  ...prev, [key]: {optimized, accepted:true}\n})"| L["优化内容保存到 state"]
    L -->|"传递到 ResumePreview"| M["预览时使用优化后的描述"]
```

### 4.6 简历预览 + PDF 导出

```mermaid
graph TB
    A["ResumeOptimizePanel: 点击 '预览优化后简历'"] -->|"onShowPreview()"| B["ChatLayout: setShowPreview(true)"]
    B -->|"渲染 ResumePreview 组件\nprops: {resume, optimizedSections, onClose}"| C["ResumePreview 初始化"]
    C -->|"categorizeSkills(resume.skills)"| D["将技能分组为:\n基础/前端/客户端/后端/生态/AI/工程化/性能优化/其他"]
    C -->|"resume.education"| E["教育经历数据"]
    C -->|"resume.projects.map((p,i) => getDesc(p,i))"| F{"optimizedSections[key]?.accepted?"}
    F -->|Yes| G["使用优化后的文本"]
    F -->|No| H["使用原始 p.description"]
    G --> I["splitBullets(text)\n→ 按换行拆分 + 去除前缀符号"]
    H --> I
    I --> J["渲染 A4 页面:\nHeader(姓名+联系方式)\nEducation(学校+时间+课程+奖项)\nSkills(分类+顿号分隔)\nProjects(名称+角色+时间+技术栈+bullet)"]
    
    K["点击 '导出 PDF'"] -->|"handlePrint()"| L["setExporting(true)"]
    L -->|"setTimeout(100ms)"| M["window.print()"]
    M -->|"浏览器打印对话框\n@page { size:A4; margin:0 }"| N["选择'另存为PDF' → 导出完成"]
    N -->|"setExporting(false)"| O["按钮恢复可用"]
```

---

## 5. 模式切换流程

```mermaid
graph TB
    A["ModeSelector: 用户点击模式按钮"] -->|"setMode(item.value)"| B["ChatLayout: setMode(newMode)"]
    B -->|"modeRef.current = newMode\n(ChatBox useEffect)"| C["transport 下次请求时携带新 mode"]
    B -->|"RightPanel switch(mode)"| D{"newMode"}
    D -->|"'resume_optimize'"| E["渲染 ResumeOptimizePanel"]
    D -->|"'job_match'"| F["渲染 JobMatchPanel (占位)"]
    D -->|"'interview'"| G["渲染 InterviewPanel (占位)"]
    
    C -->|"用户发送下一条消息"| H["POST /api/chat\nbody.mode = newMode"]
    H -->|"API 内 switch(mode)"| I["根据新 mode 构建不同 systemPrompt\n+ 注入对应市场数据"]
```

---

## 6. 爬虫数据采集流程

### 6.1 CLI 触发

```mermaid
graph TB
    A["npm run crawl:jobs"] -->|"ts-node lib/crawlers/index.ts --task jobs"| B["lib/crawlers/index.ts → main()"]
    B -->|"args.indexOf('--task')"| C["task = 'jobs'"]
    C -->|"taskMap['jobs']"| D["crawlJobs()"]
    D -->|"readJsonFile(config.output.jobs)\n→ 读取已有 frontend_jobs.json"| E["existing = [...]"]
    E -->|"existingHashes = Set(existing.map(j=>j.hash))"| F["已有数据的哈希集合"]
    D -->|"generateJobs()\n→ 8种模板 × 3个等级 = 300条"| G["allJobs: Job[]"]
    G -->|"遍历 allJobs"| H{"existingHashes.has(job.hash)?"}
    H -->|Yes| I["stats.skipped++"]
    H -->|No| J["newJobs.push(job)"]
    J --> K["deduplicateByHash([...existing, ...newJobs])\n→ 按 hash 去重,保留最新"]
    K -->|"writeJsonFile(config.output.jobs, merged)"| L["写入 data/career-data/jobs/frontend_jobs.json"]
```

### 6.2 API 触发

```mermaid
graph TB
    A["fetch POST /api/crawler/run?task=jobs"] --> B["app/api/crawler/run/route.ts → POST()"]
    B -->|"getUser() 鉴权"| C["验证用户"]
    C -->|"execFileAsync('npx',\n['ts-node','lib/crawlers/index.ts','--task','jobs'])"| D["子进程执行爬虫脚本"]
    D -->|"timeout: 300000 (5分钟)"| E{"执行结果"}
    E -->|成功| F["Response.json({success, task, stdout})"]
    E -->|失败| G["Response.json({error, detail, stderr}, 500)"]
```

### 6.3 定时任务

```mermaid
graph TB
    A["npm run schedule"] -->|"ts-node lib/crawlers/scheduler.ts"| B["lib/crawlers/scheduler.ts"]
    B -->|"cron.validate(schedule)\nschedule = config.schedule = '0 2 * * *'"| C["验证 cron 表达式"]
    C -->|"cron.schedule(schedule, async ()=>{runAll()})"| D["每天凌晨 2:00 触发"]
    D -->|"依次执行"| E["crawlJobs()"]
    E --> F["crawlSkills()"]
    F --> G["crawlInterview()"]
    G --> H["crawlProjects()"]
    H --> I["crawlArticles()"]
    I --> J["输出 summary: 每个任务的 added/skipped/errors"]
```

### 6.4 数据加载器缓存机制

```mermaid
graph TB
    A["API 路由调用 getJobs({skills,limit})"] --> B["loader.ts → readJsonCached(filePath)"]
    B -->|"fs.existsSync(filePath)"| C{文件存在?}
    C -->|No| D["返回空数组 []"]
    C -->|Yes| E["fs.statSync(filePath).mtimeMs"]
    E --> F{"cache.get(filePath)?.mtime === stat.mtimeMs?"}
    F -->|Yes (60s内未修改)| G["返回缓存数据 cached.data"]
    F -->|No (文件已更新)| H["fs.readFileSync → JSON.parse"]
    H -->|"cache.set(filePath, {data, mtime})"| I["更新缓存并返回新数据"]
    I --> J["data = allJobs"]
    J --> K{"options.level?"}
    K -->|Yes| L["data = data.filter(j => j.level === level)"]
    K -->|No| M["跳过筛选"]
    L --> N{"options.skills?.length?"}
    M --> N
    N -->|Yes| O["skillSet = Set(skills)\ndata.filter(j => j.skills.some(s => skillSet.has(s)))"]
    N -->|No| P["跳过筛选"]
    O --> Q["data.slice(0, limit)"]
    P --> Q
    Q --> R["返回过滤后的 Job 数组"]
```

---

## 7. 职业数据注入 AI Prompt 的完整链路

```mermaid
graph TB
    subgraph 数据源
        F1["data/career-data/jobs/frontend_jobs.json"]
        F2["data/career-data/interview/questions.json"]
        F3["data/career-data/resume/resume_examples.json"]
        F4["data/career-data/projects/projects.json"]
    end
    
    subgraph loader 层
        L1["getJobs({skills, limit})"] --> FMT1["formatJobsForPrompt(jobs, maxChars=1500)\n→ '- React前端 [middle] 15-25k\n| Skills: React, TypeScript, ...\n- Vue前端 [junior] 9-14k\n| Skills: Vue3, Vite, ...'"]
        L2["getInterviewQuestions({category, limit})"] --> FMT2["formatInterviewForPrompt(questions, maxChars=2000)\n→ '1. [react/junior] React中useEffect...\n2. [react/middle] 如何优化...\n...'"]
        L3["getResumeExamples({limit})"] --> FMT3["formatExamplesForPrompt(examples, maxChars=2000)\n→ '## 前端开发 (middle)\nSummary: ...\nSkills: ...\nProjects:\n  - 项目名: 描述'"]
    end
    
    subgraph Prompt 构建层
        FMT1 --> P1["buildResumeOptimizePrompt(jobs, examples)"]
        FMT1 --> P2["buildJobMatchPrompt(jobs)"]
        FMT2 --> P3["buildInterviewPrompt(questions)"]
        FMT3 --> P1
        FMT1 --> P4["buildAnalyzePrompt(jobs, examples)"]
        FMT3 --> P4
    end
    
    subgraph API 路由层
        P1 --> API1["POST /api/chat (mode=resume_optimize)"]
        P2 --> API2["POST /api/chat (mode=job_match)"]
        P3 --> API3["POST /api/chat (mode=interview)"]
        P4 --> API4["POST /api/resume/analyze"]
    end
    
    subgraph AI 层
        API1 --> DS["streamText → DeepSeek\nsystemPrompt 包含真实市场数据"]
        API2 --> DS
        API3 --> DS
        API4 --> DS2["generateText → DeepSeek\nprompt 包含真实市场数据"]
    end
    
    F1 --> L1
    F2 --> L2
    F3 --> L3
```

---

## 8. 全局状态传递关系图

```mermaid
graph LR
    subgraph ChatLayout 管理的状态
        S1["conversationId: string"]
        S2["user: object | null"]
        S3["mode: Mode"]
        S4["resume: object | null"]
        S5["report: ResumeReport | null"]
        S6["optimizedSections: object"]
        S7["showPreview: boolean"]
        S8["analyzing: boolean"]
        S9["refresh: number"]
        S10["showAuth: boolean"]
    end
    
    subgraph 传递给 Sidebar
        S1 -->|"activeId"| SB1["高亮当前对话"]
        S2 -->|"isLogin"| SB2["是否显示对话列表"]
        S9 -->|"refresh"| SB3["触发重新加载"]
    end
    
    subgraph 传递给 ChatBox
        S1 -->|"conversationId"| CB1["useChat + transport"]
        S3 -->|"mode"| CB2["transport 注入 + ModeSelector"]
        S4 -->|"resume"| CB3["transport 注入"]
        S5 -->|"report"| CB4["__REPORT__ 标记 + ResumeAnalysis"]
    end
    
    subgraph 传递给 RightPanel
        S1 -->|"conversationId"| RP1["ResumeUpload 需要"]
        S3 -->|"mode"| RP2["switch 渲染不同面板"]
        S4 -->|"resume"| RP3["ResumeOptimizePanel"]
        S5 -->|"report"| RP4["显示评分 + 段落卡片"]
        S6 -->|"optimizedSections"| RP5["显示已优化状态"]
        S8 -->|"analyzing"| RP6["显示加载状态"]
    end
    
    subgraph 回调函数向上传递
        RP3 -->|"onResumeChange"| S4
        RP4 -->|"onReport"| S5
        RP5 -->|"onSectionOptimized"| S6
        RP6 -->|"onAnalyzingChange"| S8
        CB1 -->|"onTitleUpdate"| S9
    end
    
    subgraph 覆盖层组件
        S7 -->|"showPreview=true"| OVR1["ResumePreview\nprops: resume + optimizedSections"]
        S10 -->|"showAuth=true"| OVR2["AuthModal"]
    end
```


---

## 9. 页面关系与组件树图

### 9.1 页面路由与导航关系

```mermaid
graph TB
    subgraph "Next.js App Router 页面"
        ROOT["/ — app/page.tsx\nHome()\n服务端组件"]
        CHAT["/chat — app/chat/page.tsx\nChatPage()\n服务端组件"]
        TEST["/test — app/test/page.tsx\nResumeTestPage()\n客户端组件"]
    end

    subgraph "中间件保护"
        MW["app/middleware.ts\nmatcher: /chat/:path*\n未登录 → 重定向到 /\nAPI请求未登录 → 返回 401"]
    end

    ROOT -->|"redirect('/chat')"| CHAT
    MW -->|"检查 Supabase Cookie\n通过则放行"| CHAT
    MW -->|"未登录"| ROOT

    ROOT -.->|"用户手动访问 /test\n(无中间件保护)"| TEST
```

### 9.2 各页面组件树

```mermaid
graph TB
    subgraph "页面: / (根路由)"
        P_ROOT["app/page.tsx → Home()\n纯服务端: redirect('/chat')\n无UI渲染"]
    end

    subgraph "页面: /chat (主页面)"
        P_CHAT["app/chat/page.tsx → ChatPage()"]
        P_CHAT --> CL["ChatLayout\n(主容器,管理10个state)"]

        CL --> SB["Sidebar\n对话历史列表"]
        CL --> CB["ChatBox\n聊天核心"]
        CL --> RP["RightPanel\n功能面板路由"]
        CL --> AM["AuthModal\n登录/注册弹窗\n(条件渲染)"]
        CL --> PV["ResumePreview\n简历预览+PDF\n(条件渲染)"]

        SB --> BTN_NEW["'+ New Chat' 按钮"]
        SB --> CONV_LIST["对话列表项\n(点击切换 + 删除)"]

        CB --> HDR["Header\nAI Assistant + Login/Exit + 用户信息"]
        CB --> ML["MessageList\n消息列表"]
        CB --> MS["ModeSelector\n📝简历/🎯岗位/🎤面试"]
        CB --> IB["InputBox\n消息输入框"]

        ML --> MSG_U["Message (user)\n用户消息气泡"]
        ML --> MSG_A["Message (assistant)\nAI消息气泡"]
        ML --> RA["ResumeAnalysis\n分析报告组件\n(__REPORT__标记时)"]

        RP --> RP_R["ResumeOptimizePanel\n(mode=resume_optimize)"]
        RP --> RP_J["JobMatchPanel\n(mode=job_match) 占位"]
        RP --> RP_I["InterviewPanel\n(mode=interview) 占位"]

        RP_R --> RU["ResumeUpload\n文件上传+全流程编排"]
        RP_R --> SCORE["评分卡片\n总分+摘要"]
        RP_R --> SEC_CARDS["段落卡片\n深度优化按钮"]
        RP_R --> BTN_PREVIEW["'预览优化后简历' 按钮"]
    end

    subgraph "页面: /test (测试页)"
        P_TEST["app/test/page.tsx → ResumeTestPage()"]
        P_TEST --> RU_TEST["ResumeUpload\n(独立测试,回调全部 console.log)"]
    end
```

### 9.3 页面间共享的组件与数据

```mermaid
graph LR
    subgraph "共享组件"
        RU["ResumeUpload"]
        STYLES["CSS Modules\n(css/*.module.css)"]
    end

    subgraph "共享库"
        SUPA_C["lib/supabase/client.ts\n浏览器端 Supabase"]
        SUPA_S["lib/supabase/server.ts\n服务端 Supabase"]
        DS["lib/deepseek/ai.ts\nDeepSeek 客户端"]
        PROMPTS["lib/prompts/resume.ts\n所有 Prompt 模板"]
        LOADER["lib/career-data/loader.ts\n职业数据加载器"]
        TYPES["types/*.ts\n类型定义"]
    end

    subgraph "共享 API 路由"
        AUTH["/api/auth/*"]
        CHAT_API["/api/chat"]
        CONV_API["/api/conversation*"]
        MSG_API["/api/messages"]
        RESUME_API["/api/resume/*"]
        CAREER_API["/api/career/*"]
        PROFILE_API["/api/profile/*"]
    end

    subgraph "页面: /chat"
        C1["ChatLayout\n使用: SUPA_C, TYPES"]
        C2["ChatBox\n使用: CHAT_API, MSG_API, TYPES"]
        C3["ResumeUpload\n使用: RESUME_API, PROFILE_API"]
        C4["AuthModal\n使用: AUTH, SUPA_C"]
        C5["ResumePreview\n使用: STYLES"]
    end

    subgraph "页面: /test"
        T1["ResumeTestPage\n使用: RU"]
    end

    RU --> C1
    RU --> T1
    RU --> RESUME_API
    RU --> PROFILE_API

    C1 --> CONV_API
    C2 --> CHAT_API
    C2 --> MSG_API
    C4 --> AUTH

    CHAT_API --> DS
    CHAT_API --> PROMPTS
    CHAT_API --> LOADER
    CHAT_API --> SUPA_S

    RESUME_API --> DS
    RESUME_API --> PROMPTS
    RESUME_API --> LOADER
    RESUME_API --> SUPA_S

    AUTH --> SUPA_S
```

### 9.4 用户操作路径图（用户视角）

```mermaid
graph TB
    START(["用户打开浏览器\n访问 localhost:3000"]) --> REDIRECT["/ → redirect('/chat')"]
    REDIRECT --> AUTH_CHECK{"middleware 检查\nCookie 中有 JWT?"}

    AUTH_CHECK -->|No| LOGIN_PAGE["回到 /\nChatLayout 渲染\nuser=null"]
    LOGIN_PAGE --> CLICK_LOGIN["点击 Login 按钮"]
    CLICK_LOGIN --> MODAL["AuthModal 弹出\n输入 email + password"]
    MODAL --> DO_LOGIN["POST /api/auth/login"]
    DO_LOGIN --> RELOAD["window.location.reload()"]
    RELOAD --> AUTH_CHECK

    AUTH_CHECK -->|Yes| CHAT_READY["/chat 页面就绪\nChatLayout 渲染完整UI"]

    CHAT_READY --> PATH_NEW["路径A: 新建对话\n点击 '+ New Chat'"]
    CHAT_READY --> PATH_RESUME["路径B: 上传简历\n右侧面板点击上传"]
    CHAT_READY --> PATH_CHAT["路径C: 发送消息\n输入框输入文字"]
    CHAT_READY --> PATH_MODE["路径D: 切换模式\n点击底部模式按钮"]

    PATH_NEW -->|"POST /api/conversation\n→ 获得 conversationId"| CONVERSATION["对话已创建\n可开始交互"]

    CONVERSATION --> PATH_RESUME
    CONVERSATION --> PATH_CHAT

    PATH_RESUME -->|"选文件 → extract → parse\n→ analyze → report"| REPORT["分析报告生成\n聊天区+右面板同步显示"]

    REPORT --> PATH_OPTIMIZE["点击 '深度优化此段'\n→ POST /api/resume/optimize"]
    PATH_OPTIMIZE --> OPTIMIZED["段落已优化\n自动接受"]

    OPTIMIZED --> PATH_PREVIEW["点击 '预览优化后简历'"]
    PATH_PREVIEW --> PREVIEW["ResumePreview 全屏覆盖\nA4单栏模板"]

    PREVIEW --> PATH_PDF["点击 '导出 PDF'"]
    PATH_PDF --> PDF["window.print()\n浏览器保存为PDF"]

    PATH_CHAT -->|"sendMessage → POST /api/chat\n→ streamText → 流式渲染"| AI_REPLY["AI 实时回复"]
    AI_REPLY -->|"onFinish → 保存消息\n→ 生成标题"| TITLE["侧边栏标题更新"]

    PATH_MODE -->|"setMode('job_match')\n或 setMode('interview')"| MODE_SWITCH["右面板切换\n下次消息用新 systemPrompt"]
```

### 9.5 API 路由与数据库表的对应关系

```mermaid
graph LR
    subgraph "API 路由"
        A_LOGIN["POST /api/auth/login"]
        A_REG["POST /api/auth/register"]
        A_USER["GET /api/auth/user"]
        A_LOGOUT["POST /api/auth/layout"]
        A_CHAT["POST /api/chat"]
        A_CONV_POST["POST /api/conversation"]
        A_CONV_TITLE["POST /api/conversation/title"]
        A_CONVS_GET["GET /api/conversations"]
        A_CONVS_DEL["DELETE /api/conversations"]
        A_MSG_GET["GET /api/messages"]
        A_MSG_POST["POST /api/messages"]
        A_RES_UPLOAD["POST /api/resume/upload"]
        A_RES_PARSE["POST /api/resume/parse"]
        A_RES_ANALYZE["POST /api/resume/analyze"]
        A_RES_OPT["POST /api/resume/optimize"]
        A_PROF_GEN["POST /api/profile/generate"]
        A_PROF_POST["POST /api/profile"]
        A_CAREER["GET /api/career/*"]
        A_CRAWL["POST /api/crawler/run"]
    end

    subgraph "Supabase 表"
        T_USERS["auth.users\n(Supabase 内置)"]
        T_CONV["conversations\nid, user_id, title, created_at"]
        T_MSG["messages\nid, conversation_id, role, content"]
        T_RESUME["resumes\nid, user_id, filename, content"]
        T_PROFILE["profiles\nid(=user.id), profile(jsonb)"]
    end

    subgraph "外部服务"
        E_DEEPSEEK["DeepSeek API\ndeepseek-v4-flash"]
        E_FS["本地文件系统\ndata/career-data/"]
    end

    A_LOGIN -->|"signInWithPassword"| T_USERS
    A_REG -->|"signUp"| T_USERS
    A_USER -->|"getUser"| T_USERS
    A_LOGOUT -->|"signOut"| T_USERS

    A_CHAT -->|"insert user+assistant msg"| T_MSG
    A_CHAT -->|"ensure conv exists"| T_CONV
    A_CONV_POST -->|"insert"| T_CONV
    A_CONV_TITLE -->|"update title"| T_CONV
    A_CONVS_GET -->|"select by user_id"| T_CONV
    A_CONVS_DEL -->|"delete conv + msgs"| T_CONV
    A_CONVS_DEL -->|"delete msgs first"| T_MSG
    A_MSG_GET -->|"select by conv_id"| T_MSG
    A_MSG_POST -->|"insert"| T_MSG

    A_RES_UPLOAD -->|"insert"| T_RESUME
    A_PROF_GEN -->|"upsert"| T_PROFILE
    A_PROF_POST -->|"upsert"| T_PROFILE

    A_CHAT -->|"streamText"| E_DEEPSEEK
    A_RES_PARSE -->|"generateText"| E_DEEPSEEK
    A_RES_ANALYZE -->|"generateText"| E_DEEPSEEK
    A_RES_OPT -->|"generateText"| E_DEEPSEEK
    A_CONV_TITLE -->|"generateText"| E_DEEPSEEK
    A_PROF_GEN -->|"generateText"| E_DEEPSEEK

    A_RES_ANALYZE -->|"getJobs, getResumeExamples"| E_FS
    A_RES_OPT -->|"getJobs, getResumeExamples"| E_FS
    A_CHAT -->|"getJobs, getInterviewQuestions"| E_FS
    A_CAREER -->|"直接读取 JSON"| E_FS
```

---

> 文档更新时间：2026-07-25 | 共 30 个流程图，覆盖页面关系、组件树、用户操作路径、API-数据库映射
