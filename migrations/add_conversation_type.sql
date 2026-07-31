-- 添加 type 字段到 conversations 表
ALTER TABLE conversations 
ADD COLUMN type TEXT DEFAULT 'chat' CHECK (type IN ('chat', 'interview'));

-- 添加面试相关字段（可选）
ALTER TABLE conversations 
ADD COLUMN interview_data JSONB DEFAULT '{}';

-- 添加索引优化查询
CREATE INDEX idx_conversations_type ON conversations(type);

