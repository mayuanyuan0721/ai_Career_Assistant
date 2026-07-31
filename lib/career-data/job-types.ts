export interface Job {
  title: string;
  level: string;
  experience: string;
  salary: string;
  skills: string[];
  responsibility: string;
  description: string;
  source: string;
  location?: string;      // 工作地点
  company?: string;       // 公司名称
  jobUrl?: string;        // 岗位链接
  collected_at?: string;  // 爬取时间
}