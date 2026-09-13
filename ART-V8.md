# V8 新美术资产

执行模式：内置 imagegen；每项单独生成。下面记录本轮提示规格与对应成品。原始 PNG 保留在生成目录；项目 WebP 仅转换编码，没有程序绘改内容。大厅用代码实现分区布局，不含明日方舟的图片、字体或音频。

|用途与最终提示规格|项目成品|
|---|---|
|Original anime casino character, adult female dealer age 28, silver-white bob, ice-blue eyes, teal waistcoat, white cuffed shirt, fitted black trousers, gloves and cyan tie. Cold composed expression, full standing body, dark navy background, elegant polished illustration, no text.|[荷官立绘](dist/assets/dealer-final.webp)|
|Original anime magician, adult man age 30, tall slender figure, auburn hair, burgundy velvet tailcoat, ivory waistcoat, dark tailored trousers, hat and playing card. Confident charismatic expression, full standing body, dark background, no text.|[魔术师立绘](dist/assets/magician-final.webp)|
|Reference the generated dealer's exact identity and costume. Front-facing head and shoulders skill cut-in, confident restrained smirk, ice blue and teal rim light, original anime casino portrait, square composition, no words.|[荷官技能特写](dist/assets/dealer-cutin.webp)|
|Reference the generated magician's exact identity and costume. Front-facing head and shoulders skill cut-in, confident playful grin, auburn hair and burgundy outfit, warm rim light, square composition, no words.|[魔术师技能特写](dist/assets/magician-cutin.webp)|
|Top-down circular green velvet casino table, elegant gold art deco rings, six vacant circular stations around a central star. Flat overhead view for game background, no dice, cards, people, numbers or lettering.|[绒面圆桌](dist/assets/velvet-table.webp)|
|Six original casino environment vignettes in an exact 3 by 2 atlas: neon pink lounge, amber western saloon, violet moon salon; emerald hall, blue star observatory, burgundy royal vault. Rich architectural detail, consistent cinematic anime treatment, no people or text.|[六座赌场图集](dist/assets/casino-atlas.webp)|
|Flat ivory pearl resin material texture for dice, subtle warm marbling and polished highlights, even flat lighting, square seamless-looking surface, no perspective, no numbers and no pips. Game overlays real dots separately.|[骰子树脂材质](dist/assets/ivory-resin.webp)|

场景图集按网格用于六座赌场背景；数字、两张奖金、骰点和状态全部由游戏实时绘制，确保素材不会暗示错误点数或金额。所有角色为成年人。
