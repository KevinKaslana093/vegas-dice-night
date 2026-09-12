# 骰子之夜 · 技能演出素材与提示词

四张表情特写通过内置 imagegen 分别生成，并以对应的原有立绘为角色参考。未使用 API/CLI 备用方式。

本项目的成品位于 dist/assets 文件夹。游戏里的原始立绘保持不变。

## 演出设计

眼神切入 → 角色特写与技能名 → 结果动作 → 回到牌桌。

- 初来乍到：玫红特写，额外一骰入手。
- 正义执行：金色特写、准星锁定、骰子退场。
- 主场优势：绿色特写、骰子数交换、成交印章。
- 魅力四射：紫色眨眼特写、扇形纸牌、翻出抽中的钞票金额。
- 掷骰：立体六面骰翻滚、落桌、显示真实结果。

演出约2.9秒；掷骰约1.05秒。快速模式缩短，减少动态效果模式简化。跳过演出不重复执行已提交的动作。

## 生成提示词

共同提示词中的 [CHARACTER BRIEF] 分别替换为下列角色描述；每个角色单独调用，参考图见各项。

Create ONE original premium anime videogame skill cut-in PORTRAIT, using the attached existing character as identity and costume reference. [CHARACTER BRIEF]. HEAD AND SHOULDERS ONLY, huge expressive face occupies ~60% of image, fully visible hair/hat/ears, lower shoulders naturally cropped at bottom. Square 1024x1024 composition, central face, both facial features sharply readable. Crisp refined anime linework and cel shading with detailed beautiful face, bold dramatic light and shadow, high-end illustrated JRPG artwork matching the reference. Isolated character on a perfectly flat deep midnight navy #0b101e background. No scenery, no words, no letters, no logo, no frame, no speed lines, no collage, no other characters. This is an individual animation asset, not a screenshot or finished UI. Preserve recognisable facial identity and costume colors from reference, but new expressive closeup pose.

### denim

参考图：denim-final.png

adult auburn-haired woman with gold hoop earrings, black cropped leather jacket and white top. Direct front-facing eye contact, raised eyebrow and bold mischievous confident grin, one hand holding a single ivory die near her cheek. Warm rose-magenta rim light

成品：[denim-cutin.png](./dist/assets/denim-cutin.png)

### cowboy

参考图：cowboy-final.png

adult brown-haired rugged handsome cowboy with light stubble, brown wide brim western hat, brown patterned poncho and cream shirt. Direct front-facing intense eye contact, one eyebrow lowered, cool confident half-smile. One hand touching brim raised so BOTH eyes clearly visible. Amber-gold rim light. No gun in this portrait

成品：[cowboy-cutin.png](./dist/assets/cowboy-cutin.png)

### owner

参考图：owner-final.png

mature tall silver-haired casino owner with swept-back silver hair and neatly trimmed silver goatee, emerald green tailored suit, gold cravat, elegant smoking pipe near mouth. Direct front-facing eye contact, calculating calm knowing smirk and one eyebrow raised, strong charismatic facial structure. Emerald green rim light

成品：[owner-cutin.png](./dist/assets/owner-cutin.png)

### bunny

参考图：bunny-final.png

adult purple-haired elegant casino bunny hostess with black rabbit ears, black bow tie white collar, small gold earrings. Front-facing face, playful wink and self-assured smile, one hand holding a single casino playing card near cheek. Lavender-violet rim light

成品：[bunny-cutin.png](./dist/assets/bunny-cutin.png)

## 免费素材来源

- [Kenney Casino Audio](https://kenney.nl/assets/casino-audio)：CC0，骰子、筹码、纸牌音效。
- [Kenney Particle Pack](https://kenney.nl/assets/particle-pack)：CC0，星芒、火花、烟雾纹理。
- [P3R 官方资料](https://asia.sega.com/p3r/cn/)和[Hades 官方资料](https://www.supergiantgames.com/games/hades/)仅供视觉表现参考。商业游戏素材没有打包进本作。

