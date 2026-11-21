import React, { useState } from 'react';
import {
  X,
  Workflow as WorkflowIcon,
  Plus,
  Play,
  Trash2,
  ArrowDown,
  CheckCircle2,
  Loader2,
  Sparkles,
  Send,
  Cpu,
  FileCode,
  Filter,
  Check,
  Copy,
} from 'lucide-react';
import { CustomServerConfig, LowCodeNode, LowCodeConnection } from '../../types/chat';
import { translations, Language } from '../../utils/translations';
import { MarkdownView } from '../MarkdownView';
import { copyToClipboard } from '../../utils/clipboard';

interface LowCodeCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onExportToChat: (workflowName: string, finalResult: string) => void;
  selectedModel: string;
  customServer: CustomServerConfig;
  memoryEnabled: boolean;
  memoryContext: string[];
}

export const LowCodeCanvasModal: React.FC<LowCodeCanvasModalProps> = ({
  isOpen,
  onClose,
  language,
  onExportToChat,
  selectedModel,
  customServer,
  memoryEnabled,
  memoryContext,
}) => {
  const [nodes, setNodes] = useState<LowCodeNode[]>([
    {
      id: 'node-1',
      type: 'prompt',
      label: '1. ورود داده / پرامپت اولیه',
      config: { promptText: 'تحلیل جامع بازارهای مالی و استخراج سطوح کلیدی' },
    },
    {
      id: 'node-2',
      type: 'model',
      label: '2. مدل هوش مصنوعی (LLM)',
      config: { modelId: selectedModel },
    },
    {
      id: 'node-3',
      type: 'output',
      label: '3. خروجی ساختاریافته',
      config: {},
    },
  ]);

  const [inputData, setInputData] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineOutput, setPipelineOutput] = useState('');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const t = translations[language];
  const isRtl = language === 'fa';

  if (!isOpen) return null;

  const handleAddNode = (type: 'prompt' | 'filter' | 'model' | 'json' | 'output') => {
    const id = 'node-' + Date.now();
    let label = 'بلوک جدید';
    if (type === 'prompt') label = 'پرامپت سفارشی';
    if (type === 'filter') label = 'فیلتر / پاکسازی متن';
    if (type === 'model') label = 'پردازشگر هوش مصنوعی';
    if (type === 'json') label = 'مبدل JSON / استخراج داده';
    if (type === 'output') label = 'خروجی نهایی';

    setNodes((prev) => [
      ...prev,
      {
        id,
        type,
        label,
        config: { promptText: '', modelId: selectedModel },
      },
    ]);
  };

  const handleDeleteNode = (id: string) => {
    if (nodes.length <= 1) return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleUpdateNodeConfig = (id: string, key: string, val: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, config: { ...n.config, [key]: val } } : n
      )
    );
  };

  const handleRunPipeline = async () => {
    if (!inputData.trim() || isRunning) return;
    setIsRunning(true);
    setPipelineOutput('');
    setExecutionLogs(['شروع اجرای خط لوله بصری (Low-Code Pipeline)...']);

    let currentContext = inputData;

    try {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setExecutionLogs((prev) => [...prev, `در حال اجرای بلوک: ${node.label}...`]);

        if (node.type === 'prompt') {
          currentContext = `${node.config.promptText || ''}\n\nورودی: ${currentContext}`;
        } else if (node.type === 'filter') {
          currentContext = `[فیلتر شده]: ${currentContext.trim()}`;
        } else if (node.type === 'model') {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: node.config.modelId || selectedModel,
              messages: [{ role: 'user', content: currentContext }],
              systemPrompt: 'You are an advanced low-code pipeline AI worker. Process the input cleanly and return structured results.',
              temperature: 0.5,
              customServer,
              memoryContext: memoryEnabled ? memoryContext : [],
            }),
          });

          if (!res.ok) throw new Error(`خطا در بلوک مدل هوش مصنوعی (کد ${res.status})`);

          const reader = res.body?.getReader();
          const decoder = new TextDecoder('utf-8');
          let modelRes = '';
          if (reader) {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (!line.trim().startsWith('data:')) continue;
                const dataStr = line.replace(/^data:\s*/, '');
                if (dataStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    modelRes += parsed.text;
                    setPipelineOutput(modelRes);
                  }
                } catch {}
              }
            }
          }
          currentContext = modelRes;
        } else if (node.type === 'json') {
          currentContext = `\`\`\`json\n{\n  "pipeline_input_processed": true,\n  "summary": "${currentContext.slice(0, 100).replace(/"/g, "'")}"\n}\n\`\`\``;
          setPipelineOutput(currentContext);
        } else if (node.type === 'output') {
          setPipelineOutput(currentContext);
        }

        await new Promise((r) => setTimeout(r, 200));
      }

      setExecutionLogs((prev) => [...prev, 'خط لوله با موفقیت اجرا شد!']);
    } catch (err: any) {
      setExecutionLogs((prev) => [...prev, `خطا در اجرا: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    if (!pipelineOutput) return;
    const success = await copyToClipboard(pipelineOutput);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    if (!pipelineOutput) return;
    onExportToChat('Low-Code Pipeline Visual Workflow', pipelineOutput);
    onClose();
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div className="bg-[#202123] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/25">
              <WorkflowIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">
                بوم بصری Low-Code ورک‌فلوهای هوش مصنوعی
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                بلوک‌ها را بچینید، به هم متصل کنید و خروجی را مستقیماً به چت ارسال کنید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Add Blocks */}
        <div className="p-3 border-b border-white/10 bg-[#1e1e24] flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">افزودن بلوک:</span>
            <button
              onClick={() => handleAddNode('prompt')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>پرامپت</span>
            </button>
            <button
              onClick={() => handleAddNode('model')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>مدل هوش مصنوعی</span>
            </button>
            <button
              onClick={() => handleAddNode('filter')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>فیلتر متن</span>
            </button>
            <button
              onClick={() => handleAddNode('json')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>مبدل JSON</span>
            </button>
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={!inputData.trim() || isRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/30 text-white text-xs font-semibold transition-all shadow-md shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال اجرا...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>اجرای بوم بصری</span>
              </>
            )}
          </button>
        </div>

        {/* Main Split: Canvas Nodes & Output */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          {/* Left: Canvas Nodes Stack */}
          <div className="p-4 overflow-y-auto space-y-3 border-r border-white/10 bg-[#18181f] custom-scrollbar">
            <div className="text-xs font-semibold text-gray-400 mb-2">
              زنجیره بلوک‌های پردازشی (ترتیب اجرا):
            </div>

            {nodes.map((node, index) => (
              <div
                key={node.id}
                className="p-3.5 rounded-xl border border-white/10 bg-[#22232a] space-y-2 shadow-sm relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-white">{node.label}</span>
                  </div>
                  {nodes.length > 1 && (
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="text-gray-400 hover:text-rose-400 p-1 rounded transition-colors"
                      title="حذف بلوک"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Node Config */}
                {node.type === 'prompt' && (
                  <input
                    type="text"
                    value={node.config.promptText || ''}
                    onChange={(e) =>
                      handleUpdateNodeConfig(node.id, 'promptText', e.target.value)
                    }
                    placeholder="متن دستورالعمل یا پرامپت این بلوک..."
                    className="w-full bg-[#18181f] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                )}

                {node.type === 'model' && (
                  <div className="text-[11px] text-cyan-300 font-mono bg-cyan-950/20 px-2.5 py-1 rounded border border-cyan-500/20">
                    موتور هوش مصنوعی: {customServer.enabled ? `${customServer.modelName} (سرور اختصاصی)` : selectedModel}
                  </div>
                )}

                {/* Arrow connector */}
                {index < nodes.length - 1 && (
                  <div className="flex justify-center -mb-2 mt-1">
                    <ArrowDown className="w-4 h-4 text-gray-500 animate-bounce" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: Input Data & Realtime Output */}
          <div className="p-4 overflow-y-auto flex flex-col space-y-4 bg-[#202123] custom-scrollbar">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                ورودی اولیه بوم (Input Context):
              </label>
              <textarea
                rows={3}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="متن، سوال یا داده‌ای که باید از طریق بلوک‌ها پردازش شود..."
                className="w-full bg-[#18181f] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Logs & Output */}
            <div className="flex-1 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">خروجی زنده خط لوله:</span>
                {pipelineOutput && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'کپی شد' : 'کپی'}</span>
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>انتقال به چت</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[160px] bg-[#18181f] border border-white/10 rounded-xl p-3 text-xs text-gray-100 overflow-y-auto custom-scrollbar">
                {pipelineOutput ? (
                  <MarkdownView content={pipelineOutput} />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    هنوز اجرایی انجام نشده است. ورودی را وارد کرده و دکمه اجرای بوم را بزنید.
                  </div>
                )}
              </div>

              {executionLogs.length > 0 && (
                <div className="text-[10px] font-mono text-gray-400 bg-black/30 p-2 rounded-lg max-h-24 overflow-y-auto">
                  {executionLogs.map((log, idx) => (
                    <div key={idx}>[LOG] {log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
