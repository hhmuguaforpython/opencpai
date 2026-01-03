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
  MessageCircle,
  X,
  AlertCircle,
  FolderOpen,
  Clock,
  ChevronRight
} from 'lucide-react';

// ========================================
// 配置常量
// ========================================
// 生产环境使用cloudflared公网URL，开发环境使用本地8088
const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8088';

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
// 统一文件卡片组件
// ========================================
const FileCard = ({ category, fileName, status, icon: Icon, color, statusText }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100/50',
    green: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100/50',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100/50',
    slate: 'bg-slate-50 border-slate-200 hover:bg-slate-100/50',
  };
  
  const iconColorClasses = {
    blue: 'text-blue-500 bg-blue-100',
    green: 'text-emerald-500 bg-emerald-100',
    purple: 'text-purple-500 bg-purple-100',
    orange: 'text-orange-500 bg-orange-100',
    slate: 'text-slate-500 bg-slate-100',
  };
  
  const statusBadgeClasses = {
    ready: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    optional: 'bg-slate-100 text-slate-500',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${colorClasses[color] || colorClasses.slate}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColorClasses[color] || iconColorClasses.slate}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{category}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClasses[status] || statusBadgeClasses.pending}`}>
              {statusText}
            </span>
          </div>
          <p className="font-medium text-slate-800 truncate text-sm">{fileName}</p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 确认弹窗组件 - 公司名称和审计截止日
// ========================================
const ConfirmDialog = ({ 
  show, 
  onClose, 
  onConfirm, 
  companyName, 
  setCompanyName, 
  auditEndDate, 
  setAuditEndDate,
  candidates 
}) => {
  if (!show) return null;

  // 半角转全角
  const toFullWidth = (str) => {
    return str.replace(/[0-9]/g, (char) => 
      String.fromCharCode(char.charCodeAt(0) + 0xFEE0)
    );
  };

  // 日期格式验证和自动转换
  const handleDateChange = (e) => {
    let value = e.target.value;
    // 半角数字转全角
    value = toFullWidth(value);
    setAuditEndDate(value);
  };

  // 验证日期格式
  const isValidDate = (dateStr) => {
    const pattern = /^２０[２-９][０-９]年[０１]?[０-９]月[０-３]?[０-９]日$/;
    return pattern.test(dateStr);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[90vw]">
        {/* 标题 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Settings size={20} className="text-blue-500" />
            确认审计信息
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-5">
          {/* 公司名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              公司名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="请输入公司全称"
            />
            {/* 来源提示 */}
            {candidates && Object.keys(candidates).length > 0 && (
              <div className="mt-2 text-xs text-slate-500 space-y-1">
                <p className="font-medium">识别来源：</p>
                {candidates.excel && (
                  <p className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    财务报表编制单位：{candidates.excel}
                  </p>
                )}
                {candidates.pdf && (
                  <p className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    审计报告：{candidates.pdf}
                  </p>
                )}
                {candidates.filename && (
                  <p className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    文件名：{candidates.filename}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 审计截止日 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              审计截止日 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={auditEndDate}
              onChange={handleDateChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                isValidDate(auditEndDate) ? 'border-slate-300' : 'border-orange-400 bg-orange-50'
              }`}
              placeholder="例：２０２４年１２月３１日"
            />
            <p className="mt-1 text-xs text-slate-400">
              格式：YYYY年MM月DD日（数字会自动转为全角）
            </p>
          </div>
        </div>

        {/* 按钮 */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!companyName.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play size={16} />
            确认并执行
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 空白上传卡片组件
// ========================================
const EmptyFileCard = ({ category, required, color }) => {
  const colorClasses = {
    blue: 'border-blue-300 hover:bg-blue-50',
    green: 'border-emerald-300 hover:bg-emerald-50',
    purple: 'border-purple-300 hover:bg-purple-50',
    orange: 'border-orange-300 hover:bg-orange-50',
  };

  return (
    <div className={`rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer ${colorClasses[color] || 'border-slate-300 hover:bg-slate-50'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Upload size={20} className="text-slate-400" />
        </div>
        <div>
          <p className="font-medium text-slate-600 text-sm">{category}</p>
          <p className="text-xs text-slate-400">
            {required ? <span className="text-orange-500">必传</span> : '可选'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 主组件
// ========================================
const OpenCPAiApp = () => {
  // 产品模式切换
  const [activeProduct, setActiveProduct] = useState('audit');
  const [activeTab, setActiveTab] = useState('new-project');
  const [firmProfile, setFirmProfile] = useState('深圳联兴会计师事务所（普通合伙）');
  const [showChat, setShowChat] = useState(true);
  
  // 文件识别状态 - 统一管理
  const [recognizedFiles, setRecognizedFiles] = useState({
    balance: null,      // 科目余额表
    journal: null,      // 序时账
    statement: null,    // 财务报表
    prior_report: null, // 上年审计报告
  });
  const [filesSource, setFilesSource] = useState(null); // 'demo' | 'upload' | null
  
  // 处理状态
  const [status, setStatus] = useState('idle'); // idle | loading | processing | completed | error
  const [logs, setLogs] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // 确认弹窗状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('2024年12月31日'); // 默认审计截止日
  const [companyNameCandidates, setCompanyNameCandidates] = useState({}); // 公司名称来源候选
  
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
  const fileInputRef = useRef(null);

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

  // ========================================
  // 重置状态函数
  // ========================================
  const resetState = () => {
    setRecognizedFiles({
      balance: null,
      journal: null,
      statement: null,
      prior_report: null,
    });
    setFilesSource(null);
    setStatus('idle');
    setLogs([]);
    setTaskId(null);
    setProgress(0);
    setErrorMessage(null);
  };

  // ========================================
  // 一键Demo功能
  // ========================================
  const handleDemoClick = async () => {
    // 1. 先重置所有状态
    resetState();
    
    setStatus('loading');
    addLog('🔄 正在加载 Demo 样本...');
    
    try {
      // 2. 调用后端获取Demo样本信息
      const response = await fetch(`${API_BASE}/api/demo-sample-v2`);
      if (!response.ok) throw new Error('获取Demo样本失败');
      
      const data = await response.json();
      
      // 3. 更新识别的文件状态
      setRecognizedFiles({
        balance: data.files?.balance ? { name: data.files.balance.name, status: 'ready' } : null,
        journal: data.files?.journal ? { name: data.files.journal.name, status: 'ready' } : null,
        statement: data.files?.profit_statement ? { name: data.files.profit_statement.name, status: 'ready' } : null,
        prior_report: data.files?.prior_report ? { name: data.files.prior_report.name, status: 'ready' } : null,
      });
      setFilesSource('demo');
      
      addLog(`✅ 识别到样本: ${data.sample_name}`);
      addLog(`📁 科目余额表: ${data.files?.balance?.name || '未找到'}`);
      addLog(`📁 序时账: ${data.files?.journal?.name || '未找到'}`);
      addLog(`📁 财务报表: ${data.files?.profit_statement?.name || '未找到'}`);
      addLog(`📁 上年审计报告: ${data.files?.prior_report?.name || '未找到'}`);
      
      setStatus('idle');
      
    } catch (error) {
      console.error('Demo加载失败:', error);
      setErrorMessage(error.message);
      setStatus('error');
      addLog(`❌ 错误: ${error.message}`);
    }
  };

  // ========================================
  // 文件上传功能
  // ========================================
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // 重置状态
    resetState();
    
    setStatus('loading');
    addLog('📤 正在上传文件...');
    
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      const response = await fetch(`${API_BASE}/api/upload-and-unpack`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('文件上传失败');
      
      const data = await response.json();
      
      // 更新识别的文件
      const newFiles = {
        balance: null,
        journal: null,
        statement: null,
        prior_report: null,
      };
      
      if (data.files) {
        for (const file of data.files) {
          // ⭐ 2025-12-22修复：映射后端category到前端状态
          // 后端返回: balance, journal, financial, audit_report
          // 前端状态: balance, journal, statement, prior_report
          if (file.category === 'balance') {
            newFiles.balance = { name: file.filename, status: 'ready' };
          } else if (file.category === 'journal') {
            newFiles.journal = { name: file.filename, status: 'ready' };
          } else if (file.category === 'financial' || file.category === 'statement') {
            newFiles.statement = { name: file.filename, status: 'ready' };
          } else if (file.category === 'audit_report' || file.category === 'prior_report' || file.category === 'audit') {
            newFiles.prior_report = { name: file.filename, status: 'ready' };
          }
        }
      }
      
      setRecognizedFiles(newFiles);
      setFilesSource('upload');
      setTaskId(data.task_id);
      
      addLog(`✅ 上传成功，识别到 ${data.files?.length || 0} 个文件`);
      setStatus('idle');
      
    } catch (error) {
      console.error('上传失败:', error);
      setErrorMessage(error.message);
      setStatus('error');
      addLog(`❌ 上传失败: ${error.message}`);
    }
  };

  // ========================================
  // 开始处理 - 直接执行Pipeline（简化版，无确认弹窗）
  // ========================================
  const handleStartProcessing = async () => {
    if (!recognizedFiles.balance) {
      setErrorMessage('请先上传科目余额表');
      return;
    }
    
    setStatus('processing');
    setProgress(0);
    addLog('🚀 开始处理...');
    addLog(`📝 使用默认参数：公司名称由后端识别，审计截止日 2024/12/31`);
    
    try {
      // ⭐ 统一调用V2.6 pipeline（Demo和上传模式都用同一个接口）
      const endpoint = `${API_BASE}/api/run-full-pipeline`;
      
      // ⭐ 简化版：直接使用默认值，让后端处理公司名称识别
      const requestBody = { 
        source: filesSource || 'demo',
        task_id: taskId || '',
        company_name: '',  // 让后端自动识别
        audit_end_date: '2024/12/31',  // 固定默认值
      };
      console.log('[DEBUG] 发送请求到 run-full-pipeline:', requestBody);
      addLog(`[DEBUG] 请求体: ${JSON.stringify(requestBody)}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),  // 使用已定义的requestBody
      });
      
      if (!response.ok) throw new Error('处理请求失败');
      
      // 启动真实的后端任务
      addLog('🔄 后端Pipeline V2.6开始执行...');
      
      // 进度模拟：预计2分钟（120秒）完成
      // 每1200ms更新一次，每次+1%（共100次 = 120秒 = 2分钟）
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            // 停在95%等待真正完成
            return 95;
          }
          return prev + 1;
        });
      }, 1200);
      
      // 等待后端真正返回结果
      const data = await response.json();
      
      // 处理完成
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('completed');
      addLog('✅ 处理完成！');
      
      // 显示结果摘要
      if (data.company_name) {
        addLog(`📁 公司: ${data.company_name}`);
      }
      if (data.processing_time) {
        addLog(`⏱ 耗时: ${data.processing_time.toFixed(1)}秒`);
      }
      if (data.total_score && data.total_max) {
        addLog(`📊 评分: ${data.total_score}/${data.total_max} (${(data.total_score/data.total_max*100).toFixed(1)}%)`);
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ 底稿生成完毕！\n\n**公司**: ${data.company_name || '未知'}\n**耗时**: ${data.processing_time?.toFixed(1) || '?'}秒\n**评分**: ${data.total_score || '?'}/${data.total_max || '?'}\n\n需要我为您分析底稿数据吗？` 
      }]);

    } catch (error) {
      console.error('处理失败:', error);
      setErrorMessage(error.message);
      setStatus('error');
      addLog(`❌ 错误: ${error.message}`);
    }
  };

  // ========================================
  // 辅助函数
  // ========================================
  const addLog = (message) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

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

  const handleConsultingSubmit = () => {
    if (!consultingQuery.trim()) return;
    setIsConsulting(true);
    setMessages(prev => [...prev, { role: 'user', content: consultingQuery }]);
    callQwen(consultingQuery);
    setConsultingQuery('');
  };

  // 主题颜色
  const themeColor = activeProduct === 'audit' ? 'blue' : 'purple';

  // ========================================
  // 渲染文件识别卡片区域
  // ========================================
  const renderFileCards = () => {
    const hasAnyFiles = Object.values(recognizedFiles).some(f => f !== null);
    
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 科目余额表 - 必传 */}
        {recognizedFiles.balance ? (
          <FileCard
            category="科目余额表"
            fileName={recognizedFiles.balance.name}
            status="ready"
            statusText="已识别"
            icon={FileSpreadsheet}
            color="blue"
          />
        ) : (
          <EmptyFileCard category="科目余额表" required={true} color="blue" />
        )}
        
        {/* 序时账 - 可选 */}
        {recognizedFiles.journal ? (
          <FileCard
            category="序时账"
            fileName={recognizedFiles.journal.name}
            status="ready"
            statusText="已识别"
            icon={FileSpreadsheet}
            color="green"
          />
        ) : (
          <EmptyFileCard category="序时账" required={false} color="green" />
        )}
        
        {/* 财务报表 - 可选 */}
        {recognizedFiles.statement ? (
          <FileCard
            category="财务报表"
            fileName={recognizedFiles.statement.name}
            status="ready"
            statusText="已识别"
            icon={FileSpreadsheet}
            color="purple"
          />
        ) : (
          <EmptyFileCard category="财务报表" required={false} color="purple" />
        )}
        
        {/* 上年审计报告 - 可选 */}
        {recognizedFiles.prior_report ? (
          <FileCard
            category="上年审计报告"
            fileName={recognizedFiles.prior_report.name}
            status="ready"
            statusText="已识别"
            icon={FileText}
            color="orange"
          />
        ) : (
          <EmptyFileCard category="上年审计报告" required={false} color="orange" />
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* 确认弹窗已移除 - 直接执行Pipeline */}

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

        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-6 pb-20">
          
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
                        onClick={handleDemoClick}
                        disabled={status === 'loading' || status === 'processing'}
                        className="bg-white text-slate-800 px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === 'loading' ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            加载中...
                          </>
                        ) : (
                          <>
                            <Eye size={18} />
                            <Zap size={16} className="text-orange-500" />
                            一键体验 Demo
                          </>
                        )}
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

              {/* 智能识别上传区 + 文件卡片 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileArchive className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">智能文件识别</h3>
                      <p className="text-xs text-slate-500">
                        {filesSource === 'demo' && '已加载Demo样本'}
                        {filesSource === 'upload' && '已识别上传文件'}
                        {!filesSource && '拖入文件或点击上传，AI自动分类'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {filesSource && (
                      <button 
                        onClick={resetState}
                        className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                        <X size={14} />
                        清空
                      </button>
                    )}
                    <span className="text-xs text-slate-400">支持 .xls .xlsx .pdf .zip</span>
                  </div>
                </div>
                
                {/* 文件卡片展示区 - 统一UI */}
                {renderFileCards()}
                
                {/* 上传区域 */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer"
                >
                  <Upload className="text-slate-400 mb-2" size={32} />
                  <p className="text-slate-600 text-sm">点击上传文件，或拖拽到此处</p>
                  <p className="text-xs text-slate-400 mt-1">支持多文件上传、压缩包自动解压</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xls,.xlsx,.pdf,.zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {/* 安全提示 */}
                <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> SSL 加密传输</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> 服务器不留存原始数据</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> 处理完 24 小时自动删除</span>
                </div>
              </div>

              {/* 处理状态区 */}
              {(status === 'processing' || status === 'completed' || logs.length > 0) && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="text-blue-500" size={20} />
                      <h3 className="font-semibold text-slate-800">处理日志</h3>
                    </div>
                    {status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                        <span className="text-sm text-blue-600">处理中 {progress}%</span>
                      </div>
                    )}
                    {status === 'completed' && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={16} />
                        处理完成
                      </span>
                    )}
                  </div>
                  
                  {/* 进度条 */}
                  {status === 'processing' && (
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* 日志列表 */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-slate-400 text-xs font-mono w-20 flex-shrink-0">{log.time}</span>
                        <span className="text-slate-700">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {status === 'error' && errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-red-800">处理出错</p>
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* 开始处理按钮 */}
              {filesSource && status !== 'processing' && status !== 'completed' && (
                <div className="flex justify-center">
                  <button
                    onClick={handleStartProcessing}
                    disabled={!recognizedFiles.balance}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <Play size={20} />
                    开始生成审计底稿
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* 完成后的下载区 */}
              {status === 'completed' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-800">底稿生成成功！</h3>
                        <p className="text-sm text-green-600">共生成 3 个文件，点击下载</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center gap-2">
                        <Download size={16} />
                        审计底稿.xlsm
                      </button>
                      <button className="bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center gap-2">
                        <Download size={16} />
                        检查报告.pdf
                      </button>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                        <Download size={16} />
                        全部下载
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 创始人介绍 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="text-center mb-4">
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">创始人</span>
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

      {/* 右侧 AI Copilot 侧边栏 - 仅咨询模式显示 */}
      {showChat && activeProduct === 'consulting' && (
        <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-2">
                 <Sparkles className="text-purple-600" size={18} />
                 <span className="font-bold text-slate-800">OpenCPAi 咨询专家</span>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                通义千问 Powered
              </span>
           </div>

           {/* 聊天内容区 */}
           <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50" ref={chatContainerRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                     msg.role === 'assistant' ? 'bg-purple-100' : 'bg-slate-200'
                   }`}>
                      {msg.role === 'assistant' 
                        ? <Bot size={16} className="text-purple-600" /> 
                        : <span className="text-xs font-bold text-slate-600">我</span>
                      }
                   </div>
                   <div className={`p-3 rounded-2xl shadow-sm text-sm border max-w-[85%] ${
                     msg.role === 'assistant' 
                       ? 'bg-white rounded-tl-none border-slate-100 text-slate-700' 
                       : 'bg-purple-600 border-purple-600 rounded-tr-none text-white'
                   } ${msg.isError ? 'text-red-500 border-red-100 bg-red-50' : ''}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                   </div>
                </div>
              ))}
              
              {/* AI 思考动画 */}
              {isAiThinking && (
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100">
                      <Loader2 size={16} className="animate-spin text-purple-600" />
                   </div>
                   <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-500 border border-slate-100">
                      正在进行三步法分析...
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
                   placeholder="输入咨询问题..." 
                   className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm resize-none"
                   rows={3}
                   disabled={isAiThinking}
                 />
                 <button 
                   onClick={handleSendMessage}
                   disabled={isAiThinking || !inputMessage.trim()}
                   className="absolute right-3 bottom-3 text-slate-400 hover:text-purple-600 disabled:text-slate-300"
                 >
                    <Send size={20} />
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {/* 悬浮聊天按钮 - 审计模式始终显示，咨询模式仅当侧边栏隐藏时显示 */}
      {(activeProduct === 'audit' || !showChat) && (
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
