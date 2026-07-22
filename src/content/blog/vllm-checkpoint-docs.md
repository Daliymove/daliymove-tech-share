---
title: "vLLM里的checkpoint是什么？"
description: "checkpoint核心的意思是：训练好的模型在某个时刻保存下来的一整套状态文件；vLLM 将它加载进来，用于推理。"
pubDate: 2026-07-22
updatedDate: 2026-07-22
category: "大模型"
tags:
  - vllm
  - 大模型训练
series: "vLLM 学习笔记"
featured: false
draft: false
---

在 **vLLM** 的语境中，`checkpoint` 最核心的意思通常是：

> **训练好的模型在某个时刻保存下来的一整套状态文件；vLLM 将它加载进来，用于推理。**

可以把它理解为“模型训练的存档”。  
训练完成后的 checkpoint，是 vLLM 服务能够回答问题的“知识本体”；vLLM 本身则更像一个高性能的“运行引擎”。

---

## 1. 先区分：vLLM 做什么，checkpoint 做什么

| 概念 | 角色 | 类比 |
|---|---|---|
| **模型 Checkpoint** | 保存模型学习成果（权重等） | 一本写好的书 |
| **vLLM** | 高效加载并运行模型、处理并发请求 | 高速阅读和分发这本书的系统 |
| **Tokenizer** | 将文字转换成 Token、再还原为文字 | 翻译规则/编码字典 |
| **KV Cache** | 缓存本次对话已计算的上下文 | 阅读时的临时笔记 |

所以你启动 vLLM 时常见的写法：

```bash
vllm serve /data/models/Qwen3-VL-32B-Instruct
```

其中 `/data/models/Qwen3-VL-32B-Instruct` 通常就是一个**模型 checkpoint 目录**。

---

## 2. 一个 checkpoint 目录通常有什么

以 Hugging Face 格式的 Qwen/Llama 模型为例，目录大致是：

```text
Qwen3-VL-32B-Instruct/
├── config.json
├── generation_config.json
├── tokenizer.json
├── tokenizer_config.json
├── special_tokens_map.json
├── model-00001-of-000xx.safetensors
├── model-00002-of-000xx.safetensors
├── ...
├── model.safetensors.index.json
└── preprocessor_config.json        # 视觉模型常见
```

各文件作用：

### ① 权重文件：模型真正“学到的东西”

```text
model-00001-of-000xx.safetensors
model-00002-of-000xx.safetensors
...
```

里面是神经网络参数，例如 Attention、MLP、视觉编码器等层的权重。

- 32B 表示约 **320 亿个参数**
- BF16 权重通常每参数约 2 字节
- 只算权重大约就是：`320 亿 × 2 byte ≈ 64GB`
- 实际部署还要加上运行时开销和 KV Cache，所以显存需求会更高

权重太大时会被切成多个文件，这叫 **shard（分片）**。  
多个分片合起来，才构成完整 checkpoint。

---

### ② 配置文件：告诉 vLLM“模型结构是什么”

```text
config.json
```

这里描述模型的骨架，例如：

```json
{
  "hidden_size": 5120,
  "num_hidden_layers": 64,
  "num_attention_heads": 40,
  "vocab_size": 151936
}
```

它相当于建筑图纸。  
`.safetensors` 是“钢筋水泥”，`config.json` 是“图纸”。两者必须匹配，否则 vLLM 不知道如何把权重放进模型结构。

对于 Qwen-VL 这种多模态模型，配置还会包含视觉编码器、图文融合结构、图像 token 设置等信息。

---

### ③ Tokenizer：告诉模型怎么理解文字

```text
tokenizer.json
tokenizer_config.json
```

模型本身不直接认识“你好”这种字符，而是接收 Token ID。

例如一句文本大概经历：

```text
“帮我总结这份保单”
      ↓ tokenizer
[1234, 5678, 9012, ...]
      ↓ 模型 checkpoint 推理
[...]
      ↓ tokenizer 解码
“这份保单的主要内容是……”
```

**权重和 Tokenizer 必须配套。**  
拿错 tokenizer，有时候不一定马上报错，但输出会明显异常，甚至乱码、答非所问。

---

## 3. vLLM 加载 checkpoint 时发生了什么

当你执行：

```bash
vllm serve /data/models/Qwen3-VL-32B-Instruct \
  --tensor-parallel-size 8
```

大概发生以下流程：

```text
磁盘上的 checkpoint 文件
        ↓
vLLM 读取 config，创建模型骨架
        ↓
读取 safetensors 权重分片
        ↓
按 Tensor Parallel 规则切分权重
        ↓
加载到 8 张 GPU / NPU 显存
        ↓
初始化 KV Cache 可用空间
        ↓
对外提供 OpenAI 兼容 API
```

其中：

- **checkpoint 存在磁盘上**，是持久文件；
- **权重加载到显存中**，才能快速推理；
- vLLM 会用 **PagedAttention** 管理 KV Cache，以提高并发和显存利用率；
- `--tensor-parallel-size 8` 表示一个模型的计算和权重由 8 张卡共同承担。

---

## 4. 别把 checkpoint 和 KV Cache 混在一起

这是 vLLM 中很重要的一点。

### Checkpoint：长期知识

模型权重是训练产生的、相对稳定的。

```text
Qwen3-VL-32B-Instruct 的模型知识
```

它决定了模型“会不会理解保险文档”“会不会写代码”“有没有通用知识”。

重启 vLLM 后，模型 checkpoint 仍在磁盘上，可以重新加载。

---

### KV Cache：本轮推理的临时上下文缓存

比如你发送：

```text
用户：请读取这份保单并说明免责条款。
```

模型在处理前面的 token 时，会生成 Attention 所需的 Key/Value 中间结果，vLLM 把它们存在显存中。

下一步你继续问：

```text
用户：把第 3 条再展开解释。
```

如果前文仍在会话上下文中，KV Cache 能避免把前面的全部内容从头再算一次。

它更像是“草稿纸”，有以下特点：

- 推理期间动态创建；
- 主要占用显存；
- 请求结束、被驱逐、服务重启后可能失效；
- **不是模型训练成果，也通常不称为 checkpoint**。

---

## 5. 在训练场景里，checkpoint 含义会更完整

如果你正在用 MindSpeed 微调 Qwen2.5-VL，训练日志常会看到：

```text
checkpoint-1000/
checkpoint-2000/
checkpoint-3000/
```

这表示在第 1000、2000、3000 个训练 step 时保存的阶段性“存档”。

一个**训练 checkpoint** 除了模型权重，往往还可能包括：

```text
checkpoint-3000/
├── model 权重
├── optimizer.pt        # 优化器状态
├── scheduler.pt        # 学习率调度状态
├── trainer_state.json  # 训练进度、step、指标等
├── rng_state.pth       # 随机数状态
└── tokenizer 文件
```

这些额外文件是为了支持：

```text
训练中断 → 从 checkpoint 恢复 → 接着训练
```

而 vLLM 做**推理**，一般只关心：

1. 模型配置；
2. 模型权重；
3. Tokenizer；
4. 多模态模型对应的视觉处理配置/处理器。

它通常不需要 optimizer、scheduler 这些训练状态。

---

## 6. LoRA 也会产生 checkpoint，但它不是完整模型

LoRA 微调后，通常保存的是类似：

```text
lora_adapter/
├── adapter_config.json
└── adapter_model.safetensors
```

这叫 **LoRA adapter checkpoint**（增量权重），里面不是完整的 3B、7B、32B 模型参数，只包含你训练出的“小改动”。

逻辑是：

```text
基础模型 Checkpoint
       +
LoRA Adapter Checkpoint
       =
微调后的实际效果
```

例如：

```bash
vllm serve /data/models/Qwen2.5-VL-7B-Instruct \
  --enable-lora \
  --lora-modules insurance=/data/models/insurance-lora
```

这里：

- `Qwen2.5-VL-7B-Instruct`：基础模型 checkpoint；
- `insurance-lora`：保险文档任务微调产生的 LoRA checkpoint。

LoRA 文件小得多，但**离开基础模型不能独立运行**。

---

## 7. 量化 checkpoint 又是什么

你可能也会见到：

```text
Qwen-32B-AWQ
Qwen-32B-GPTQ
Qwen-32B-FP8
Qwen-32B-INT4
```

它们仍然是 checkpoint，只是权重存储精度/格式不同。

| 类型 | 大致特点 |
|---|---|
| BF16 / FP16 | 通用高精度，显存占用较高 |
| FP8 | 显存更省、计算更快，依赖硬件与框架支持 |
| INT8 | 更小，可能有一定精度损失 |
| AWQ / GPTQ INT4 | 显存明显降低，部署格式和后端支持要确认 |

例如同一个 32B 模型，粗略只看权重：

```text
BF16：约 64GB
INT8 ：约 32GB
INT4 ：约 16GB
```

但最终能否部署，不只取决于 checkpoint 大小，还要算上：

```text
权重显存 + KV Cache + 激活/临时缓冲区 + 通信开销
```

在多卡 vLLM 或 vLLM-Ascend 上，后面三项往往也是实际 OOM 的关键。

---

## 一句话总结

> **Checkpoint 是模型的“长期记忆/训练存档”，vLLM 是把它高效装载到设备上、并用 KV Cache 处理大量实时请求的推理引擎。**
