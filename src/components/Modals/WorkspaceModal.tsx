import React, { useEffect, useState } from 'react';
import { FolderCode, FolderUp, FileText, RefreshCw, Download, X, Loader2, Save } from 'lucide-react';
import { readFolderProject, readZipProject } from '../../utils/projectImport';

type WorkspaceFile = { path: string; size: number };
interface Props { open: boolean; onClose: () => void; language: 'fa' | 'en' }

export const WorkspaceModal: React.FC<Props> = ({ open, onClose, language }) => {
  const [workspaceId, setWorkspaceId] = useState('');
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [agentPlan, setAgentPlan] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [agentRequest, setAgentRequest] = useState('پروژه را بررسی کن، مشکلات و وظایف فنی را اولویت‌بندی کن.');
  const [checkOutput, setCheckOutput] = useState('');
  const fa = language === 'fa';

  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem('coding-agent-workspace');
    if (saved) {
      setWorkspaceId(saved);
      refresh(saved);
    }
  }, [open]);

  async function refresh(id = workspaceId) {
    if (!id) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${id}/files`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'خطا در دریافت فایل‌ها');
      setFiles(data.files || []);
      setStatus(fa ? `${data.files?.length || 0} فایل شناسایی شد.` : `${data.files?.length || 0} files found.`);
    } catch (e: any) { setStatus(e.message); }
    finally { setBusy(false); }
  }

  async function importFiles(imported: Array<{ path: string; content: string }>) {
    if (!imported.length) { setStatus(fa ? 'فایل قابل استفاده‌ای پیدا نشد.' : 'No usable files found.'); return; }
    setBusy(true); setStatus(fa ? 'در حال آماده‌سازی فضای کاری...' : 'Preparing workspace...');
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: imported }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');
      setWorkspaceId(data.id); localStorage.setItem('coding-agent-workspace', data.id);
      setFiles(data.files || []); setSelectedPath(''); setContent('');
      setStatus(fa ? `پروژه با ${data.fileCount} فایل آماده شد.` : `Workspace ready with ${data.fileCount} files.`);
    } catch (e: any) { setStatus(e.message); }
    finally { setBusy(false); }
  }

  async function openFile(filePath: string) {
    setSelectedPath(filePath); setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/file?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Read failed');
      setContent(data.content);
    } catch (e: any) { setStatus(e.message); }
    finally { setBusy(false); }
  }

  async function saveFile() {
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/file`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Save failed');
      setStatus(fa ? 'تغییرات در فضای کاری ذخیره شد.' : 'Changes saved to workspace.');
      await refresh();
    } catch (e: any) { setStatus(e.message); }
    finally { setBusy(false); }
  }

  async function analyzeProject() {
    if (!workspaceId) return;
    setBusy(true); setStatus(fa ? 'در حال تحلیل فایل‌های پروژه با هوش مصنوعی...' : 'AI is analyzing project files...');
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/agent/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: agentRequest }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setAgentPlan(data); setProposal(null); setStatus(fa ? 'تحلیل انجام شد؛ توجه کن که هنوز هیچ تستی اجرا نشده است.' : 'Analysis complete; no tests have been run yet.');
    } catch (e: any) { setStatus(e.message); } finally { setBusy(false); }
  }

  async function proposeImplementation(task: string) {
    if (!workspaceId) return;
    setBusy(true); setStatus(fa ? 'در حال آماده‌سازی پیشنهاد تغییر کد...' : 'Preparing code-change proposal...');
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/agent/implement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Proposal failed');
      setProposal(data); setStatus(fa ? 'پیشنهاد آماده شد؛ قبل از اعمال، فایل‌ها را بررسی کن.' : 'Proposal ready; review before applying.');
    } catch (e: any) { setStatus(e.message); } finally { setBusy(false); }
  }

  async function applyProposal() {
    if (!workspaceId || !proposal?.changes?.length) return;
    if (!window.confirm(fa ? 'تغییرات پیشنهادی در فضای کاری اعمال شوند؟ از فایل‌های قبلی نسخه پشتیبان گرفته می‌شود.' : 'Apply proposed changes to this workspace? Backups will be created.')) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/agent/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ changes: proposal.changes }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Apply failed');
      setStatus((fa ? 'تغییرات اعمال شد: ' : 'Applied: ') + data.applied.join(', ')); setProposal(null); await refresh();
    } catch (e: any) { setStatus(e.message); } finally { setBusy(false); }
  }

  async function runCheck(script: string) {
    if (!workspaceId) return;
    const warning = fa
      ? `قرار است npm run ${script} در پوشه پروژه اجرا شود. اسکریپت‌های پروژه می‌توانند کد دلخواه اجرا کنند؛ فقط پروژه‌ای را اجرا کن که به آن اعتماد داری. ادامه می‌دهی؟`
      : `This will run npm run ${script} inside the project. Project scripts can execute arbitrary code; only run projects you trust. Continue?`;
    if (!window.confirm(warning)) return;
    setBusy(true); setStatus((fa ? 'در حال اجرای ' : 'Running ') + script + '...');
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Check failed');
      setCheckOutput(`${script}: ${data.success ? 'SUCCESS' : 'FAILED'} (exit ${data.exitCode})\n\n${data.output}\n\n${data.note || ''}`);
      setStatus(data.success ? (fa ? 'بررسی با موفقیت تمام شد.' : 'Check passed.') : (fa ? 'بررسی با خطا تمام شد.' : 'Check failed.'));
    } catch (e: any) { setStatus(e.message); setCheckOutput(e.message); } finally { setBusy(false); }
  }

  async function exportWorkspace() {
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/export`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Export failed');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'workspace-export.json'; a.click();
      URL.revokeObjectURL(url);
      setStatus(fa ? 'نسخه پشتیبان فضای کاری دانلود شد.' : 'Workspace backup downloaded.');
    } catch (e: any) { setStatus(e.message); }
    finally { setBusy(false); }
  }

  if (!open) return null;
  return <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-2 sm:p-5" dir={fa ? 'rtl' : 'ltr'}>
    <section className="w-full max-w-5xl h-[88vh] bg-[#202123] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2"><FolderCode className="text-emerald-400"/><div><h2 className="font-bold">{fa ? 'فضای کاری پروژه' : 'Project Workspace'}</h2><p className="text-xs text-gray-400">{fa ? 'ورود ZIP یا انتخاب پوشه محلی' : 'Import ZIP or select a local folder'}</p></div></div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X size={18}/></button>
      </header>
      <div className="p-3 flex flex-wrap gap-2 border-b border-white/10">
        <label className="cursor-pointer px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm flex items-center gap-2">
          <FolderUp size={16}/>{fa ? 'انتخاب فایل ZIP' : 'Choose ZIP'}
          <input className="hidden" type="file" accept=".zip,application/zip" onChange={async e => { const f=e.target.files?.[0]; if(f) { try { await importFiles(await readZipProject(f)); } catch(err:any) { setStatus(err.message); } } e.currentTarget.value=''; }}/>
        </label>
        <label className="cursor-pointer px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center gap-2">
          <FolderCode size={16}/>{fa ? 'انتخاب پوشه محلی' : 'Choose local folder'}
          <input className="hidden" type="file" multiple {...({ webkitdirectory: '', directory: '' } as any)} onChange={async e => { if(e.target.files?.length) { try { await importFiles(await readFolderProject(e.target.files)); } catch(err:any) { setStatus(err.message); } } e.currentTarget.value=''; }}/>
        </label>
        <button disabled={!workspaceId || busy} onClick={() => refresh()} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm flex items-center gap-2 disabled:opacity-40"><RefreshCw size={15}/>{fa ? 'به‌روزرسانی' : 'Refresh'}</button>
        <button disabled={!workspaceId || busy} onClick={exportWorkspace} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm flex items-center gap-2 disabled:opacity-40"><Download size={15}/>{fa ? 'خروجی پشتیبان' : 'Export backup'}</button>
      </div>
      {status && <div className="px-4 py-2 text-xs text-emerald-300 border-b border-white/5">{status}</div>}
      <div className="p-3 border-b border-white/10 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <input value={agentRequest} onChange={e => setAgentRequest(e.target.value)} className="flex-1 min-w-[180px] rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-xs text-white" placeholder={fa ? 'درخواست تحلیل پروژه...' : 'Describe the project task...'} />
          <button disabled={!workspaceId || busy} onClick={analyzeProject} className="px-3 py-2 rounded-lg bg-violet-600 text-white text-xs disabled:opacity-40">{fa ? 'تحلیل هوشمند' : 'AI Analyze'}</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['lint','build','test'] as const).map(script => <button key={script} disabled={!workspaceId || busy} onClick={() => runCheck(script)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs disabled:opacity-40">{script}</button>)}
        </div>
        {agentPlan && <div className="max-h-48 overflow-auto rounded-xl bg-black/20 border border-white/10 p-3 text-xs space-y-2">
          <strong>{agentPlan.summary}</strong>
          <div className="text-gray-400">{fa ? `${agentPlan.scannedFiles} فایل شناسایی شد؛ ${agentPlan.sampledFiles} فایل متنی نمونه‌برداری شد.` : `${agentPlan.scannedFiles} files found; ${agentPlan.sampledFiles} text files sampled.`}</div>
          {(agentPlan.tasks || []).map((task: any, i: number) => <div key={i} className="border-t border-white/10 pt-2"><div className="font-semibold">{i+1}. {task.title}</div><p className="text-gray-400 my-1">{task.description}</p><div className="text-gray-500">{(task.files || []).join(', ')}</div><button disabled={busy} onClick={() => proposeImplementation(`${task.title}\n${task.description}\nFiles: ${(task.files || []).join(', ')}`)} className="mt-2 px-2 py-1 rounded bg-emerald-700/70 text-white">{fa ? 'پیشنهاد اصلاح کد' : 'Propose code fix'}</button></div>)}
          <div className="text-amber-300">{fa ? 'این تحلیل به‌تنهایی به معنی اجرای تست یا تأیید صحت کد نیست.' : 'Analysis does not mean tests were executed or code was verified.'}</div>
        </div>}
        {proposal && <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/20 p-3 text-xs space-y-2"><strong>{proposal.summary}</strong>{proposal.changes.map((c: any, i: number) => <div key={i} className="text-gray-300">{c.path} · {c.content.length} chars</div>)}<div className="flex gap-2"><button disabled={busy} onClick={applyProposal} className="px-3 py-1.5 rounded bg-emerald-600 text-white">{fa ? 'تأیید و اعمال تغییرات' : 'Approve & apply'}</button><button onClick={() => setProposal(null)} className="px-3 py-1.5 rounded bg-white/10">{fa ? 'رد پیشنهاد' : 'Discard'}</button></div></div>}
        {checkOutput && <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-[10px] text-gray-300">{checkOutput}</pre>}
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(180px,0.8fr)_2fr]">
        <aside className="overflow-auto border-b md:border-b-0 md:border-l border-white/10 p-2 custom-scrollbar">
          <div className="text-xs text-gray-400 px-2 py-2">{fa ? 'فایل‌های پروژه' : 'Project files'}</div>
          {files.map(file => <button key={file.path} onClick={() => openFile(file.path)} className={`w-full text-start text-xs px-2 py-2 rounded-lg flex items-center gap-2 ${selectedPath===file.path?'bg-emerald-500/15 text-emerald-300':'text-gray-300 hover:bg-white/5'}`}><FileText size={14} className="shrink-0"/><span className="truncate">{file.path}</span></button>)}
          {!files.length && <p className="text-xs text-gray-500 p-2">{fa ? 'برای شروع ZIP یا پوشه پروژه را انتخاب کن.' : 'Choose a ZIP or project folder to begin.'}</p>}
        </aside>
        <div className="min-h-0 flex flex-col p-3">
          {selectedPath ? <><div className="flex justify-between items-center gap-2 mb-2"><span className="text-xs text-gray-300 truncate">{selectedPath}</span><button onClick={saveFile} disabled={busy} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs flex items-center gap-1 disabled:opacity-40"><Save size={13}/>{fa?'ذخیره':'Save'}</button></div><textarea value={content} onChange={e=>setContent(e.target.value)} spellCheck={false} className="flex-1 min-h-0 resize-none rounded-xl bg-[#151619] border border-white/10 p-3 text-xs text-gray-200 font-mono outline-none focus:border-emerald-500" /></> : <div className="flex-1 grid place-items-center text-center text-gray-500 text-sm"><div><FolderCode size={42} className="mx-auto mb-3 opacity-40"/>{fa ? 'یک فایل را برای مشاهده یا ویرایش انتخاب کن.' : 'Select a file to view or edit.'}</div></div>}
          {busy && <div className="text-xs text-gray-400 flex items-center gap-2 pt-2"><Loader2 size={13} className="animate-spin"/>{fa?'در حال پردازش...':'Working...'}</div>}
        </div>
      </div>
      <footer className="p-3 border-t border-white/10 text-[11px] text-amber-300/80">{fa ? 'توجه: پوشه محلی به‌صورت یک نسخه کاری روی سرور کپی می‌شود؛ تغییرات اینجا مستقیماً روی پوشه اصلی کامپیوتر اعمال نمی‌شوند. برای نگهداری تغییرات، خروجی پشتیبان بگیر.' : 'Note: the selected local folder is copied to a server workspace; edits here do not directly modify the original folder. Export a backup to keep changes.'}</footer>
    </section>
  </div>;
};
