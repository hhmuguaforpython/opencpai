/**
 * OpenCPAi 官网聊天功能
 * 版本: 1.0.0
 * 集成: 通义千问 API
 */

// =====================================================
// 配置
// =====================================================
const CHAT_CONFIG = {
    // API 配置 - 生产环境替换为真实 API
    apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: '', // 留空，实际使用时需要配置
    model: 'qwen-turbo',
    
    // 系统提示词
    systemPrompt: `你是 OpenCPAi 官网助手，一个专业、友好的 AI 助手。

关于 OpenCPAi：
- OpenCPAi 是一个 AI 驱动的审计底稿自动化工具
- 专为财税审计专业人士设计
- 核心功能：上传科目余额表，2分钟生成完整审计底稿
- 技术特点：全面去VBA、去插件，使用 Python + AI
- 公司：联信智擎（深圳）科技有限公司

你的职责：
1. 回答关于 OpenCPAi 产品的问题
2. 解释审计底稿自动化的价值
3. 引导用户体验产品

回答规则：
- 简洁专业，不超过 150 字
- 使用中文
- 不要编造不存在的功能
- 如果不确定，建议用户联系 contact@opencpai.com`,
    
    // UI 配置
    maxMessages: 50,
    typingDelay: 30,
};

// =====================================================
// 状态
// =====================================================
let chatHistory = [];
let isTyping = false;

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
    
    console.log('🚀 OpenCPAi Chat initialized');
});

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
// 发送消息
// =====================================================
async function handleSend() {
    const message = elements.input?.value.trim();
    if (!message || isTyping) return;
    
    // 清空输入框
    elements.input.value = '';
    
    // 添加用户消息
    addMessage(message, 'user');
    
    // 显示打字指示器
    showTypingIndicator();
    isTyping = true;
    
    try {
        // 调用 API 或使用本地回复
        const response = await getAIResponse(message);
        
        // 隐藏打字指示器
        hideTypingIndicator();
        
        // 添加 AI 回复
        await typeMessage(response, 'assistant');
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addMessage('抱歉，我暂时无法回复。请稍后再试或联系 contact@opencpai.com', 'assistant');
    }
    
    isTyping = false;
}

// =====================================================
// 获取 AI 回复
// =====================================================
async function getAIResponse(message) {
    // 如果没有配置 API Key，使用本地回复
    if (!CHAT_CONFIG.apiKey) {
        return getLocalResponse(message);
    }
    
    // 构建消息历史
    const messages = [
        { role: 'system', content: CHAT_CONFIG.systemPrompt },
        ...chatHistory.slice(-10), // 只保留最近10条
        { role: 'user', content: message }
    ];
    
    // 调用 API
    const response = await fetch(CHAT_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CHAT_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: CHAT_CONFIG.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
        })
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const reply = data.choices[0].message.content;
    
    // 更新历史
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: reply });
    
    return reply;
}

// =====================================================
// 本地回复（无 API 时使用）
// =====================================================
function getLocalResponse(message) {
    const msg = message.toLowerCase();
    
    // 关键词匹配
    if (msg.includes('什么') && (msg.includes('opencpai') || msg.includes('是'))) {
        return 'OpenCPAi 是一个 AI 驱动的审计底稿自动化工具。上传科目余额表，2分钟即可生成完整审计底稿。我们的理念是：让 AI 处理重复工作，专业判断留给人类。';
    }
    
    if (msg.includes('怎么') && (msg.includes('用') || msg.includes('使用') || msg.includes('体验'))) {
        return '使用非常简单！点击页面上的「立即体验」按钮，上传您的科目余额表（Excel格式），系统会自动识别并生成审计底稿。整个过程只需2分钟左右。';
    }
    
    if (msg.includes('价格') || msg.includes('收费') || msg.includes('多少钱') || msg.includes('免费')) {
        return '目前 OpenCPAi 处于公测阶段，提供免费体验。后续会推出企业版，具体定价请关注我们的官网更新。';
    }
    
    if (msg.includes('安全') || msg.includes('数据') || msg.includes('隐私')) {
        return '数据安全是我们的首要考量。您上传的财务数据仅用于生成底稿，不会被存储或用于其他目的。我们也支持本地部署方案，满足对数据安全有更高要求的客户。';
    }
    
    if (msg.includes('支持') && (msg.includes('软件') || msg.includes('格式'))) {
        return '目前支持 20+ 种主流财务软件导出的科目余额表格式，包括用友、金蝶、浪潮等。如果您的格式无法识别，请联系我们，我们会尽快适配。';
    }
    
    if (msg.includes('联系') || msg.includes('客服') || msg.includes('咨询')) {
        return '您可以通过以下方式联系我们：\n📧 邮箱：contact@opencpai.com\n💬 也可以添加页面底部的微信二维码\n我们会在24小时内回复您。';
    }
    
    if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
        return '你好！我是 OpenCPAi 助手。有关于审计底稿自动化的问题，随时可以问我！';
    }
    
    // 默认回复
    return '感谢您的提问！关于这个问题，建议您点击「立即体验」亲自试用，或联系 contact@opencpai.com 获取更详细的解答。';
}

// =====================================================
// UI 辅助函数
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
            <div class="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                <span class="text-sm">🤖</span>
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
        <div class="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
            <span class="text-sm">🤖</span>
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
        <div class="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
            <span class="text-sm">🤖</span>
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
