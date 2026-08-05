-- 禁用 RLS（行级安全）以便迁移数据
-- 注意：生产环境应该创建正确的策略而不是禁用 RLS

-- 禁用所有表的 RLS
ALTER TABLE industries DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE resume_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions DISABLE ROW LEVEL SECURITY;

-- 如果需要启用 RLS，使用以下命令：
-- ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- 创建策略（生产环境推荐）
-- 例如：允许所有用户读取行业数据
-- CREATE POLICY "Allow public read access on industries"
-- ON industries FOR SELECT
-- USING (true);

-- 允许认证用户插入/更新
-- CREATE POLICY "Allow authenticated users to insert"
-- ON industries FOR INSERT
-- WITH CHECK (auth.role() = 'authenticated');
