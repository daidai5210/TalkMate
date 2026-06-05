import type { FeedbackItem, GrammarIssues, SuggestionItem } from '../../services/summaryService';

export interface TrainingTaskMeta {
  scenarioName: string;
  title: string;
  role: string;
  goal: string;
  level: string;
  duration: string;
  focus: string[];
  starterPhrases: string[];
}

const taskMetas: TrainingTaskMeta[] = [
  {
    scenarioName: '面试',
    title: '60 秒英文自我介绍',
    role: '面试官',
    goal: '清晰介绍背景、经验与岗位匹配点',
    level: '中等',
    duration: '8 分钟',
    focus: ['结构清晰', '避免中文直译', '突出成果'],
    starterPhrases: [
      'I would like to briefly introduce myself.',
      'One project I am proud of is...',
      'My main responsibility was...',
      'This experience helped me develop...',
    ],
  },
  {
    scenarioName: '会议',
    title: '会议中表达并推进观点',
    role: '持不同意见的同事',
    goal: '表达观点、回应反对意见并推动结论',
    level: '进阶',
    duration: '10 分钟',
    focus: ['观点表达', '礼貌反驳', '总结推进'],
    starterPhrases: [
      'I would like to share my perspective.',
      'I see your point, but I have a different view.',
      'Could we align on the next step?',
      'To summarize, I think we should...',
    ],
  },
  {
    scenarioName: '旅行',
    title: '旅行突发问题协商',
    role: '酒店前台',
    goal: '说明问题、提出诉求并争取解决方案',
    level: '基础',
    duration: '7 分钟',
    focus: ['礼貌请求', '问题说明', '协商表达'],
    starterPhrases: [
      'Excuse me, I have a problem with...',
      'Could you please help me check it?',
      'Is it possible to change...',
      'I would appreciate it if you could...',
    ],
  },
  {
    scenarioName: '点餐',
    title: '餐厅点餐与特殊需求',
    role: '餐厅服务员',
    goal: '完成点餐、询问推荐并说明偏好',
    level: '基础',
    duration: '6 分钟',
    focus: ['自然提问', '偏好说明', '礼貌表达'],
    starterPhrases: [
      'Could you recommend something popular?',
      'I would like to order...',
      'Does this dish contain...?',
      'Could I have it without...?',
    ],
  },
  {
    scenarioName: '日常',
    title: '自然破冰聊天',
    role: '新认识的朋友',
    goal: '自然开启话题、回应问题并延续对话',
    level: '基础',
    duration: '8 分钟',
    focus: ['破冰表达', '开放式提问', '延续话题'],
    starterPhrases: [
      'It is nice to meet you.',
      'What do you usually do in your free time?',
      'That sounds interesting. Could you tell me more?',
      'I have been trying to improve my English speaking.',
    ],
  },
];

const fallbackTask: TrainingTaskMeta = {
  scenarioName: '通用',
  title: '真实场景口语任务',
  role: 'AI 口语教练',
  goal: '完成一段有目标的英语沟通',
  level: '中等',
  duration: '8 分钟',
  focus: ['大胆开口', '表达完整', '自然回应'],
  starterPhrases: [
    'I would like to explain my idea.',
    'Could you give me a moment to think?',
    'Let me put it another way.',
    'That is a good question.',
  ],
};

export function getTrainingTaskMeta(name?: string | null): TrainingTaskMeta {
  if (!name) return fallbackTask;
  return taskMetas.find((item) => name.includes(item.scenarioName)) ?? fallbackTask;
}

export function getTaskCompletionScore(score: number, feedbackCount: number): number {
  const penalty = Math.min(feedbackCount * 3, 12);
  return Math.max(55, Math.min(98, Math.round(score + 4 - penalty)));
}

export function getMandarinIssueTags(feedback: FeedbackItem[], grammarIssues: GrammarIssues | null): string[] {
  const tags = new Set<string>();
  const text = feedback.map((item) => `${item.reason} ${item.suggestion} ${item.original}`).join(' ').toLowerCase();

  if (grammarIssues?.word_order || text.includes('word order') || text.includes('语序')) tags.add('语序中式化');
  if (grammarIssues?.article_usage || text.includes('article') || text.includes('冠词')) tags.add('冠词缺失');
  if (grammarIssues?.tense_errors || text.includes('tense') || text.includes('时态')) tags.add('时态弱化');
  if (text.includes('preposition') || text.includes('介词')) tags.add('介词误用');
  if (text.includes('literal') || text.includes('直译') || text.includes('unnatural')) tags.add('中文直译');
  if (text.includes('natural') || text.includes('表达') || text.includes('地道')) tags.add('表达不够自然');
  if (feedback.length >= 3) tags.add('错误集中度偏高');
  if (tags.size === 0) tags.add(feedback.length === 0 ? '表达稳定' : '表达细节待打磨');

  return Array.from(tags).slice(0, 4);
}

export function getNextActionSuggestion(tags: string[], suggestions: SuggestionItem[]): string {
  if (tags.includes('中文直译') || tags.includes('表达不够自然')) {
    return '建议下一次练习“中式英语改写”，把正确句进一步改成自然、适合场景的表达。';
  }
  if (tags.includes('语序中式化')) {
    return '建议下一次重点练习短句表达，先用主谓宾说清楚，再补充原因和细节。';
  }
  if (tags.includes('冠词缺失') || tags.includes('介词误用') || tags.includes('时态弱化')) {
    return '建议下一次选择同一任务复练，重点关注冠词、介词和时态这些高频基础点。';
  }
  if (suggestions.length > 0) return `建议下一次优先处理：${suggestions[0].content}`;
  return '建议下一次进入推荐任务，继续保持开口频率并尝试更完整地展开回答。';
}
