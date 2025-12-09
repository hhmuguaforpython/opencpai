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
  UserCheck
} from 'lucide-react';

// --- 阿里千问 API Configuration ---
const apiKey = process.env.REACT_APP_QWEN_API_KEY || ""; 

const SYSTEM_PROMPT = `
你是一个名为 "OpenCPAi 助手" 的专业审计 AI。
你的角色：拥有 10 年经验的中国注册会计师 (CPA)，专注于协助中小事务所进行审计底稿编制和风险评估。
你的能力：
1. 解答中国企业会计准则 (CAS) 和审计准则相关问题。
2. 分析财务数据波动原因（如毛利率下降、应收账款激增）。
3. 撰写审计底稿附注和管理建议书。
4. 语气专业、严谨，但对同行（审计员）友好。
当前上下文：用户正在处理 "2025年度财务报表审计"，使用的身份是 "深圳联兴会计师事务所"。
请用中文简练地回答。
`;

const OpenCPAiApp = () => {
  const [activeTab, setActiveTab] = useState('new-project');
  const [firmProfile, setFirmProfile] = useState('深圳联兴会计师事务所（普通合伙）');
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [showChat, setShowChat] = useState(true);
  
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

  // --- Gemini API Call ---
  const callGemini = async (userQuery) => {
    setIsAiThinking(true);
    try {
      const payload = {
        model: "qwen-plus",
        input: {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userQuery }
          ]
        }
      };

      const response = await fetch(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.output?.text || data.output?.choices?.[0]?.message?.content || "抱歉，我暂时无法处理该请求。";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

    } catch (error) {
      console.error("Qwen API Failed:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "网络连接异常，请检查 API Key 配置或网络状态。", isError: true }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    callGemini(inputMessage);
  };

  const handlePresetPrompt = (prompt) => {
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    let enrichedPrompt = prompt;
    if (prompt.includes("毛利率")) {
      enrichedPrompt = `
      请根据以下模拟数据分析毛利率波动：
      - 2024年（上期）：收入 5000万，成本 3500万，毛利率 30%
      - 2025年（本期）：收入 6000万，成本 4800万，毛利率 20%
      主要原因：本期原材料价格上涨约 15%，且为抢占市场份额主动降低了部分产品售价。
      请生成一段审计底稿中的"毛利率变动分析说明"，要求语气专业。
      `;
    } else if (prompt.includes("关联方")) {
      enrichedPrompt = `
      请列出审计中常见的关联方交易风险点，并给出针对性的审计程序建议。针对中小企业审计场景。
      `;
    }

    callGemini(enrichedPrompt);
  };

  // --- Simulation Logic ---
  const startProcessing = () => {
    setStatus('processing');
    setLogs([]);
    
    const steps = [
      { msg: '正在调用 UniversalCleaner 清洗本期余额表...', delay: 800 },
      { msg: '识别到金蝶云星空格式，已标准化为 8 列数据...', delay: 1600 },
      { msg: '正在解析上期 PDF 审计报告...', delay: 2400 },
      { msg: 'AI 提取期初数完成，校验通过...', delay: 3200 },
      { msg: '正在进行底稿分配与重分类计算...', delay: 4000 },
      { msg: '✨ 调用 Gemini 撰写附注：公司基本情况、会计政策...', delay: 4800 },
      { msg: '正在填入 Excel 模板 (保留公式中)...', delay: 5600 },
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
    }, 800);
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* 左侧导航栏 */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl text-white">O</div>
            <span className="text-xl font-bold tracking-tight text-white">OpenCPAi</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">人工监督 · 智能审计</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
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
            <h1 className="text-xl font-bold text-slate-800">年报审计项目工作台</h1>
            <p className="text-sm text-slate-500">当前任务：2025年度财务报表审计</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500">当前事务所身份</span>
                <select 
                  value={firmProfile}
                  onChange={(e) => setFirmProfile(e.target.value)}
                  className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <option>深圳联兴会计师事务所（普通合伙）</option>
                  <option>天健会计师事务所（特殊普通合伙）深圳分所</option>
                  <option>中勤万信会计师事务所（特殊普通合伙）深圳分所</option>
                </select>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8 pb-20">
          
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
                <p className="text-xs text-slate-400 mt-1">UniversalCleaner 已标准化</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 size={14} /> 借贷平衡
                <CheckCircle2 size={14} /> 科目映射 100%
              </div>
            </div>

          </div>

          {/* 行动按钮 */}
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
                      {status === 'processing' && '系统自动化处理中...'}
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

        </main>
      </div>

      {/* 右侧 AI Copilot 侧边栏 */}
      {showChat && (
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2">
                 <Sparkles className="text-blue-600" size={18} />
                 <span className="font-bold text-slate-800">OpenCPAi 专家助手</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Gemini Powered</span>
           </div>

           {/* 聊天内容区 */}
           <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50" ref={chatContainerRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                      {msg.role === 'assistant' ? <Bot size={16} className="text-blue-600" /> : <span className="text-xs font-bold text-slate-600">我</span>}
                   </div>
                   <div className={`p-3 rounded-2xl shadow-sm text-sm border max-w-[80%] ${
                     msg.role === 'assistant' 
                       ? 'bg-white rounded-tl-none border-slate-100 text-slate-700' 
                       : 'bg-blue-600 rounded-tr-none border-blue-600 text-white'
                   } ${msg.isError ? 'text-red-500 border-red-100 bg-red-50' : ''}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                   </div>
                </div>
              ))}
              
              {/* AI 思考动画 */}
              {isAiThinking && (
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Loader2 size={16} className="text-blue-600 animate-spin" />
                   </div>
                   <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-500 border border-slate-100">
                      正在分析数据与准则库...
                   </div>
                </div>
              )}
           </div>

           {/* 预设指令区 */}
           <div className="p-2 bg-slate-50 border-t border-slate-200 overflow-x-auto whitespace-nowrap">
              <div className="flex gap-2 px-2">
                 <button 
                   onClick={() => handlePresetPrompt("📊 分析一下今年的毛利率波动，生成底稿说明。")}
                   className="px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 rounded-full text-blue-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                 >
                   <Sparkles size={12} /> 分析毛利率
                 </button>
                 <button 
                   onClick={() => handlePresetPrompt("⚠️ 检查是否存在关联方交易风险。")}
                   className="px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 rounded-full text-blue-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                 >
                   <Sparkles size={12} /> 关联方排查
                 </button>
                 <button 
                   onClick={() => handlePresetPrompt("📝 生成管理建议书草稿，针对内控缺陷。")}
                   className="px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 rounded-full text-blue-700 text-xs transition-colors shadow-sm flex items-center gap-1"
                 >
                   <Sparkles size={12} /> 建议书草稿
                 </button>
              </div>
           </div>

           {/* 输入框 */}
           <div className="p-4 bg-white border-t border-slate-200">
              <div className="relative">
                 <input 
                   type="text" 
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                   placeholder="输入指令，如：研发费用能否资本化？" 
                   className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                   disabled={isAiThinking}
                 />
                 <button 
                   onClick={handleSendMessage}
                   disabled={isAiThinking || !inputMessage.trim()}
                   className="absolute right-2 top-2 text-slate-400 hover:text-blue-600 disabled:text-slate-300"
                 >
                    <Send size={18} />
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {/* 悬浮按钮 (手机端或折叠侧边栏时用) */}
      {!showChat && (
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-50"
        >
          <Bot />
        </button>
      )}
    </div>
  );
};

export default OpenCPAiApp;
