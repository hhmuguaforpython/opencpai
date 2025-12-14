import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  Play, 
  Download, 
  Bot, 
  Settings,
  ShieldCheck,
  Loader2,
  History,
  Sparkles,
  Send,
  UserCheck,
  Upload,
  Brain,
  BookOpen,
  Lightbulb,
  Scale,
  Zap,
  FileArchive,
  Eye,
  MessageCircle
} from 'lucide-react';

// ========================================
// 系统提示词 - 双模式
// ========================================
const AUDIT_SYSTEM_PROMPT = `
你是 "OpenCPAi 审计助手"，拥有 10 年经验的中国注册会计师。
专注于：审计底稿编制、会计准则解读、风险评估。
回答语气：专业严谨，但对同行友好。
当前上下文：用户正在处理 "2025年度财务报表审计"，使用的身份是 "深圳联兴会计师事务所"。
注意：所有建议仅供参考，最终判断需 CPA 复核。
`;

const CONSULTING_SYSTEM_PROMPT = `
你是 "OpenCPAi 咨询专家"，一位拥有 20 年经验的审计咨询专家，风格类似陈版主(chenyiwei)。
你的分析方法是"审计三步法"：
1. 📚 理论依据：引用企业会计准则(CAS)原文
2. 💡 实务参考：提供行业实务案例和专家观点
3. ✅ 综合分析：结合事实给出专业建议

请严格按以下格式输出：

## 📚 Step 1: 理论依据
[引用企业会计准则具体条款]

## 💡 Step 2: 实务参考  
[提供行业惯例、专家观点或类似案例]

## ✅ Step 3: 综合分析
[结合准则和实务给出明确建议]

## ⚠️ 风险提示
[列出需要注意的事项]

---
*以上分析仅供内部参考，最终判断需 CPA 复核*
`;

// ========================================
// 主组件
// ========================================
const OpenCPAiApp = () => {
  // 产品模式切换
  const [activeProduct, setActiveProduct] = useState('audit'); // 'audit' | 'consulting'
  const [activeTab, setActiveTab] = useState('new-project');
  const [firmProfile, setFirmProfile] = useState('深圳联兴会计师事务所（普通合伙）');
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [showChat, setShowChat] = useState(true);
  
  // 咨询模式状态
  const [consultingQuery, setConsultingQuery] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '您好！我是 OpenCPAi 智能审计助手。我可以帮您查询会计准则、分析异常波动或撰写附注。' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatContainerRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAiThinking]);

  // 切换产品时更新欢迎消息
  useEffect(() => {
    if (activeProduct === 'audit') {
      setMessages([
        { role: 'assistant', content: '您好！我是 OpenCPAi 智能审计助手。我可以帮您查询会计准则、分析异常波动或撰写附注。' }
      ]);
    } else {
      setMessages([
        { role: 'assistant', content: '您好！我是 OpenCPAi 智能咨询专家。\n\n我采用 **"审计三步法"** 分析问题：\n1. 📚 理论依据（准则原文）\n2. 💡 实务参考（行业案例）\n3. ✅ 综合分析（专业建议）\n\n请描述您的问题，我来帮您分析。' }
      ]);
    }
  }, [activeProduct]);

  // --- Qwen API Call ---
  const callQwen = async (userQuery) => {
    setIsAiThinking(true);
    try {
      const systemPrompt = activeProduct === 'audit' ? AUDIT_SYSTEM_PROMPT : CONSULTING_SYSTEM_PROMPT;
      const apiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const aiText = data.text || "抱歉，我暂时无法处理该请求。";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

    } catch (error) {
      console.error("Qwen API Failed:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "网络连接异常，请检查网络状态。", isError: true }]);
    } finally {
      setIsAiThinking(false);
      setIsConsulting(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
    const query = inputMessage;
    setInputMessage('');
    callQwen(query);
  };

  const handlePresetPrompt = (prompt, enrichedPrompt) => {
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    callQwen(enrichedPrompt || prompt);
  };

  // 咨询模式提交
  const handleConsultingSubmit = () => {
    if (!consultingQuery.trim()) return;
    setIsConsulting(true);
    setMessages(prev => [...prev, { role: 'user', content: consultingQuery }]);
    callQwen(consultingQuery);
    setConsultingQuery('');
  };

  // --- Demo Simulation Logic ---
  const startProcessing = () => {
    setStatus('processing');
    setLogs([]);
    
    const steps = [
      { msg: '📦 正在解压上传的压缩包...', delay: 600 },
      { msg: '🔍 识别到 3 个文件：科目余额表.xlsx, 审计报告.pdf, 财务报表.xlsx', delay: 1200 },
      { msg: '🧹 调用 Jenny 引擎清洗科目余额表...', delay: 1800 },
      { msg: '✅ 识别到金蝶云星空格式，已标准化为 8 列数据', delay: 2400 },
      { msg: '📄 正在解析上期 PDF 审计报告...', delay: 3000 },
      { msg: '🧠 调用 WEI 方法论引擎提取期初数...', delay: 3600 },
      { msg: '✅ AI 提取期初数完成，校验通过', delay: 4200 },
      { msg: '📊 正在进行底稿分配与重分类计算...', delay: 4800 },
      { msg: '✨ 调用 Qwen 撰写附注：公司基本情况、会计政策...', delay: 5400 },
      { msg: '📝 调用 Ling 引擎填入 Excel 模板 (保留公式)...', delay: 6000 },
    ];

    let currentStep = 0;
    
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLogs(prev => [...prev, steps[currentStep].msg]);
        currentStep++;
      } else {
        clearInterval(interval);
        setStatus('reviewing'); 
      }
    }, 600);
  };

  useEffect(() => {
    if (status === 'reviewing') {
      const timer = setTimeout(() => {
        setStatus('completed');
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '✅ 底稿生成完毕！我已经初步审阅了数据，发现 **销售费用-业务招待费** 较上期增长 45%，建议您重点关注。需要我为您生成该科目的抽凭计划吗？' 
        }]);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [status]);

  // 主题颜色
  const themeColor = activeProduct === 'audit' ? 'blue' : 'purple';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* 左侧导航栏 */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-${themeColor}-500 rounded-lg flex items-center justify-center font-bold text-xl text-white`}>O</div>
            <span className="text-xl font-bold tracking-tight text-white">OpenCPAi</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">智能辅助审计助手</p>
        </div>
        
        {/* 产品切换 */}
        <div className="p-4 border-b border-slate-700">
          <div className="bg-slate-800 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveProduct('audit')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                activeProduct === 'audit' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={14} />
              辅助审计
            </button>
            <button
              onClick={() => setActiveProduct('consulting')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                activeProduct === 'consulting' 
                  ? 'bg-purple-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain size={14} />
              辅助咨询
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {activeProduct === 'audit' ? (
            <>
              <button 
                onClick={() => setActiveTab('new-project')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'new-project' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Play size={18} />
                新建审计项目
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <History size={18} />
                历史项目档案
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Settings size={18} />
                事务所配置
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('new-consulting')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'new-consulting' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <MessageCircle size={18} />
                新建咨询
              </button>
              <button 
                onClick={() => setActiveTab('consulting-history')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'consulting-history' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <History size={18} />
                咨询记录
              </button>
              <button 
                onClick={() => setActiveTab('knowledge')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'knowledge' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <BookOpen size={18} />
                知识库
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">李</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">李建航</p>
              <p className="text-xs text-slate-400">专业版会员</p>
            </div>
          </div>
        </div>
      </div>

      {/* 中间主工作区 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 顶部状态栏 */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {activeProduct === 'audit' ? '年报审计项目工作台' : '智能咨询工作台'}
            </h1>
            <p className="text-sm text-slate-500">
              {activeProduct === 'audit' ? '当前任务：2025年度财务报表审计' : '审计三步法 · 专业分析'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500">当前事务所身份</span>
                <select 
                  value={firmProfile}
                  onChange={(e) => setFirmProfile(e.target.value)}
                  className={`text-sm font-semibold text-${themeColor}-700 bg-${themeColor}-50 border border-${themeColor}-200 rounded px-2 py-1 outline-none cursor-pointer hover:bg-${themeColor}-100 transition-colors`}
                >
                  <option>深圳联兴会计师事务所（普通合伙）</option>
                  <option>天健会计师事务所（特殊普通合伙）深圳分所</option>
                  <option>中勤万信会计师事务所（特殊普通合伙）深圳分所</option>
                </select>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8 pb-20">
          
          {/* ========== 审计模式内容 ========== */}
          {activeProduct === 'audit' && (
            <>
              {/* Demo 体验区 */}
              <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} />
                      <span className="font-bold text-lg">首次体验？47秒见证奇迹！</span>
                    </div>
                    <p className="text-white/80 text-sm mb-1">没有准备数据？没关系！点击下方按钮，用预制的测试样本，</p>
                    <p className="text-yellow-200 font-medium text-sm">完整跑通一次流程，感受AI辅助底稿生成的魅力</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <button 
                        onClick={startProcessing}
                        className="bg-white text-slate-800 px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <Eye size={18} />
                        <Zap size={16} className="text-orange-500" />
                        一键体验 Demo
                      </button>
                      <button className="border border-white/50 text-white px-5 py-2.5 rounded-full font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Download size={16} />
                        下载测试样本
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 ml-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold">47</div>
                      <div className="text-xs text-white/70">秒完成</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">85%</div>
                      <div className="text-xs text-white/70">效率提升</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">0</div>
                      <div className="text-xs text-white/70">手动录入</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 智能识别上传区 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileArchive className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">智能识别上传</h3>
                      <p className="text-xs text-slate-500">拖入多个文件，AI 自动分类</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">支持 .xls .xlsx .pdf</span>
                </div>
                
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer">
                  <Upload className="text-slate-400 mb-3" size={40} />
                  <p className="text-slate-600">拖拽文件到这里，或 <span className="text-blue-600 font-medium hover:underline">点击选择文件</span></p>
                  <p className="text-xs text-slate-400 mt-2">
                    科目余额表 <span className="text-orange-500">必传</span> | 序时账、财务报表、审计报告等 可选
                  </p>
                </div>
                
                <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> SSL 加密传输</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> 服务器不留存原始数据</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> 处理完 24 小时自动删除</span>
                </div>
              </div>

              {/* 核心操作区：两个卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 卡片 1: 上期数据 (PDF) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">1</span>
                      上期审计报告
                    </h3>
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">已解析</span>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 group-hover:bg-blue-50/30 transition-colors cursor-pointer">
                    <FileText className="text-red-400 mb-2" size={32} />
                    <p className="text-sm font-medium text-slate-700">2024年审计报告.pdf</p>
                    <p className="text-xs text-slate-400 mt-1">AI 已提取期初数 & 附注文本</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle2 size={14} /> 资产负债表平衡
                    <CheckCircle2 size={14} /> 附注提取完成
                  </div>
                </div>

                {/* 卡片 2: 本期数据 (Excel) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">2</span>
                      本期财务数据
                    </h3>
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">已清洗</span>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 group-hover:bg-blue-50/30 transition-colors cursor-pointer">
                    <FileSpreadsheet className="text-green-500 mb-2" size={32} />
                    <p className="text-sm font-medium text-slate-700">2025科目余额表_金蝶.xlsx</p>
                    <p className="text-xs text-slate-400 mt-1">Jenny 引擎已标准化</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle2 size={14} /> 借贷平衡
                    <CheckCircle2 size={14} /> 科目映射 100%
                  </div>
                </div>

              </div>

              {/* 行动按钮 / 处理日志 */}
              <div className="flex justify-center">
                 {status === 'idle' ? (
                    <button 
                      onClick={startProcessing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-blue-200 transform hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Play size={18} fill="currentColor" />
                      启动 OpenCPAi 引擎生成底稿
                    </button>
                 ) : (
                   <div className="w-full max-w-2xl bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-sm shadow-2xl">
                     <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-3">
                        {status === 'processing' && <Loader2 className="animate-spin text-blue-400" />}
                        {status === 'reviewing' && <UserCheck className="animate-pulse text-yellow-400" />}
                        {status === 'completed' && <CheckCircle2 className="text-green-400" />}
                        
                        <span className="font-bold text-white">
                          {status === 'processing' && 'OpenCPAi 引擎处理中...'}
                          {status === 'reviewing' && 'CPA 专家智能复核中...'}
                          {status === 'completed' && '处理完成，准备交付'}
                        </span>
                     </div>
                     
                     <div className="space-y-2 h-48 overflow-y-auto">
                       {logs.map((log, i) => (
                         <div key={i} className="flex items-start gap-2">
                           <span className="text-blue-500">➜</span>
                           <span>{log}</span>
                         </div>
                       ))}
                       {status === 'reviewing' && (
                         <div className="flex items-start gap-2 text-yellow-400 bg-yellow-400/10 p-2 rounded">
                           <ShieldCheck size={16} className="mt-0.5" />
                           <span>正在进行 OpenCPAi 专家校验：检查现金流量表勾稽关系... (人工监督环节)</span>
                         </div>
                       )}
                       {status === 'completed' && (
                         <div className="flex items-start gap-2 text-green-400 bg-green-400/10 p-2 rounded">
                           <CheckCircle2 size={16} className="mt-0.5" />
                           <span>生成成功！所有底稿公式已保留，附注已生成。</span>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
              </div>

              {/* 结果交付区 */}
              {status === 'completed' && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                  <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                    <CheckCircle2 /> 审计成果已就绪
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-lg hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3">
                           <FileSpreadsheet className="text-green-600" />
                           <div className="text-left">
                              <p className="font-semibold text-slate-800">2025审计底稿_完整版.xlsx</p>
                              <p className="text-xs text-slate-500">含完整公式、链接 | 联兴标准格式</p>
                           </div>
                        </div>
                        <Download className="text-slate-300 group-hover:text-green-600" />
                     </button>
                     
                     <button className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-lg hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3">
                           <FileText className="text-blue-600" />
                           <div className="text-left">
                              <p className="font-semibold text-slate-800">审计报告正文及附注.docx</p>
                              <p className="text-xs text-slate-500">AI 已完成附注撰写 | 联兴标准抬头</p>
                           </div>
                        </div>
                        <Download className="text-slate-300 group-hover:text-blue-600" />
                     </button>
                  </div>
                </div>
              )}

              {/* 开发者介绍 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="text-center mb-6">
                  <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">关于开发者</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-3">由资深签字注册会计师打造</h3>
                  <p className="text-slate-500 text-sm mt-1">"这不仅仅是一段代码，这是 10 年上市公司审计经验的数字化结晶。"</p>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                    李
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-bold text-lg text-slate-800">李建航</h4>
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">中国执业注册会计师</span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>10年</strong>上市公司审计实战经验，累计担任 <strong>4家</strong>上市公司签字会计师</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>精通 <strong>IFRS 与 CAS 准则</strong>及合并财务报表编制，具备全流程财税管理、内控体系搭建能力</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>深耕 <strong>IPO 财务规范</strong>与内控整改，熟悉 IDC、新能源、电商等 <strong>20+ 行业</strong>财务特性</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== 咨询模式内容 ========== */}
          {activeProduct === 'consulting' && (
            <>
              {/* 咨询介绍 */}
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={24} />
                  <span className="font-bold text-xl">审计三步法 · 专业咨询</span>
                </div>
                <p className="text-white/80 mb-4">
                  基于企业会计准则和行业实务经验，为您提供专业的审计咨询分析。
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <BookOpen size={20} className="mb-2" />
                    <div className="font-semibold">Step 1: 理论依据</div>
                    <p className="text-xs text-white/70 mt-1">引用CAS准则原文</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <Lightbulb size={20} className="mb-2" />
                    <div className="font-semibold">Step 2: 实务参考</div>
                    <p className="text-xs text-white/70 mt-1">行业案例与专家观点</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <Scale size={20} className="mb-2" />
                    <div className="font-semibold">Step 3: 综合分析</div>
                    <p className="text-xs text-white/70 mt-1">结合事实给出建议</p>
                  </div>
                </div>
              </div>

              {/* 咨询输入区 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageCircle className="text-purple-600" size={20} />
                  描述您的问题
                </h3>
                <textarea
                  value={consultingQuery}
                  onChange={(e) => setConsultingQuery(e.target.value)}
                  placeholder="例如：我们公司签订了一份碳履约管理服务合同，合同约定按减排量收取服务费，但部分收入存在不确定性，请问如何确认收入？"
                  className="w-full h-40 p-4 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-slate-500">
                    提示：描述越详细，分析越准确
                  </div>
                  <button
                    onClick={handleConsultingSubmit}
                    disabled={!consultingQuery.trim() || isConsulting}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isConsulting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Brain size={16} />
                        开始分析
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 常见问题快捷入口 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">常见咨询问题</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { q: '收入确认时点如何判断？', icon: '💰' },
                    { q: '关联方交易如何披露？', icon: '🔗' },
                    { q: '商誉减值测试怎么做？', icon: '📉' },
                    { q: '研发费用资本化条件？', icon: '🔬' },
                    { q: '股份支付如何核算？', icon: '📊' },
                    { q: '租赁准则新旧衔接？', icon: '🏢' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setConsultingQuery(item.q);
                      }}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm text-slate-700">{item.q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* 右侧 AI Copilot 侧边栏 */}
      {showChat && (
        <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
           <div className={`p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r ${activeProduct === 'audit' ? 'from-blue-50' : 'from-purple-50'} to-white`}>
              <div className="flex items-center gap-2">
                 <Sparkles className={activeProduct === 'audit' ? 'text-blue-600' : 'text-purple-600'} size={18} />
                 <span className="font-bold text-slate-800">
                   {activeProduct === 'audit' ? 'OpenCPAi 审计助手' : 'OpenCPAi 咨询专家'}
                 </span>
              </div>
              <span className={`text-xs ${activeProduct === 'audit' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'} px-2 py-0.5 rounded-full`}>
                通义千问 Powered
              </span>
           </div>

           {/* 聊天内容区 */}
           <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50" ref={chatContainerRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                     msg.role === 'assistant' 
                       ? (activeProduct === 'audit' ? 'bg-blue-100' : 'bg-purple-100')
                       : 'bg-slate-200'
                   }`}>
                      {msg.role === 'assistant' 
                        ? <Bot size={16} className={activeProduct === 'audit' ? 'text-blue-600' : 'text-purple-600'} /> 
                        : <span className="text-xs font-bold text-slate-600">我</span>
                      }
                   </div>
                   <div className={`p-3 rounded-2xl shadow-sm text-sm border max-w-[85%] ${
                     msg.role === 'assistant' 
                       ? 'bg-white rounded-tl-none border-slate-100 text-slate-700' 
                       : `${activeProduct === 'audit' ? 'bg-blue-600 border-blue-600' : 'bg-purple-600 border-purple-600'} rounded-tr-none text-white`
                   } ${msg.isError ? 'text-red-500 border-red-100 bg-red-50' : ''}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                   </div>
                </div>
              ))}
              
              {/* AI 思考动画 */}
              {isAiThinking && (
                <div className="flex gap-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activeProduct === 'audit' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <Loader2 size={16} className={`animate-spin ${activeProduct === 'audit' ? 'text-blue-600' : 'text-purple-600'}`} />
                   </div>
                   <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-500 border border-slate-100">
                      {activeProduct === 'audit' ? '正在分析数据与准则库...' : '正在进行三步法分析...'}
                   </div>
                </div>
              )}
           </div>

           {/* 预设指令区 */}
           <div className="p-3 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                {activeProduct === 'audit' ? (
                  <>
                    <button 
                      onClick={() => handlePresetPrompt(
                        "📊 分析一下今年的毛利率波动，生成底稿说明。",
                        `请根据以下模拟数据分析毛利率波动：
                        - 2024年（上期）：收入 5000万，成本 3500万，毛利率 30%
                        - 2025年（本期）：收入 6000万，成本 4800万，毛利率 20%
                        主要原因：本期原材料价格上涨约 15%，且为抢占市场份额主动降低了部分产品售价。
                        请生成一段审计底稿中的"毛利率变动分析说明"，要求语气专业。`
                      )}
                      className="px-3 py-2 bg-white border border-blue-200 hover:bg-blue-50 rounded-full text-blue-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Sparkles size={12} /> 分析毛利率
                    </button>
                    <button 
                      onClick={() => handlePresetPrompt(
                        "⚠️ 检查是否存在关联方交易风险。",
                        "请列出审计中常见的关联方交易风险点，并给出针对性的审计程序建议。针对中小企业审计场景。"
                      )}
                      className="px-3 py-2 bg-white border border-blue-200 hover:bg-blue-50 rounded-full text-blue-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Sparkles size={12} /> 关联方排查
                    </button>
                    <button 
                      onClick={() => handlePresetPrompt("📝 生成管理建议书草稿，针对内控缺陷。")}
                      className="px-3 py-2 bg-white border border-blue-200 hover:bg-blue-50 rounded-full text-blue-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Sparkles size={12} /> 建议书草稿
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handlePresetPrompt("收入确认的五步法模型具体如何应用？")}
                      className="px-3 py-2 bg-white border border-purple-200 hover:bg-purple-50 rounded-full text-purple-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                    >
                      <BookOpen size={12} /> 收入五步法
                    </button>
                    <button 
                      onClick={() => handlePresetPrompt("商誉减值测试的关键步骤和注意事项？")}
                      className="px-3 py-2 bg-white border border-purple-200 hover:bg-purple-50 rounded-full text-purple-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Scale size={12} /> 商誉减值
                    </button>
                    <button 
                      onClick={() => handlePresetPrompt("研发费用资本化的条件和时点判断？")}
                      className="px-3 py-2 bg-white border border-purple-200 hover:bg-purple-50 rounded-full text-purple-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Lightbulb size={12} /> 研发资本化
                    </button>
                  </>
                )}
              </div>
           </div>

           {/* 输入框 */}
           <div className="p-4 bg-white border-t border-slate-200">
              <div className="relative">
                 <textarea 
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                   placeholder={activeProduct === 'audit' ? "输入指令，如：研发费用能否资本化？" : "输入咨询问题..."} 
                   className={`w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:border-${themeColor}-500 focus:ring-2 focus:ring-${themeColor}-100 outline-none text-sm resize-none`}
                   rows={3}
                   disabled={isAiThinking}
                 />
                 <button 
                   onClick={handleSendMessage}
                   disabled={isAiThinking || !inputMessage.trim()}
                   className={`absolute right-3 bottom-3 text-slate-400 hover:text-${themeColor}-600 disabled:text-slate-300`}
                 >
                    <Send size={20} />
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {/* 悬浮聊天按钮 */}
      {!showChat && (
        <button 
          onClick={() => setShowChat(true)}
          className={`fixed bottom-6 right-6 w-14 h-14 ${activeProduct === 'audit' ? 'bg-blue-600' : 'bg-purple-600'} text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50`}
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
};

export default OpenCPAiApp;
