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
      'Hello, my name is Alex. I have five years of experience in software development.',
      'I would like to briefly introduce myself and explain why I am interested in this role.',
      'One project I am proud of is the mobile app I built last year, which improved our team efficiency by thirty percent.',
      'My main responsibility was to lead the frontend team and deliver features on time.',
      'This experience helped me develop strong communication skills and the ability to work under pressure.',
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
      'I would like to share my perspective on the timeline for this project.',
      'I see your point, but I have a different view on how we should prioritize the features.',
      'Could we align on the next step before we end the meeting today?',
      'To summarize, I think we should launch the beta version next month and gather user feedback.',
      'I agree with the general direction, and I would like to add one more suggestion for the rollout plan.',
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
      'Excuse me, I have a problem with my reservation. The room number on my key card does not match my booking.',
      'Could you please help me check whether my flight has been delayed?',
      'Is it possible to change my room to a quieter one on a higher floor?',
      'I would appreciate it if you could arrange a taxi to the airport for me tomorrow morning.',
      'Thank you for your help. Could you tell me the best way to get to the city center from here?',
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
      'Could you recommend something popular that is not too spicy?',
      'I would like to order the grilled salmon with a side salad, please.',
      'Does this dish contain any nuts or dairy products? I have a mild allergy.',
      'Could I have it without onions and with the sauce on the side?',
      'That sounds great. I will have a glass of water and the check when we are finished, please.',
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
      'It is nice to meet you. I just moved to this neighborhood last week.',
      'What do you usually do in your free time on weekends?',
      'That sounds interesting. Could you tell me more about how you got started with that hobby?',
      'I have been trying to improve my English speaking by practicing with native speakers.',
      'I really enjoy hiking and trying new restaurants around the city.',
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
    'I would like to explain my idea and why I think it could work well in this situation.',
    'Could you give me a moment to think about your question before I answer?',
    'Let me put it another way so my point is easier to understand.',
    'That is a good question. In my experience, the best approach is to start with a clear goal.',
    'Thank you for sharing that. I agree with most of what you said, and I have one follow-up thought.',
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
