/**
 * OpenCPAi 官网聊天功能 - Jenny 审计助手
 * 版本: 2.0.0
 * 功能: 对话式审计底稿生成
 */

// =====================================================
// 配置
// =====================================================
const CHAT_CONFIG = {
    // 后端 API
    backendUrl: 'https://app.opencpai.com',
    
    // UI 配置
    maxMessages: 50,
    typingDelay: 30,
    pollInterval: 2000,  // 任务轮询间隔 (ms)
};

// =====================================================
// 状态
// =====================================================
const chatState = {
    taskId: null,           // 当前任务 ID
    uploadedFiles: [],      // 已上传文件
    isProcessing: false,    // 是否正在处理
    companyName: '',        // 公司名称
    auditDate: '',          // 审计截止日
};

// =====================================================
// DOM 元素
// =====================================================
const elements = {
    messagesContainer: null,
    input: null,
    sendButton: null,
    chatFab: null,
    chatPanel: null,
    closeChat: null,
    contactBtn: null,
    contactModal: null,
    closeContact: null,
    quickPrompts: null,
    fileInput: null,      // 文件选择器
};

// =====================================================
// 初始化
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // 获取 DOM 元素
    elements.messagesContainer = document.getElementById('chat-messages');
    elements.input = document.getElementById('chat-input');
    elements.sendButton = document.getElementById('chat-send');
    elements.chatFab = document.getElementById('chat-fab');
    elements.chatPanel = document.getElementById('chat-panel');
    elements.closeChat = document.getElementById('close-chat');
    elements.contactBtn = document.getElementById('contact-btn');
    elements.contactModal = document.getElementById('contact-modal');
    elements.closeContact = document.getElementById('close-contact');
    elements.quickPrompts = document.querySelectorAll('.quick-prompt');
    
    // 创建隐藏的文件选择器
    createFileInput();
    
    // 聊天按钮事件
    if (elements.chatFab) {
        elements.chatFab.addEventListener('click', toggleChatPanel);
    }
    
    if (elements.closeChat) {
        elements.closeChat.addEventListener('click', closeChatPanel);
    }
    
    // 发送消息事件
    if (elements.sendButton) {
        elements.sendButton.addEventListener('click', handleSend);
    }
    
    if (elements.input) {
        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }
    
    // 快捷提问按钮
    elements.quickPrompts.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.textContent.trim();
            if (elements.input) {
                elements.input.value = text;
                handleSend();
            }
        });
    });
    
    // 联系开发者弹窗
    if (elements.contactBtn) {
        elements.contactBtn.addEventListener('click', openContactModal);
    }
    
    if (elements.closeContact) {
        elements.closeContact.addEventListener('click', closeContactModal);
    }
    
    if (elements.contactModal) {
        elements.contactModal.addEventListener('click', (e) => {
            if (e.target === elements.contactModal) {
                closeContactModal();
            }
        });
    }
    
    // 初始化滚动动画
    initScrollAnimations();
    
    // 初始化 Header 滚动效果
    initHeaderScroll();
    
    console.log('🚀 OpenCPAi Chat (Jenny v2.0) initialized');
});

// =====================================================
// 文件上传功能
// =====================================================
function createFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.multiple = true;
    input.style.display = 'none';
    input.addEventListener('change', handleFileSelect);
    document.body.appendChild(input);
    elements.fileInput = input;
}

async function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    addMessage(`📁 正在上传 ${files.length} 个文件...`, 'assistant');
    
    for (const file of files) {
        try {
            const result = await uploadFile(file);
            
            // 保存 task_id（后端返回的）
            if (result.task_id) {
                chatState.taskId = result.task_id;
            }
            
            // 保存文件信息
            if (result.files && result.files.length > 0) {
                // 多文件模式
                result.files.forEach(f => {
                    chatState.uploadedFiles.push({
                        name: f.filename,
                        category: f.category,
                        path: f.path,
                    });
                });
                addMessage(`✅ 已上传并识别: ${result.files.map(f => f.category_cn || f.filename).join(', ')}`, 'assistant');
            } else {
                // 单文件模式
                chatState.uploadedFiles.push({
                    name: file.name,
                    path: result.upload_path,
                });
                addMessage(`✅ 已上传: ${file.name}`, 'assistant');
            }
        } catch (error) {
            addMessage(`❌ 上传失败: ${file.name} - ${error.message}`, 'assistant');
        }
    }
    
    // 重置 file input
    event.target.value = '';
    
    // 提示下一步
    if (chatState.uploadedFiles.length > 0) {
        const taskInfo = chatState.taskId ? `\n📌 任务ID: ${chatState.taskId}` : '';
        addMessage(`\n📋 已上传 ${chatState.uploadedFiles.length} 个文件。${taskInfo}\n\n输入公司名称和审计截止日，例如：\n「联信智擎 2024-12-31」\n\n然后说「开始审计」即可生成底稿。`, 'assistant');
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    // 后端期望的字段名是 'file' 用于 upload-and-unpack
    formData.append('file', file);
    
    const response = await fetch(`${CHAT_CONFIG.backendUrl}/api/upload-and-unpack`, {
        method: 'POST',
        body: formData,
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
}

// =====================================================
// 审计任务功能
// =====================================================
async function startAuditPipeline() {
    if (chatState.uploadedFiles.length === 0) {
        addMessage('❌ 请先上传文件！输入「上传」开始。', 'assistant');
        return;
    }
    
    if (!chatState.taskId) {
        addMessage('❌ 未找到任务ID，请重新上传文件。', 'assistant');
        return;
    }
    
    if (!chatState.companyName) {
        addMessage('❌ 请提供公司名称。例如输入：「联信智擎」', 'assistant');
        return;
    }
    
    chatState.isProcessing = true;
    addMessage(`🚀 正在启动审计任务 (${chatState.taskId})...`, 'assistant');
    
    try {
        const response = await fetch(`${CHAT_CONFIG.backendUrl}/api/run-full-pipeline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'upload',
                task_id: chatState.taskId,
                company_name: chatState.companyName,
                audit_end_date: chatState.auditDate || '2024/12/31',
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        // task_id 保持不变（使用上传时的）
        
        addMessage(`⏳ 任务已启动\n正在生成审计底稿，请稍候...`, 'assistant');
        
        // 开始轮询任务状态
        pollTaskStatus();
        
    } catch (error) {
        addMessage(`❌ 启动任务失败: ${error.message}`, 'assistant');
        chatState.isProcessing = false;
    }
}

async function pollTaskStatus() {
    if (!chatState.taskId) return;
    
    try {
        const response = await fetch(`${CHAT_CONFIG.backendUrl}/api/status/${chatState.taskId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
            chatState.isProcessing = false;
            showCompletedResult(data);
        } else if (data.status === 'failed') {
            chatState.isProcessing = false;
            addMessage(`❌ 任务失败: ${data.error || '未知错误'}`, 'assistant');
        } else {
            // 继续轮询
            addMessage(`⏳ 进度: ${data.progress || 0}% - ${data.current_step || '处理中'}`, 'assistant');
            setTimeout(pollTaskStatus, CHAT_CONFIG.pollInterval);
        }
    } catch (error) {
        console.error('Poll error:', error);
        setTimeout(pollTaskStatus, CHAT_CONFIG.pollInterval);
    }
}

function showCompletedResult(data) {
    let message = `🎉 审计底稿生成完成！\n\n`;
    
    // 后端返回的是 output_files 数组
    const outputs = data.output_files || data.outputs || [];
    
    if (outputs.length > 0) {
        message += `📥 生成文件：\n`;
        outputs.forEach(file => {
            message += `• ${file.name || file}\n`;
        });
    }
    
    addMessage(message, 'assistant');
    addDownloadButtons(outputs);
    
    // 重置状态
    chatState.uploadedFiles = [];
    chatState.taskId = null;
}

function addDownloadButtons(outputs) {
    if (!outputs || outputs.length === 0 || !elements.messagesContainer) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex flex-wrap gap-2 mt-2 ml-11';
    
    // 定义可下载的文件类型
    const downloadTypes = [
        { key: 'workpaper', label: '📊 审计底稿', icon: '📊' },
        { key: 'audit_report_pdf', label: '📄 审计报告PDF', icon: '📄' },
        { key: 'check_report_pdf', label: '📋 检查报告PDF', icon: '📋' },
        { key: 'balance_cleaned', label: '📑 清洗余额表', icon: '📑' },
    ];
    
    downloadTypes.forEach(type => {
        const downloadUrl = `${CHAT_CONFIG.backendUrl}/api/download-pipeline-file/${chatState.taskId}/${type.key}`;
        
        const btn = document.createElement('a');
        btn.href = downloadUrl;
        btn.target = '_blank';
        btn.className = 'px-3 py-1 bg-accent-blue/20 hover:bg-accent-blue/40 rounded-lg text-xs text-accent-blue transition-colors';
        btn.textContent = type.label;
        buttonContainer.appendChild(btn);
    });
    
    elements.messagesContainer.appendChild(buttonContainer);
    scrollToBottom();
}

// =====================================================
// 聊天面板控制
// =====================================================
function toggleChatPanel() {
    if (elements.chatPanel) {
        const isHidden = elements.chatPanel.classList.contains('hidden');
        if (isHidden) {
            elements.chatPanel.classList.remove('hidden');
            elements.chatPanel.classList.add('flex');
            elements.chatFab.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            `;
            // 移除未读提示
            const badge = elements.chatFab.querySelector('.absolute');
            if (badge) badge.remove();
            // 聚焦输入框
            setTimeout(() => elements.input?.focus(), 100);
        } else {
            closeChatPanel();
        }
    }
}

function closeChatPanel() {
    if (elements.chatPanel) {
        elements.chatPanel.classList.add('hidden');
        elements.chatPanel.classList.remove('flex');
        elements.chatFab.innerHTML = `<span class="text-2xl">💬</span>`;
    }
}

// =====================================================
// 联系开发者弹窗
// =====================================================
function openContactModal() {
    if (elements.contactModal) {
        elements.contactModal.classList.remove('hidden');
        elements.contactModal.classList.add('flex');
    }
}

function closeContactModal() {
    if (elements.contactModal) {
        elements.contactModal.classList.add('hidden');
        elements.contactModal.classList.remove('flex');
    }
}

// =====================================================
// 发送消息 - Jenny 核心逻辑
// =====================================================
let isTyping = false;

async function handleSend() {
    const message = elements.input?.value.trim();
    if (!message || isTyping) return;
    
    // 清空输入框
    elements.input.value = '';
    
    // 添加用户消息
    addMessage(message, 'user');
    
    // 处理用户意图
    await processUserIntent(message);
}

async function processUserIntent(message) {
    const msg = message.toLowerCase();
    
    // 1. 上传文件意图
    if (msg.includes('上传') || msg.includes('文件') || msg.includes('导入')) {
        addMessage('📤 请选择要上传的文件（支持 Excel 格式）', 'assistant');
        elements.fileInput?.click();
        return;
    }
    
    // 2. 开始审计意图
    if (msg.includes('开始') && (msg.includes('审计') || msg.includes('生成'))) {
        await startAuditPipeline();
        return;
    }
    
    // 3. 查看任务状态
    if (msg.includes('状态') || msg.includes('进度')) {
        if (chatState.taskId) {
            addMessage(`📊 任务 ${chatState.taskId.substring(0, 8)}... 正在处理中`, 'assistant');
        } else {
            addMessage('📋 当前没有进行中的任务', 'assistant');
        }
        return;
    }
    
    // 4. 提取公司名称和日期
    const companyMatch = extractCompanyInfo(message);
    if (companyMatch) {
        chatState.companyName = companyMatch.company;
        chatState.auditDate = companyMatch.date;
        addMessage(`✅ 已设置：\n• 公司: ${chatState.companyName}\n• 审计截止日: ${chatState.auditDate}\n\n说「开始审计」即可生成底稿。`, 'assistant');
        return;
    }
    
    // 5. 帮助
    if (msg.includes('帮助') || msg.includes('help') || msg === '?') {
        showHelp();
        return;
    }
    
    // 6. 其他 - 使用本地问答
    showTypingIndicator();
    isTyping = true;
    
    try {
        const response = getLocalResponse(message);
        hideTypingIndicator();
        await typeMessage(response, 'assistant');
    } catch (error) {
        hideTypingIndicator();
        addMessage('抱歉，我暂时无法回复。请稍后再试。', 'assistant');
    }
    
    isTyping = false;
}

function extractCompanyInfo(message) {
    // 尝试提取 "公司名 日期" 格式
    // 例如: "联信智擎 2024-12-31" 或 "联信智擎 2024年12月31日"
    
    const datePatterns = [
        /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
        /(\d{4}年\d{1,2}月\d{1,2}日?)/,
    ];
    
    let date = null;
    let company = message;
    
    for (const pattern of datePatterns) {
        const match = message.match(pattern);
        if (match) {
            date = match[1].replace(/[年月]/g, '-').replace(/日/g, '');
            company = message.replace(match[0], '').trim();
            break;
        }
    }
    
    // 如果只有公司名（超过2个字）
    if (!date && company.length >= 2 && !company.includes('？') && !company.includes('?')) {
        // 检查是否可能是公司名
        const keywords = ['公司', '有限', '集团', '科技', '智擎', '控股'];
        if (keywords.some(k => company.includes(k)) || company.length >= 4) {
            return {
                company: company,
                date: new Date().toISOString().split('T')[0],
            };
        }
    }
    
    if (company && date) {
        return { company, date };
    }
    
    return null;
}

function showHelp() {
    const helpText = `📖 Jenny 使用指南

1️⃣ 上传文件
   输入「上传」选择科目余额表

2️⃣ 设置公司信息
   输入「公司名 日期」
   例如: 联信智擎 2024-12-31

3️⃣ 开始审计
   输入「开始审计」

4️⃣ 下载结果
   任务完成后自动显示下载链接

💡 提示: 可以直接提问产品相关问题`;
    
    addMessage(helpText, 'assistant');
}

// =====================================================
// 本地问答 - Jenny 知识库
// =====================================================
function getLocalResponse(message) {
    const msg = message.toLowerCase();
    
    // Jenny 自我介绍
    if (msg.includes('你是谁') || msg.includes('jenny') || msg.includes('介绍')) {
        return '你好！我是 Jenny，OpenCPAi 的审计助手 🌟\n\n我可以帮你：\n• 上传科目余额表\n• 自动生成审计底稿\n• 回答产品问题\n\n输入「上传」开始吧！';
    }
    
    // 关键词匹配
    if (msg.includes('什么') && (msg.includes('opencpai') || msg.includes('是'))) {
        return 'OpenCPAi 是一个 AI 驱动的审计底稿自动化工具。上传科目余额表，2分钟即可生成完整审计底稿。我们的理念是：让 AI 处理重复工作，专业判断留给人类。';
    }
    
    if (msg.includes('怎么') && (msg.includes('用') || msg.includes('使用') || msg.includes('体验'))) {
        return '使用非常简单！\n\n1️⃣ 输入「上传」选择文件\n2️⃣ 输入公司名和日期\n3️⃣ 说「开始审计」\n\n整个过程只需2分钟左右。';
    }
    
    if (msg.includes('价格') || msg.includes('收费') || msg.includes('多少钱') || msg.includes('免费')) {
        return '目前 OpenCPAi 处于公测阶段，提供免费体验。后续会推出企业版，具体定价请关注我们的官网更新。';
    }
    
    if (msg.includes('安全') || msg.includes('数据') || msg.includes('隐私')) {
        return '数据安全是我们的首要考量。您上传的财务数据仅用于生成底稿，不会被存储或用于其他目的。我们也支持本地部署方案。';
    }
    
    if (msg.includes('支持') && (msg.includes('软件') || msg.includes('格式'))) {
        return '目前支持 20+ 种主流财务软件导出的科目余额表格式，包括用友、金蝶、浪潮等。如果您的格式无法识别，请联系我们。';
    }
    
    if (msg.includes('联系') || msg.includes('客服') || msg.includes('咨询')) {
        return '您可以通过以下方式联系我们：\n📧 邮箱：contact@opencpai.com\n💬 也可以添加页面底部的微信二维码';
    }
    
    if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello') || msg.includes('嗨')) {
        return '你好！我是 Jenny，OpenCPAi 审计助手 👋\n\n输入「帮助」查看使用指南，或直接输入「上传」开始体验！';
    }
    
    // 默认回复
    return '我可以帮你生成审计底稿 📊\n\n• 输入「上传」上传文件\n• 输入「帮助」查看指南\n• 或者直接问我产品问题';
}

// =====================================================
// UI 辅助函数 - Jenny 样式
// =====================================================
function addMessage(content, role) {
    if (!elements.messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-3 chat-message';
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="flex-1"></div>
            <div class="bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl rounded-tr-none p-4 max-w-[260px]">
                <p class="text-sm text-white">${escapeHtml(content)}</p>
            </div>
            <div class="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
                <span class="text-sm">👤</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span class="text-sm">✨</span>
            </div>
            <div class="bg-bg-card rounded-xl rounded-tl-none p-4 max-w-[260px]">
                <p class="text-sm text-gray-300">${escapeHtml(content).replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }
    
    elements.messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

async function typeMessage(content, role) {
    if (!elements.messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-3 chat-message';
    
    messageDiv.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span class="text-sm">✨</span>
        </div>
        <div class="bg-bg-card rounded-xl rounded-tl-none p-4 max-w-[260px]">
            <p class="text-sm text-gray-300" id="typing-content"></p>
        </div>
    `;
    
    elements.messagesContainer.appendChild(messageDiv);
    
    const typingContent = document.getElementById('typing-content');
    let displayedContent = '';
    
    for (let i = 0; i < content.length; i++) {
        displayedContent += content[i];
        typingContent.innerHTML = escapeHtml(displayedContent).replace(/\n/g, '<br>');
        scrollToBottom();
        await sleep(CHAT_CONFIG.typingDelay);
    }
    
    typingContent.removeAttribute('id');
}

function showTypingIndicator() {
    if (!elements.messagesContainer) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'flex gap-3 chat-message';
    indicator.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span class="text-sm">✨</span>
        </div>
        <div class="bg-bg-card rounded-xl rounded-tl-none p-3">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    elements.messagesContainer.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function scrollToBottom() {
    if (elements.messagesContainer) {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }
}

// =====================================================
// 工具函数
// =====================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// 滚动动画
// =====================================================
function initScrollAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in-up');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(el => observer.observe(el));
}

// =====================================================
// Header 滚动效果
// =====================================================
function initHeaderScroll() {
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
    });
}
