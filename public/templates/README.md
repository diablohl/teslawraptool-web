# 设计模板目录

将模板图片直接放入对应车型的目录中，文件名会自动作为模板名称显示。

## 支持的图片格式

- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)

## 目录结构

```
templates/
├── Cybertruck/          # Cybertruck 车型模板
│   ├── 赛车条纹.png
│   └── 隐形黑.png
├── Model3/              # Model 3 车型模板
├── Model3-New/          # 焕新款 Model 3
├── Model3-New-Performance/  # 焕新款 Model 3 高性能版
├── ModelY/              # Model Y 车型模板
├── ModelY-New/          # 焕新款 Model Y
├── ModelY-New-Performance/  # 焕新款 Model Y 高性能版
├── ModelY-New-LongRange/    # 焕新款 Model Y 长续航版
└── ModelY-L/            # Model Y L
```

## 车型与目录对应关系

| 车型名称 | 目录名称 |
|---------|---------|
| Cybertruck | Cybertruck |
| 焕新款 Model 3 | Model3-New |
| 焕新款 Model 3 高性能版 | Model3-New-Performance |
| Model 3 | Model3 |
| 焕新款 Model Y | ModelY-New |
| 焕新款 Model Y 高性能版 | ModelY-New-Performance |
| 焕新款 Model Y 长续航版 | ModelY-New-LongRange |
| Model Y L | ModelY-L |
| Model Y | ModelY |

## 使用说明

1. 将模板图片放入对应车型的目录
2. 重新启动开发服务器（或重新构建项目）
3. 在应用中选择对应车型，即可在「模板」面板看到预设模板
4. 点击模板图片即可添加到画布

> 💡 图片文件名会自动作为模板名称显示（不含扩展名）
