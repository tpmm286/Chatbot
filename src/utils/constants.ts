import { AppSettings, CustomServerConfig, MemoryItem, Model, Prompt, Workflow } from '../types/chat';

export const DEFAULT_MODELS: Model[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    contextWindow: 1048576,
    description: 'مدل پرچمدار و پرسرعت برای پاسخ‌دهی روزمره و عمومی',
    recommended: true,
    type: 'text',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    contextWindow: 1048576,
    description: 'استدلال عمیق، تحلیل‌های پیچیده STEM و برنامه‌نویسی پیشرفته',
    recommended: false,
    type: 'text',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini Flash Lite',
    provider: 'Google',
    contextWindow: 1048576,
    description: 'مدل فوق سبک و کم‌حجم برای کمترین زمان تاخیر ممکن',
    recommended: false,
    type: 'text',
  },
];

export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful, respectful, and intelligent AI assistant. Follow user instructions carefully, format responses cleanly with markdown, and use code blocks where appropriate.";

export const QUANT_TRADING_SYSTEM_PROMPT = `[System Prompt]
Role: Quantitative Trading System Architect and Market Analyst.
Task: Process financial index data, generate structured JSON responses containing technical parameters, coordinate points, and analysis for automated rendering on an Electron-based TradingView interface using OpenAI API.
Guidelines:
Output Format: Strictly output a single valid JSON object representing the analysis and chart parameters. No markdown explanations or conversational text.
Market Evaluation: Compute current trend direction, volatility, and structural bias.
Coordinate Mapping: Calculate (X, Y) coordinates for price action, support levels, resistance levels, and projected trendlines.
Visualization Specs: Define styles (solid/dashed) and opacities for projected paths.
[JSON Response Schema]
{
"index_summary": {
  "trend_direction": "Upward | Downward | Neutral",
  "market_status": "string"
},
"chart_annotations": {
  "support_levels": [{"x": "number/timestamp", "y": "number"}],
  "resistance_levels": [{"x": "number/timestamp", "y": "number"}],
  "projected_trendlines": [
    {
      "start": {"x": "number", "y": "number"},
      "end": {"x": "number", "y": "number"},
      "style": "solid | dashed",
      "opacity": "number"
    }
  ]
}
}`;

export const DEFAULT_CUSTOM_SERVER: CustomServerConfig = {
  enabled: false,
  baseUrl: 'http://localhost:11434/v1',
  apiKey: '',
  modelName: 'gemma-4-31b-it',
  availableModels: [
    { id: 'gemma-4-31b-it', name: 'gemma-4-31b-it (Reasoning/Think)', type: 'text' },
    { id: 'llama3:8b', name: 'Llama 3 (8B)', type: 'text' },
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', type: 'text' },
    { id: 'whisper-large-v3', name: 'Whisper Large v3 (صوت/Audio)', type: 'audio' },
    { id: 'llava:13b', name: 'LLaVA (بینایی و تصویر/Vision)', type: 'vision' },
  ],
};

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    content: 'کاربر از مدل‌های استدلالی مانند gemma-4-31b-it روی سرور اختصاصی برای تحلیل و تفکر عمیق استفاده می‌کند.',
    category: 'preference',
    enabled: true,
    createdAt: Date.now() - 100000,
  },
  {
    id: 'mem-2',
    content: 'کاربر به تولید صوت و تصویر و استفاده از ابزارهای Low-Code علاقه‌مند است.',
    category: 'fact',
    enabled: true,
    createdAt: Date.now() - 50000,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultModel: 'gemini-3.8-flash',
  defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
  defaultTemperature: 0.7,
  language: 'fa',
  enableStream: true,
  memoryEnabled: true,
  thinkModeEnabled: true,
  thinkModeMarkdown: true,
  memories: INITIAL_MEMORIES,
  customServer: DEFAULT_CUSTOM_SERVER,
};

export const INITIAL_PROMPTS: Prompt[] = [
  {
    id: 'prompt-quant-trading',
    name: '📈 Quantitative Trading Architect',
    description: 'Processes financial index data and outputs strict JSON chart annotations',
    content: `Analyze the following financial asset or index: {{asset_name}} over timeframe {{timeframe}}.\nContext: {{market_data_or_levels}}\n\nFollow the Quantitative Trading System Architect specifications and return strictly valid JSON matching the schema.`,
    folderId: null,
    model: 'gemini-3.8-flash',
  },
  {
    id: 'prompt-code-architect',
    name: '💻 Senior Code Architect',
    description: 'Expert TypeScript, React, and systems refactoring assistant',
    content: `Review the following {{language}} code:\n\`\`\`{{language}}\n{{code}}\n\`\`\`\nProvide architectural improvements, performance optimizations, bug fixes, and clean production code.`,
    folderId: null,
    model: 'gemini-3.8-flash',
  },
  {
    id: 'prompt-persian-translation',
    name: '🌐 ترجمه تخصصی و بومی‌سازی فارسی',
    description: 'ترجمه روان، دقیق و فنی بین زبان انگلیسی و فارسی',
    content: `متن زیر را به زبان فارسی روان، اصیل و متناسب با موضوع {{topic}} ترجمه و ویراستاری کن:\n\n{{text}}`,
    folderId: null,
    model: 'gemini-3.8-flash',
  },
  {
    id: 'prompt-explain-concept',
    name: '🧠 Explain Like I Am 5 (ELI5)',
    description: 'Break down complex technical or scientific ideas into simple analogies',
    content: `Explain the concept of {{concept}} to someone with zero technical background using vivid real-world analogies.`,
    folderId: null,
    model: 'gemini-3.8-flash',
  },
];

export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-market-analysis',
    name: 'تحلیل جامع بازارهای مالی و تولید JSON تریدینگ‌ویو',
    description: 'فرآیند ۳ مرحله‌ای زنده: ۱. ارزیابی روند و نوسانات ۲. تعیین سطوح کلیدی ۳. خروجی استاندارد JSON',
    icon: 'TrendingUp',
    steps: [
      {
        id: 's1',
        title: 'مرحله ۱: ارزیابی ساختاری و جهت روند',
        description: 'تحلیل بایاس ساختاری، مومنتوم و رفتار قیمت',
        systemPrompt: 'You are a quantitative market analyst. Evaluate the market structure, trend direction, and volatility based on the provided asset data.',
        promptTemplate: 'Please perform an in-depth trend and market structure evaluation on:\n{{input}}',
      },
      {
        id: 's2',
        title: 'مرحله ۲: محاسبه سطوح حمایت و مقاومت',
        description: 'شناسایی نقدینگی، نواحی عرضه و تقاضا و خطوط روند',
        systemPrompt: 'You are a technical market architect. Based on the previous trend analysis, calculate exact numerical price support levels, resistance levels, and trendline coordinate ranges.',
        promptTemplate: 'Here is the trend evaluation from Step 1:\n{{step_1_output}}\n\nNow, calculate exact key support levels, resistance levels, and projected trendline angles.',
      },
      {
        id: 's3',
        title: 'مرحله ۳: خروجی استاندارد JSON برای تریدینگ‌ویو',
        description: 'تولید فرمت بدون مارک‌داون طبق شمای دیسکریپشن',
        systemPrompt: QUANT_TRADING_SYSTEM_PROMPT,
        promptTemplate: 'Convert the following technical levels into strictly valid JSON schema coordinates for automated rendering:\n{{step_2_output}}',
      },
    ],
  },
  {
    id: 'wf-code-architect',
    name: 'بازبینی، ریفکتور و تست خودکار کد',
    description: 'فرآیند ۳ مرحله‌ای زنده: ۱. ممیزی معماری ۲. ریفکتور تمیز ۳. تولید تست‌های یونیت جامع',
    icon: 'Code2',
    steps: [
      {
        id: 'c1',
        title: 'مرحله ۱: ممیزی معماری و اشکالات',
        description: 'بررسی باگ‌ها، آسیب‌پذیری‌ها و نقاط ضعف کارایی',
        systemPrompt: 'You are a Senior Staff Code Auditor. Review the provided code thoroughly for bottlenecks, memory leaks, and anti-patterns.',
        promptTemplate: 'Audit the following code:\n{{input}}',
      },
      {
        id: 'c2',
        title: 'مرحله ۲: بازنویسی و پیاده‌سازی تمیز',
        description: 'تولید کد کامل و مدرن تایپ‌اسکریپت/جاوااسکریپت',
        systemPrompt: 'You are a Principal Software Engineer. Rewrite and refactor the code based on the audit notes into pristine, production-grade code.',
        promptTemplate: 'Based on this audit:\n{{step_1_output}}\n\nRewrite the original code into clean, modular, and optimized production-ready code with complete types.',
      },
      {
        id: 'c3',
        title: 'مرحله ۳: ایجاد تست‌های واحد (Unit Tests)',
        description: 'تولید تست‌های جامع و پوشش لبه‌های مرزی',
        systemPrompt: 'You are a QA Automation Specialist. Write comprehensive unit tests for the refactored code covering happy paths and edge cases.',
        promptTemplate: 'Write robust unit tests for the refactored code below:\n{{step_2_output}}',
      },
    ],
  },
  {
    id: 'wf-persian-localization',
    name: 'ترجمه تخصصی، ویرایش و بومی‌سازی فارسی',
    description: 'فرآیند ۳ مرحله‌ای زنده: ۱. انتقال مفهومی ۲. بومی‌سازی و ویراستاری ۳. خلاصه نکات کلیدی',
    icon: 'Languages',
    steps: [
      {
        id: 'p1',
        title: 'مرحله ۱: انتقال دقیق مفهومی و اصطلاحات',
        description: 'معادل‌یابی اصطلاحات تخصصی فنی',
        systemPrompt: 'شما یک مترجم تخصصی ارشد هستید. متن داده‌شده را با رعایت امانت و معادل‌سازی دقیق فنی ترجمه اولیه نمایید.',
        promptTemplate: 'متن زیر را ترجمه تخصصی کنید:\n{{input}}',
      },
      {
        id: 'p2',
        title: 'مرحله ۲: بومی‌سازی و ویراستاری فارسی روان',
        description: 'نگارش روان، شایسته و مطابق اصول دستور زبان فارسی',
        systemPrompt: 'شما ویراستار متون برجسته فارسی هستید. متن ترجمه شده را به نگارشی روان، فصیح و فاخر با نیم‌فاصله‌های صحیح تبدیل کنید.',
        promptTemplate: 'ترجمه مرحله قبل را بومی‌سازی و ویراستاری حرفه‌ای کنید:\n{{step_1_output}}',
      },
      {
        id: 'p3',
        title: 'مرحله ۳: خلاصه مدیریتی و نکات کلیدی',
        description: 'استخراج پیام‌های اصلی به صورت بالت پوینت',
        systemPrompt: 'شما یک تحلیل‌گر ارشد محتوا هستید. نکات کلیدی و پیام اصلی متن بومی‌سازی شده را به صورت موردی خلاصه کنید.',
        promptTemplate: 'برای متن ویراستاری شده زیر، یک خلاصه اجرایی و نکات کلیدی به فارسی ارائه دهید:\n{{step_2_output}}',
      },
    ],
  },
];
