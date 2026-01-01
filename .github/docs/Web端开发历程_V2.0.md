# OpenCPAi Web端开发历程 V2.0

> **版本**: V2.0  
> **创建日期**: 2025-12-19  
> **维护者**: CTO合伙人  
> **关联脚本**: `demo_v2_6_with_scoring.py`

---

## 📋 版本总览

| 版本 | 日期 | 核心特性 | 状态 |
|------|------|---------|------|
| V1.0 | 2025-12-18 | 基础Demo流程 | ✅ 完成 |
| **V2.0** | 2025-12-19 | 完整6维度评分 + 文件命名规范 | ✅ 当前版本 |

---

## 🎯 V2.0 核心功能

### 完整处理流程（9步）

```
【Step 1】解析财务报表 + 提取公司名称
    ├── 多来源提取公司名称（PDF > Excel > 文件名）
    ├── 资产负债表解析
    └── 利润表解析

【Step 2】清洗科目余额表
    ├── UniversalCleanerV4_5（99.2%准确率）
    └── 输出：【科目余额表】公司名(年份).xlsx ⭐ V2.0新增

【Step 3】Ling注入 + VBA执行
    ├── 写入余额表Sheet
    ├── 写入首页F7公司名称
    ├── Z10工商信息查询（纯Python API）
    ├── KMSCB宏执行
    ├── newfenpenjxr宏执行
    ├── Auto_MapSubjectNames宏执行
    ├── 保存底稿
    └── FinPageS宏执行（生成财审报告）

【Step 4】解析上年审计报告PDF
    ├── 资产负债表提取（用于D6比对）
    ├── 利润表提取
    ├── 现金流量表提取
    └── 写入Z3-2（上年利润表+现金流量表）

【Step 5】对比检查
    ├── 财务报表 vs Z3-2期末(C列)
    ├── 上年审计报告期末 vs Z3-2期初(D列)
    └── Z3-5 I/J列差异检测

【Step 6】关闭审计底稿
    └── 保存最终底稿

【Step 7】生成检查报告
    ├── 检查报告Excel
    └── 检查报告PDF

【Step 8】导出财审报告PDF
    └── 保留VBA版本号命名

【Step 9】6维度评分
    ├── D1_报表平衡 (30分)
    ├── D2_表格表头 (10分)
    ├── D3_科目映射 (10分)
    ├── D4_基本情况 (10分)
    ├── D5_附注平衡 (10分)
    └── D6_数据比对 (30分)
```

### 输出文件命名规范

| 文件类型 | 命名格式 | 示例 |
|---------|---------|------|
| 科目余额表 | 【科目余额表】公司全名(年份).xlsx | 【科目余额表】深圳市鹏兴食安第三方监管有限公司(2024).xlsx |
| 财审底稿 | 【财审底稿】公司全名(年份).xlsm | 【财审底稿】深圳市鹏兴食安第三方监管有限公司(2024).xlsm |
| 检查报告 | 【检查报告】公司全名(年份).pdf | 【检查报告】深圳市鹏兴食安第三方监管有限公司(2024).pdf |
| 财审报告 | 【财审报告】公司全名(年份第N版).pdf | 【财审报告】深圳市鹏兴食安第三方监管有限公司(2025第1版).pdf |
| 数据源 | 【数据源】财务报表_公司简称.json | 【数据源】财务报表_深圳市鹏兴食安第三方.json |

---

## 🔧 开发历程记录

### 1. Debug过程

#### 1.1 科目余额表输出缺失

**问题**：用户发现输出目录有"【上年审定数】"文件，但缺少"【科目余额表】"

**原因**：
- "【上年审定数】"是另一个脚本`test_sample2_pdf_extract.py`生成的
- `demo_v2_6`只写入VBA模板的"余额表"Sheet，没有单独保存清洗后的科目余额表

**修复**：
```python
# 在Step 2清洗完成后添加
balance_output_name = f"【科目余额表】{company_name}({audit_year}).xlsx"
balance_output_path = OUTPUT_DIR / balance_output_name
df_cleaned.to_excel(balance_output_path, index=False)
print(f"  ✓ 保存科目余额表: {balance_output_name}")
```

#### 1.2 audit_year作用域问题

**问题**：添加科目余额表输出后报错 `UnboundLocalError: audit_year`

**原因**：`audit_year`定义在Step 3，但科目余额表保存在Step 2

**修复**：将`audit_year = "2024"`移动到Step 1（财务报表解析后）

#### 1.3 PDF转换窗口残留

**问题**：Excel转PDF后窗口未关闭

**修复**：确保COM对象正确释放
```python
finally:
    if wb:
        wb.Close(SaveChanges=False)
    if excel:
        excel.Quit()
    pythoncom.CoUninitialize()
```

### 2. 优化过程

#### 2.1 Z10工商信息查询

**优化前**：调用VBA宏`查询工商信息`（需要MsgBox交互）

**优化后**：纯Python API调用
```python
def query_business_info_api(company_name: str) -> dict:
    """纯Python调用百度工商API"""
    url = "http://gwgp-gwbyafindsn.n.bdcloudapi.com/business2/get"
    headers = {"X-Bce-Signature": f"AppCode/{API_CODE}"}
    params = {"keyword": company_name}
    response = requests.get(url, headers=headers, params=params)
    return response.json()
```

#### 2.2 财务报表解析

**优化**：多来源公司名称提取
```
优先级: PDF审计报告 > Excel利润表B2 > Excel资产负债表B2 > 文件夹名
```

#### 2.3 Z3-2数据写入

**新增**：上年利润表和现金流量表写入Z3-2
- 利润表映射：16项
- 现金流量表映射：24项

---

## ⚠️ 已知缺陷与待完成

### 1. 架构层面

| 问题 | 影响 | 状态 |
|------|------|------|
| **同步阻塞** | VBA操作5-10秒阻塞API响应 | ❌ 未解决 |
| **无任务队列** | 无法处理多用户并发 | ❌ 未解决 |
| **进程独占** | Excel COM单线程，同时只能处理一个 | ❌ 设计限制 |
| **无状态推送** | 前端无法获取实时进度 | ❌ 未解决 |

### 2. 功能层面

| 功能 | Demo状态 | PipelineService状态 |
|------|---------|-------------------|
| 科目余额表清洗 | ✅ 完成 | ✅ 已整合 |
| 财务报表解析 | ✅ 完成 | ✅ 已整合 |
| PDF审计报告解析 | ✅ 完成 | ❌ 未整合 |
| Z3-2数据写入 | ✅ 完成 | ⚠️ 部分 |
| 数据对比(D6) | ✅ 完成 | ❌ 未整合 |
| 6维度评分 | ✅ 完成 | ❌ 未整合 |

### 3. 待开发功能

- [ ] 任务队列架构（Celery/RQ）
- [ ] WebSocket实时进度推送
- [ ] 批量处理支持
- [ ] 错误恢复机制
- [ ] 多用户并发支持

---

## 📁 版本备份

### 当前版本文件

| 文件 | 位置 | 说明 |
|------|------|------|
| `demo_v2_6_with_scoring.py` | `OpenCPAi测试/scripts/` | Demo主脚本 |
| `App.js` | `OpenCPAi-Web/opencpai-app/src/` | React前端 |
| `pipeline_service.py` | `OpenCPAiOS/backend/services/` | 后端流水线服务 |

### 版本历史

| 版本 | Demo脚本 | 备份位置 |
|------|---------|---------|
| V1.0 | demo_v2_1~v2_4 | `scripts/` |
| **V2.0** | demo_v2_6_with_scoring.py | `scripts/` + `versions/` |

---

## 🔗 关联文档

- [Copilot开发指引](../copilot-instructions.md)
- [Jenny引擎](../../../OpenCPAiOS-Jenny/.github/copilot-instructions.md)
- [Ling引擎](../../../OpenCPAiOS-Ling/.github/copilot-instructions.md)
- [全局开发框架](../../../.github/docs/00_全局开发框架.md)

---

## 📈 下一步规划

### 短期（1周内）

1. 补全PipelineService（PDF解析、Z3-2写入、对比检查、评分）
2. 前端进度轮询优化

### 中期（2-4周）

1. 引入任务队列架构
2. WebSocket实时推送
3. 批量处理支持

### 长期（1-3月）

1. VBA→Python迁移（消除COM依赖）
2. 云端部署支持
3. 多用户并发

---

**最后更新**: 2025-12-19
