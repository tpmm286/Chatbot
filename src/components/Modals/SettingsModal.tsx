import React, { useState, useEffect } from 'react';
import {
  X,
  Moon,
  Sun,
  Sliders,
  Check,
  Server,
  Globe,
  Brain,
  Radio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mic,
  Eye,
  FileText,
  Info,
  Sparkles,
} from 'lucide-react';
import { AppSettings, Model } from '../../types/chat';
import { translations } from '../../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  models: Model[];
  onOpenMemoryModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  models,
  onOpenMemoryModal,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverTestStatus, setServerTestStatus] = useState<{
    ok: boolean;
    message: string;
    modelCount?: number;
  } | null>(null);

  useEffect(() => {
    setFormData(settings);
    setServerTestStatus(null);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const t = translations[formData.language || 'en'];
  const isRtl = formData.language === 'fa';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleTestCustomServer = async () => {
    if (!formData.customServer.baseUrl) return;
    setIsTestingServer(true);
    setServerTestStatus(null);

    try {
      const res = await fetch('/api/custom-server/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: formData.customServer.baseUrl,
          apiKey: formData.customServer.apiKey,
          modelName: formData.customServer.modelName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        let updatedModels = formData.customServer.availableModels || [];
        if (Array.isArray(data.availableModels) && data.availableModels.length > 0) {
          updatedModels = data.availableModels;
          setFormData((prev) => ({
            ...prev,
            customServer: {
              ...prev.customServer,
              availableModels: updatedModels,
              // If current modelName isn't in list, select first detected model
              modelName: updatedModels.some((m) => m.id === prev.customServer.modelName)
                ? prev.customServer.modelName
                : updatedModels[0].id,
            },
          }));
        }

        setServerTestStatus({
          ok: true,
          message: data.message || t.connectionSuccess,
          modelCount: updatedModels.length,
        });
      } else {
        setServerTestStatus({
          ok: false,
          message: data.error || t.connectionFailed,
        });
      }
    } catch (err: any) {
      setServerTestStatus({
        ok: false,
        message: err.message || t.connectionFailed,
      });
    } finally {
      setIsTestingServer(false);
    }
  };

  const availableServerModels = formData.customServer.availableModels || [];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div className="bg-[#202123] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2b2c2f]/50">
          <div className="flex items-center gap-2.5 font-semibold text-base text-white">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>{t.settingsTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t.language}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, language: 'fa' })}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  formData.language === 'fa'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-xs'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>فارسی (Persian)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, language: 'en' })}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  formData.language === 'en'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-xs'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Globe className="w-4 h-4 text-gray-400" />
                <span>English (US)</span>
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t.theme}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'dark' })}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-medium transition-all ${
                  formData.theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{t.darkMode}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'light' })}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-medium transition-all ${
                  formData.theme === 'light'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{t.lightMode}</span>
              </button>
            </div>
          </div>

          {/* Memory Management Card */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#1e1e24] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {t.memoryTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenMemoryModal}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium hover:underline"
              >
                {formData.language === 'fa' ? 'مدیریت و ویرایش حافظه' : 'Manage Memories'} (
                {formData.memories.filter((m) => m.enabled).length})
              </button>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {formData.language === 'fa'
                ? 'حافظه بین تمام گفتگوها فعال است و هوش مصنوعی ترجیحات و فکت‌های ذخیره‌شده را در پاسخ‌ها اعمال می‌کند.'
                : 'Persistent memory is injected across all conversations so the AI always remembers your saved facts.'}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-300">{t.memoryToggle}</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    memoryEnabled: !formData.memoryEnabled,
                  })
                }
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors ${
                  formData.memoryEnabled ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                    formData.memoryEnabled
                      ? isRtl
                        ? '-translate-x-4.5'
                        : 'translate-x-4.5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Think Mode / Deep Reasoning Card */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#1e1e24] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {t.thinkModeTitle}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t.thinkModeDesc}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-300">
                {formData.language === 'fa' ? 'فعال‌سازی حالت تفکر' : 'Enable Think Mode'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    thinkModeEnabled: !formData.thinkModeEnabled,
                  })
                }
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors ${
                  formData.thinkModeEnabled ? 'bg-amber-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                    formData.thinkModeEnabled
                      ? isRtl
                        ? '-translate-x-4.5'
                        : 'translate-x-4.5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <div className="text-xs text-gray-300 font-medium">
                  {(t as any).thinkModeMarkdownTitle || 'Think Mode Markdown Format'}
                </div>
                <div className="text-[10px] text-gray-400">
                  {(t as any).thinkModeMarkdownDesc || 'Render thoughts with Markdown formatting'}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    thinkModeMarkdown: !formData.thinkModeMarkdown,
                  })
                }
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors ${
                  formData.thinkModeMarkdown ? 'bg-amber-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                    formData.thinkModeMarkdown
                      ? isRtl
                        ? '-translate-x-4.5'
                        : 'translate-x-4.5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Custom Server AI Section (Local / Private LLM) */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Server className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {formData.language === 'fa'
                      ? 'سرور هوش مصنوعی اختصاصی (Local / Private LLM)'
                      : 'Custom Private AI Server (Ollama / vLLM / LM Studio)'}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formData.language === 'fa'
                      ? 'پشتیبانی از مدل‌های محلی متنی، صوتی و بینایی تصویر'
                      : 'Support for real local text, audio, and vision models'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    customServer: {
                      ...formData.customServer,
                      enabled: !formData.customServer.enabled,
                    },
                  })
                }
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors ${
                  formData.customServer.enabled ? 'bg-emerald-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                    formData.customServer.enabled
                      ? isRtl
                        ? '-translate-x-4.5'
                        : 'translate-x-4.5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.customServer.enabled && (
              <div className="space-y-3.5 pt-2 border-t border-white/5 animate-in fade-in">
                {/* Localhost Guidance Notice */}
                {formData.customServer.baseUrl.includes('localhost') && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      {formData.language === 'fa'
                        ? 'نکته: در صورتی که سرور لوکال شما روی سیستم شخصی اجراست و این برنامه در کلود هاست شده، از تانل (مانند ngrok یا Cloudflare Tunnel) یا آی‌پی عمومی شبکه استفاده کنید تا سرور قابل دسترسی باشد.'
                        : 'Note: If your local LLM is on your local PC and this app is hosted in the cloud, use a tunnel (e.g. ngrok or Cloudflare) or your public IP.'}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-gray-300 font-medium mb-1">
                    {t.serverUrl}
                  </label>
                  <input
                    type="text"
                    value={formData.customServer.baseUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customServer: {
                          ...formData.customServer,
                          baseUrl: e.target.value,
                        },
                      })
                    }
                    placeholder="http://localhost:11434/v1 یا https://my-ollama.ngrok.app/v1"
                    className="w-full bg-[#18181f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">
                      {t.serverModelName}
                    </label>
                    <input
                      type="text"
                      value={formData.customServer.modelName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customServer: {
                            ...formData.customServer,
                            modelName: e.target.value,
                          },
                        })
                      }
                      placeholder="llama3:8b, qwen2.5, whisper, llava"
                      className="w-full bg-[#18181f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">
                      {t.serverApiKey}
                    </label>
                    <input
                      type="password"
                      value={formData.customServer.apiKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customServer: {
                            ...formData.customServer,
                            apiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="کلید سرور (در صورت نیاز)"
                      className="w-full bg-[#18181f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Detected Models List */}
                {availableServerModels.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#18181f] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-300 font-medium">
                      <span>مدل‌های شناسایی‌شده در سرور شما ({availableServerModels.length}):</span>
                      <span className="text-[10px] text-gray-500">برای انتخاب پیش‌فرض کلیک کنید</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                      {availableServerModels.map((m) => {
                        const isSelected = formData.customServer.modelName === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                customServer: {
                                  ...formData.customServer,
                                  modelName: m.id,
                                },
                              })
                            }
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {m.type === 'audio' ? (
                              <Mic className="w-3 h-3 text-amber-400" />
                            ) : m.type === 'vision' ? (
                              <Eye className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <FileText className="w-3 h-3 text-emerald-400" />
                            )}
                            <span>{m.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTestCustomServer}
                    disabled={isTestingServer || !formData.customServer.baseUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                  >
                    {isTestingServer ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال بررسی سرور و مدل‌ها...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-3.5 h-3.5" />
                        <span>تست اتصال و دریافت مدل‌ها</span>
                      </>
                    )}
                  </button>

                  {serverTestStatus && (
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        serverTestStatus.ok ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {serverTestStatus.ok ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate max-w-[260px]">
                        {serverTestStatus.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Default Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t.defaultModel}
            </label>
            <select
              value={formData.defaultModel}
              onChange={(e) =>
                setFormData({ ...formData, defaultModel: e.target.value })
              }
              className="w-full bg-[#2a2b32] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {formData.customServer.enabled && (
                <optgroup label="مدل‌های سرور اختصاصی شما">
                  <option value="custom-server-ai">
                    {formData.customServer.modelName || 'Custom Model'} (سرور اختصاصی)
                  </option>
                  {availableServerModels.map((m) => (
                    <option key={`srv-${m.id}`} value={m.id}>
                      {m.name} [{m.type === 'audio' ? 'صوت' : m.type === 'vision' ? 'تصویر' : 'متن'}]
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="مدل‌های رسمی ابری گوگل">
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t.defaultTemperature}
              </label>
              <span className="text-xs font-mono text-emerald-400">
                {formData.defaultTemperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={formData.defaultTemperature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultTemperature: parseFloat(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Default System Prompt */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t.defaultSystemPrompt}
            </label>
            <textarea
              rows={3}
              value={formData.defaultSystemPrompt}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultSystemPrompt: e.target.value,
                })
              }
              className="w-full bg-[#2a2b32] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#2b2c2f]/40 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>{t.saveSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
