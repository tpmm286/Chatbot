import React, { useState } from 'react';
import {
  X,
  Workflow as WorkflowIcon,
  Play,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Code2,
  Languages,
  Sparkles,
  Send,
  Copy,
  Check,
  Server,
  Bot,
  Zap,
} from 'lucide-react';
import { CustomServerConfig, Workflow, WorkflowStep } from '../../types/chat';
import { INITIAL_WORKFLOWS } from '../../utils/constants';
import { translations, Language } from '../../utils/translations';
import { MarkdownView } from '../MarkdownView';
import { copyToClipboard } from '../../utils/clipboard';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onExportToChat: (workflowName: string, finalResult: string) => void;
  selectedModel: string;
  customServer: CustomServerConfig;
  memoryEnabled: boolean;
  memoryContext: string[];
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  language,
  onExportToChat,
  selectedModel,
  customServer,
  memoryEnabled,
  memoryContext,
}) => {
  const [workflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(
    INITIAL_WORKFLOWS[0]?.id || ''
  );
  const [initialInput, setInitialInput] = useState('');
  const [workflowModel, setWorkflowModel] = useState<string>(selectedModel);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stepOutputs, setStepOutputs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const t = translations[language];
  const isRtl = language === 'fa';

  if (!isOpen) return null;

  const currentWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  const handleRun = async () => {
    if (!initialInput.trim() || isRunning) return;
    setIsRunning(true);
    setStepOutputs({});
    setCurrentStepIndex(0);

    const outputs: Record<string, string> = {};
    let lastStepOutput = '';

    try {
      for (let i = 0; i < currentWorkflow.steps.length; i++) {
        setCurrentStepIndex(i);
        const step = currentWorkflow.steps[i];

        // Prepare prompt by replacing placeholders
        let promptText = step.promptTemplate.replace(/\{\{input\}\}/g, initialInput);
        promptText = promptText.replace(/\{\{previous_step\}\}/g, lastStepOutput);
        promptText = promptText.replace(/\{\{step_1_output\}\}/g, outputs[currentWorkflow.steps[0]?.id] || '');
        promptText = promptText.replace(/\{\{step_2_output\}\}/g, outputs[currentWorkflow.steps[1]?.id] || '');

        // Call the real API endpoint with selected model & customServer configuration
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: workflowModel,
            messages: [{ role: 'user', content: promptText }],
            systemPrompt: step.systemPrompt,
            temperature: 0.5,
            customServer,
            memoryContext: memoryEnabled ? memoryContext : [],
          }),
        });

        if (!response.ok) {
          throw new Error(`مرحله ${i + 1} با وضعیت ${response.status} متوقف شد.`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let stepOutput = '';
        let buffer = '';

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  stepOutput += parsed.text;
                  setStepOutputs((prev) => ({
                    ...prev,
                    [step.id]: stepOutput,
                  }));
                }
              } catch {
                // Ignore parse errors on stream chunk
              }
            }
          }
        }

        outputs[step.id] = stepOutput;
        lastStepOutput = stepOutput;
      }
    } catch (err: any) {
      console.error('Workflow execution error:', err);
      alert(`خطای فرآیند هوش مصنوعی: ${err.message || 'اجرا ناموفق بود'}`);
    } finally {
      setIsRunning(false);
      setCurrentStepIndex(currentWorkflow.steps.length);
    }
  };

  const finalStepId =
    currentWorkflow.steps[currentWorkflow.steps.length - 1]?.id;
  const finalResult = stepOutputs[finalStepId] || '';

  const handleCopyResult = async () => {
    if (!finalResult) return;
    const success = await copyToClipboard(finalResult);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    if (!finalResult) return;
    onExportToChat(currentWorkflow.name, finalResult);
    onClose();
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div className="bg-[#202123] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/25">
              <WorkflowIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base text-white">{t.workflows}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>پردازش زنده و واقعی هوش مصنوعی</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                اتصال زنجیره‌ای خروجی مراحل چندگانه به ورودی مرحله بعد با مدل انتخابی شما
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

        {/* Workflow Selector & Model Settings */}
        <div className="p-4 border-b border-white/10 bg-[#1e1e24] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => {
                  setActiveWorkflowId(wf.id);
                  setStepOutputs({});
                  setCurrentStepIndex(-1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeWorkflowId === wf.id
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 shadow-xs'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {wf.icon === 'TrendingUp' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : wf.icon === 'Code2' ? (
                  <Code2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Languages className="w-4 h-4 text-purple-400" />
                )}
                <span>{wf.name}</span>
              </button>
            ))}
          </div>

          {/* Model selection for workflow */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">موتور اجرا:</span>
            <select
              value={workflowModel}
              onChange={(e) => setWorkflowModel(e.target.value)}
              className="bg-[#202123] border border-white/10 text-xs text-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              {customServer.enabled && (
                <option value="custom-server-ai">
                  {customServer.modelName || 'Local AI'} (سرور اختصاصی)
                </option>
              )}
              {customServer.availableModels?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (سرور اختصاصی)
                </option>
              ))}
              <option value="gemini-3.8-flash">Gemini 2.5 Flash</option>
              <option value="gemini-4-argon">Gemini 2.5 Pro</option>
              <option value="gemini-3.1-flash-lite">Gemini Flash Lite</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Workflow Info Card */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#25262b]/40">
            <h3 className="text-sm font-semibold text-white mb-1">
              {currentWorkflow.name}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              {currentWorkflow.description}
            </p>

            {/* Steps Timeline Visualizer */}
            <div className="space-y-3">
              {currentWorkflow.steps.map((step, idx) => {
                const isStepActive = isRunning && currentStepIndex === idx;
                const isStepFinished = currentStepIndex > idx || (!isRunning && stepOutputs[step.id]);

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isStepActive
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isStepFinished
                        ? 'border-white/10 bg-[#1e1e24]'
                        : 'border-white/5 bg-[#18181f] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {isStepActive ? (
                          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        ) : isStepFinished ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-600 text-[10px] flex items-center justify-center text-gray-400 font-mono">
                            {idx + 1}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-white">
                          {step.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {step.description}
                      </span>
                    </div>

                    {/* Step Live Output */}
                    {stepOutputs[step.id] && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 text-xs text-gray-200 max-h-44 overflow-y-auto custom-scrollbar">
                        <MarkdownView content={stepOutputs[step.id]} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Initial Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              داده ورودی برای شروع فرآیند (Input Data):
            </label>
            <textarea
              rows={3}
              value={initialInput}
              onChange={(e) => setInitialInput(e.target.value)}
              placeholder="متن، کد، داده‌های تکنیکال یا موضوع مورد نظر خود را برای شروع زنجیره وارد نمایید..."
              className="w-full bg-[#1e1e24] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleRun}
              disabled={!initialInput.trim() || isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 text-white text-xs font-semibold transition-all shadow-md"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال اجرای مرحله {currentStepIndex + 1} از {currentWorkflow.steps.length}...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>اجرای زنده فرآیند ۳ مرحله‌ای</span>
                </>
              )}
            </button>

            {finalResult && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی نتیجه نهایی</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>انتقال نتیجه به گفتگو</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
