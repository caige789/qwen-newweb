/**
 * story.ts —— 「灯语」分支叙事图谱
 * 每个节点对应一幅程序化场景；每次选择走向不同画面与结局。
 * NPC 拥有专属语音画像（动森式逐字发声）；场景内藏可点击的互动彩蛋。
 * 全离线、零请求，仅在故事打开时消费。
 */

import type { Season } from "./solarTerms";

export type SceneKey =
  | "harbor"
  | "lighthouse"
  | "forest"
  | "lantern"
  | "spring"
  | "sea"
  | "whale"
  | "stars"
  | "cave"
  | "meadow"
  | "rain"
  | "dawn"
  | "village"
  | "bridge"
  | "field"
  | "snow"
  | "cloudsea"
  | "sakura"
  | "lotus"
  | "moonrise"
  | "hearth";

export type NpcKind = "keeper" | "fox" | "whale" | "stargirl" | "echo" | "granny";

/** NPC 语音画像：base 基频 / jitter 抖动 / wave 波形 / every 每几字一声 */
export interface NpcDef {
  kind: NpcKind;
  name: string;
  title: string;
  hue: string;
  voice: { base: number; jitter: number; wave: OscillatorType; every: number };
}

export const NPCS: Record<NpcKind, NpcDef> = {
  keeper: {
    kind: "keeper",
    name: "守灯人",
    title: "灯塔下的老人",
    hue: "#f4c48f",
    voice: { base: 150, jitter: 40, wave: "sine", every: 1 },
  },
  fox: {
    kind: "fox",
    name: "小狐狸",
    title: "提灯的小家伙",
    hue: "#ffb75e",
    voice: { base: 520, jitter: 160, wave: "triangle", every: 1 },
  },
  whale: {
    kind: "whale",
    name: "小鲸",
    title: "深海的慢郎中",
    hue: "#a3c1d6",
    voice: { base: 82, jitter: 18, wave: "sine", every: 3 },
  },
  stargirl: {
    kind: "stargirl",
    name: "星儿",
    title: "数星星的孩子",
    hue: "#f5d9a0",
    voice: { base: 700, jitter: 220, wave: "sine", every: 1 },
  },
  echo: {
    kind: "echo",
    name: "回声灵",
    title: "住在晶洞里的声音",
    hue: "#7fd4c1",
    voice: { base: 380, jitter: 90, wave: "sine", every: 2 },
  },
  granny: {
    kind: "granny",
    name: "阿婆",
    title: "村口点灯的人",
    hue: "#f0a860",
    voice: { base: 200, jitter: 50, wave: "sine", every: 2 },
  },
};

export type FxKey =
  | "beacon"
  | "fireflies"
  | "glowpulse"
  | "ripple"
  | "wave"
  | "splash"
  | "shooting"
  | "gull"
  | "crystal"
  | "raingust"
  | "sunrays"
  | "lanternsway"
  | "fishjump"
  | "pollen"
  | "snowburst"
  | "cloudbreak"
  | "petalburst"
  | "emberburst";

export interface Choice {
  label: string;
  next: string;
}

export interface StoryNode {
  id: string;
  scene: SceneKey;
  text: string;
  npc?: NpcKind;
  interact?: { label: string; fx: FxKey };
  choices?: Choice[];
  ending?: { title: string; line: string; hue: string };
}

export const START_ID = "harbor";

/** 场景图鉴元数据（名字 + 代表色） */
export const SCENE_META: Record<SceneKey, { name: string; hue: string }> = {
  harbor: { name: "暮色码头", hue: "#e8a06a" },
  lighthouse: { name: "灯塔", hue: "#f4c48f" },
  forest: { name: "萤火森林", hue: "#aecaa4" },
  lantern: { name: "一盏灯", hue: "#ffb75e" },
  spring: { name: "林间清泉", hue: "#7fd4c1" },
  sea: { name: "夜海", hue: "#a3c1d6" },
  whale: { name: "鲸歌", hue: "#9bd4e0" },
  stars: { name: "星海", hue: "#f5d9a0" },
  cave: { name: "回音晶洞", hue: "#7fd4c1" },
  meadow: { name: "星丘", hue: "#c9b8d9" },
  rain: { name: "雨檐", hue: "#a3c1d6" },
  dawn: { name: "黎明海崖", hue: "#ffd9a0" },
  village: { name: "山脚小村", hue: "#f0a860" },
  bridge: { name: "石桥", hue: "#9bd4e0" },
  field: { name: "灯花田", hue: "#ffd98c" },
  snow: { name: "落雪山径", hue: "#e8f0fa" },
  cloudsea: { name: "云海", hue: "#ffd9a0" },
  sakura: { name: "樱雨 · 春限", hue: "#f4b8c8" },
  lotus: { name: "荷风 · 夏限", hue: "#b8e0d0" },
  moonrise: { name: "海上月 · 秋限", hue: "#e8f0fa" },
  hearth: { name: "围炉 · 冬限", hue: "#ffb066" },
};

export const ALL_SCENES = Object.keys(SCENE_META) as SceneKey[];

export const storyNodes: Record<string, StoryNode> = {
  harbor: {
    id: "harbor",
    scene: "harbor",
    text: "暮色四合，你的小舟轻轻靠了岸。岛上很静，只有浪声，和远处一点暖黄的光。",
    interact: { label: "唤一声海鸥", fx: "gull" },
    choices: [
      { label: "走向那点亮光的灯塔", next: "lighthouse" },
      { label: "钻进岸边发着微光的森林", next: "forest" },
      { label: "留在礁石上，先听一会儿海", next: "sea" },
      { label: "顺着炊烟，去山脚的小村看看", next: "village" },
    ],
  },

  /* ---------- 灯塔线 ---------- */
  lighthouse: {
    id: "lighthouse",
    scene: "lighthouse",
    npc: "keeper",
    text: "灯塔下坐着位守灯人。他手里的茶还冒着热气：“上来坐坐？灯还没到最亮的时候呢。”",
    interact: { label: "帮他把灯拧亮一点", fx: "beacon" },
    choices: [
      { label: "坐到他身边，一起看海", next: "keeper_quiet" },
      { label: "问他：这盏灯，守了多少年了？", next: "keeper_story" },
    ],
  },
  keeper_quiet: {
    id: "keeper_quiet",
    scene: "lighthouse",
    npc: "keeper",
    text: "你们谁也没说话。浪一层一层涌上来，灯一圈一圈转过去。原来有些陪伴，是不必开口的。",
    ending: { title: "默契", line: "灯火与你，都没说话。", hue: "#f4c48f" },
  },
  keeper_story: {
    id: "keeper_story",
    scene: "lighthouse",
    npc: "keeper",
    text: "“很久啦。”他望向海面，“久到我见过一颗星星掉进海里，也见过一颗落进山那边的晶洞。后者，到现在还在洞里亮着呢。”",
    choices: [
      { label: "陪他一起等海里的星星", next: "star_wait" },
      { label: "想去晶洞看看那颗落难的星", next: "cave" },
      { label: "我想去海边吹吹风", next: "sea" },
    ],
  },
  star_wait: {
    id: "star_wait",
    scene: "stars",
    npc: "keeper",
    text: "你们守到深夜。忽然，海面亮起一点微光，慢慢浮上来——真的是一颗星星，湿漉漉的，还在眨眼。",
    ending: { title: "星愿", line: "有些愿望沉得再深，也会自己亮起来。", hue: "#f5d9a0" },
  },

  /* ---------- 晶洞线 ---------- */
  cave: {
    id: "cave",
    scene: "cave",
    npc: "echo",
    text: "洞口垂着水帘似的晶簇，深处传来轻轻的嗡鸣。一个声音在四壁间转着圈：“欢——迎——欢——迎——”那是回声灵，它把每个字都小心翼翼地还给你。",
    interact: { label: "敲一敲晶簇", fx: "crystal" },
    choices: [
      { label: "跟着嗡鸣，往洞深处走", next: "cave_deep" },
      { label: "对它，轻轻哼一句歌", next: "cave_hum" },
    ],
  },
  cave_deep: {
    id: "cave_deep",
    scene: "cave",
    npc: "echo",
    text: "洞的尽头，一颗星星嵌在晶壁里，像一枚发光的种子。回声灵小声说：“它在这里睡着了。你来的那天起，它就亮了一点。”",
    choices: [
      { label: "把手心贴在晶壁上，暖暖它", next: "cave_warm" },
      { label: "替它把愿望说给洞听", next: "cave_wish" },
    ],
  },
  cave_warm: {
    id: "cave_warm",
    scene: "cave",
    npc: "echo",
    text: "你的手心慢慢变热，晶壁里的光也一点点漫上来，整座洞亮起温柔的星屑。回声灵轻声重复：“暖——的——暖——的——”",
    ending: { title: "共振", line: "你予出的温度，世界会放大还你。", hue: "#7fd4c1" },
  },
  cave_wish: {
    id: "cave_wish",
    scene: "cave",
    npc: "echo",
    text: "你对着洞壁轻轻说了一个愿望。回声灵把那句话含住，一遍遍轻轻回放，像替你保管了很久很久。星星在晶壁里，眨了一下。",
    ending: { title: "星尘", line: "愿望说给山洞听，也很算数。", hue: "#9bd4e0" },
  },
  cave_hum: {
    id: "cave_hum",
    scene: "cave",
    npc: "echo",
    text: "你哼了一句不成调的歌。回声灵把每个音都接住，错开半拍再唱回来——一个人的歌，变成了一整个洞的合唱。",
    ending: { title: "回声", line: "你发出的声音，总有人轻轻应和。", hue: "#aecaa4" },
  },

  /* ---------- 森林线 ---------- */
  forest: {
    id: "forest",
    scene: "forest",
    npc: "fox",
    text: "森林里浮着千百只萤火虫。一只小狐狸挡在路前，尾巴尖提着一盏小小的灯，歪头打量你：“你也是来找光的吗？”",
    interact: { label: "惊起一群萤火虫", fx: "fireflies" },
    choices: [
      { label: "蹲下来，摊开手心让它闻", next: "fox_friend" },
      { label: "不说话，跟着它的灯走", next: "fox_follow" },
      { label: "问它：山顶有什么？", next: "fox_hill" },
    ],
  },
  fox_friend: {
    id: "fox_friend",
    scene: "lantern",
    npc: "fox",
    text: "它凑近闻了闻，忽然把那盏小灯轻轻放进你手心。“送你啦。”灯是暖的，像揣了一小块太阳。它转身跑进光里。",
    ending: { title: "一盏灯", line: "陌生人给的暖，也是暖。", hue: "#ffb75e" },
  },
  fox_follow: {
    id: "fox_follow",
    scene: "forest",
    npc: "fox",
    text: "你跟着那点光穿过树影。它在一汪清泉前停下，回头看你，像在说：就是这里了。",
    choices: [
      { label: "捧一捧泉水，洗把脸", next: "spring_drink" },
      { label: "对着泉面，许一个愿", next: "spring_wish" },
      { label: "穿过林子，去那片发光的花田", next: "field" },
    ],
  },
  fox_hill: {
    id: "fox_hill",
    scene: "forest",
    npc: "fox",
    text: "“山顶啊——”它的尾巴晃了晃，“住着一个数星星的小孩。她数得很慢，因为她觉得，每颗都值得数清楚。我带你去？”",
    interact: { label: "替它提着灯照亮前路", fx: "glowpulse" },
    choices: [
      { label: "好，去山顶看看", next: "meadow" },
      { label: "还是先去泉边坐坐", next: "fox_follow" },
    ],
  },
  spring_drink: {
    id: "spring_drink",
    scene: "spring",
    npc: "fox",
    text: "泉水凉得刚好，一口下去，好像把一路的疲惫都冲淡了。狐狸在旁边，满意地甩了甩尾巴。",
    interact: { label: "点一点泉面", fx: "ripple" },
    ending: { title: "清泉", line: "累的时候，就停下来喝口水。", hue: "#7fd4c1" },
  },
  spring_wish: {
    id: "spring_wish",
    scene: "spring",
    npc: "fox",
    text: "泉面倒映着萤火，也倒映着你。你轻轻说了一个愿望，水面泛起一圈圈涟漪，把愿望收好了。",
    interact: { label: "看涟漪一圈圈散开", fx: "ripple" },
    ending: { title: "心愿", line: "说出来，就算数。", hue: "#9bd4e0" },
  },

  /* ---------- 灯花田线 ---------- */
  field: {
    id: "field",
    scene: "field",
    npc: "fox",
    text: "林子尽头忽然开阔——一整片田开满了会发光的花，风一过，金色的花粉像慢下来的雪。狐狸轻轻“哇”了一声，尾巴都忘了摇。",
    interact: { label: "吹一朵蒲公英", fx: "pollen" },
    choices: [
      { label: "躺在花田里，等星星出来", next: "meadow" },
      { label: "摘一朵灯花，提在手里走", next: "field_pick" },
    ],
  },
  field_pick: {
    id: "field_pick",
    scene: "field",
    npc: "fox",
    text: "你刚伸手，花却先亮了亮，像在说：别摘我，我还有用呢。狐狸笑你：“它要留着给夜里赶路的人照路呀。”你收回手，心里反倒更亮了一点。",
    ending: { title: "不摘", line: "有些美好，留在原处才完整。", hue: "#ffd98c" },
  },

  /* ---------- 星丘线 ---------- */
  meadow: {
    id: "meadow",
    scene: "meadow",
    npc: "stargirl",
    text: "山顶的风很软。一个小孩躺在草坡上，正用手指一颗一颗点着星星：“四十七……四十八……咦，你来啦？要一起数吗？”",
    interact: { label: "等一颗流星", fx: "shooting" },
    choices: [
      { label: "躺下来，和她一起数", next: "meadow_count" },
      { label: "问她：掉下来的星星去哪了？", next: "meadow_fall" },
    ],
  },
  meadow_count: {
    id: "meadow_count",
    scene: "meadow",
    npc: "stargirl",
    text: "你们数到一百颗的时候，谁也没有说话——因为刚好有一颗流星，替你们把剩下的都数完了。她笑：“看，星星也怕我们数累了。”",
    ending: { title: "一百颗", line: "慢慢数，星星不会跑。", hue: "#f5d9a0" },
  },
  meadow_fall: {
    id: "meadow_fall",
    scene: "meadow",
    npc: "stargirl",
    text: "“掉下来的星星啊，”她想了想，“都去了东边的海崖。它们在那里睡一觉，第二天就变成日出，重新爬回天上。”她指指东边：“明天，去看看？”",
    choices: [
      { label: "好，等一场日出", next: "dawn" },
      { label: "今晚先陪她数完这片天", next: "meadow_count" },
      { label: "翻过山脊，去看看云海", next: "cloudsea" },
    ],
  },

  /* ---------- 云海线 ---------- */
  cloudsea: {
    id: "cloudsea",
    scene: "cloudsea",
    npc: "stargirl",
    text: "山脊的另一侧，云像退潮的海，一层一层铺到天的尽头。星儿趴在石头上小声说：“每次看到云，我都觉得，山下的烦恼，都在云下面了。”",
    interact: { label: "看云慢慢翻涌", fx: "cloudbreak" },
    choices: [
      { label: "坐在石头上，看完这一片云", next: "cloudsea_watch" },
      { label: "沿着云海的边，往东边走", next: "dawn" },
    ],
  },
  cloudsea_watch: {
    id: "cloudsea_watch",
    scene: "cloudsea",
    npc: "stargirl",
    text: "你们谁也没有再说话。云走得很慢，慢得像时间打了个盹。很久以后她轻轻说：“你看，什么都不做的时候，世界也在好好运转。”",
    ending: { title: "云海", line: "什么都不做，也没关系。", hue: "#ffd9a0" },
  },

  /* ---------- 雨檐线 ---------- */
  rain: {
    id: "rain",
    scene: "rain",
    text: "走到半山，雨说来就来。路边有间小石屋，檐下坐着一位戴斗笠的旅人，正就着雨声喝茶。他拍拍身边的空位：“进来避避？雨还有一阵呢。”",
    interact: { label: "听一阵急雨", fx: "raingust" },
    choices: [
      { label: "坐下来，分他一半伞上的水珠故事", next: "rain_share" },
      { label: "问他：雨什么时候停？", next: "rain_wait" },
    ],
  },
  rain_share: {
    id: "rain_share",
    scene: "rain",
    text: "你们一个讲海上的雾，一个讲山里的萤。雨声把两句话缝在一起，竟像认识了很久。雨小下去的时候，他起身：“一起走吧，顺路。”",
    ending: { title: "一把伞", line: "躲过同一场雨的人，算半个故人。", hue: "#a3c1d6" },
  },
  rain_wait: {
    id: "rain_wait",
    scene: "rain",
    text: "“急什么。”他往杯子里续了点热水，“雨停的时候，东边会很好看。我每次都等到那个时候再走。”你们就这么坐着，听雨把山洗了一遍。",
    choices: [
      { label: "和他一起，等雨停", next: "dawn" },
      { label: "披上雨声，先回林子里", next: "forest" },
      { label: "往更高的山上走", next: "snow" },
    ],
  },

  /* ---------- 落雪线 ---------- */
  snow: {
    id: "snow",
    scene: "snow",
    text: "越往上走，雨声越小，最后变成了一片安静的白——落雪了。山径两旁的树都披着雪，像一盏一盏没点亮的灯。",
    interact: { label: "接一片雪花", fx: "snowburst" },
    choices: [
      { label: "在雪地里，踩一串脚印", next: "snow_steps" },
      { label: "堆一个小小的雪人", next: "snow_man" },
    ],
  },
  snow_steps: {
    id: "snow_steps",
    scene: "snow",
    text: "咯吱，咯吱。每一步都很轻，每一步都算数。回头看时，一串脚印安安静静地亮在雪里——原来你已经走了这么远。",
    ending: { title: "初雪", line: "雪落得很轻，像你终于放慢的脚步。", hue: "#e8f0fa" },
  },
  snow_man: {
    id: "snow_man",
    scene: "snow",
    text: "雪人不大，歪着头，笑起来憨憨的。你想了想，解下围巾给它围上。山风路过，替它说了声谢谢。",
    choices: [
      { label: "给它留一盏小灯，再下山", next: "lantern" },
      { label: "陪它坐一会儿，看雪停", next: "snow_rest" },
    ],
  },
  snow_rest: {
    id: "snow_rest",
    scene: "snow",
    text: "你们并排坐着，一个看雪，一个被雪看。雪停的时候，天边露出一小片暖色。雪人好像轻轻晃了晃——也可能是你的心，松了一下。",
    ending: { title: "暖意", line: "给出去的温度，不会消失。", hue: "#f4c48f" },
  },

  /* ---------- 黎明线 ---------- */
  dawn: {
    id: "dawn",
    scene: "dawn",
    text: "雨后的空气干净得像刚洗过。东边的海崖上，天边泛起一层薄薄的金——那些掉下来的星星，真的在这里排着队，等着重新升起。",
    interact: { label: "迎一迎第一缕光", fx: "sunrays" },
    ending: { title: "黎明", line: "太阳照常升起，你也是。", hue: "#ffd9a0" },
  },

  /* ---------- 海与鲸 ---------- */
  sea: {
    id: "sea",
    scene: "sea",
    text: "夜海像一块墨玉。远处，一道巨大的背鳍缓缓划开水面——是一头鲸。它朝这边游来了。",
    interact: { label: "掬一捧海浪", fx: "wave" },
    choices: [
      { label: "朝它，轻轻挥挥手", next: "whale_wave" },
      { label: "把心里的烦恼，说给海听", next: "sea_tell" },
      { label: "沿着海岸，往山那边走走", next: "rain" },
    ],
  },
  whale_wave: {
    id: "whale_wave",
    scene: "whale",
    npc: "whale",
    text: "它竟真的停了下来，喷出一道高高的水柱。一个很轻很低的声音从水下传来，慢得像潮汐：“你——好——呀——”",
    interact: { label: "看它摆尾溅起星光", fx: "splash" },
    choices: [
      { label: "伸出手，接住一颗", next: "whale_star" },
      { label: "就站在原地，看完这一场", next: "whale_watch" },
    ],
  },
  whale_star: {
    id: "whale_star",
    scene: "stars",
    npc: "whale",
    text: "一颗星星落进你掌心，轻轻的，温温的。鲸摆摆尾，潜回深海，像完成了一场郑重的交接：“收——好——哦——”",
    ending: { title: "星海", line: "世界会把温柔，亲手递给你。", hue: "#ffd9a0" },
  },
  whale_watch: {
    id: "whale_watch",
    scene: "whale",
    npc: "whale",
    text: "你没有伸手，只是静静看着。星光落回海里，鲸也慢慢游远。那声低低的“再——见——”，过了很久才游到你耳边。",
    ending: { title: "远观", line: "不占有的喜欢，也很完整。", hue: "#a3c1d6" },
  },
  sea_tell: {
    id: "sea_tell",
    scene: "sea",
    text: "你把烦恼一句一句说给海。海不回答，只是把浪放得很轻很轻，然后留下一枚贝壳，搁在你脚边。",
    interact: { label: "把烦恼说给海听", fx: "wave" },
    choices: [
      { label: "把贝壳贴近耳朵", next: "shell_listen" },
      { label: "把贝壳，轻轻还回海里", next: "shell_return" },
    ],
  },
  shell_listen: {
    id: "shell_listen",
    scene: "sea",
    text: "贝壳里传来很远很远的声音——不是海，是你自己的心跳。原来它一直这么稳，一直都在。",
    ending: { title: "回音", line: "你听，你一直好好的。", hue: "#e5a3ac" },
  },
  shell_return: {
    id: "shell_return",
    scene: "sea",
    text: "你把贝壳还给了海。它被浪卷走，带着你的烦恼，一起去了很远的地方。手上空了，心里也松了。",
    ending: { title: "放手", line: "放下，不是失去。", hue: "#aecaa4" },
  },

  /* ---------- 小村线 ---------- */
  village: {
    id: "village",
    scene: "village",
    npc: "granny",
    text: "小村比想象中还小，七八户人家，檐下都挂着纸灯笼。一位阿婆正踩着木凳，点最后一盏灯。她回头笑：“来得正好，帮我扶一扶凳子？”",
    interact: { label: "碰一碰檐下的灯笼", fx: "lanternsway" },
    choices: [
      { label: "帮她点亮最后一盏灯", next: "village_light" },
      { label: "坐在石阶上，听她讲岛上的旧事", next: "village_story" },
      { label: "顺着溪流，去村口的石桥看看", next: "bridge" },
    ],
  },
  village_light: {
    id: "village_light",
    scene: "village",
    npc: "granny",
    text: "火苗“噗”地亮起，暖光顺着屋檐一路淌下来。阿婆眯眼笑：“你看，灯这东西啊，点给别人看的时候，自己心里也亮。”满村的灯笼，轻轻晃。",
    ending: { title: "点灯人", line: "照亮别人的时候，自己也在光里。", hue: "#f0a860" },
  },
  village_story: {
    id: "village_story",
    scene: "village",
    npc: "granny",
    text: "阿婆讲起从前：哪年台风全村的灯都没灭，哪只猫偷吃了半条街的鱼。讲到山顶，她顿了顿：“上头有个数星星的娃娃，你上去替我看看她冷不冷。”",
    choices: [
      { label: "好，我去山顶看看", next: "meadow" },
      { label: "先去海边吹吹风", next: "sea" },
    ],
  },

  /* ---------- 石桥线 ---------- */
  bridge: {
    id: "bridge",
    scene: "bridge",
    text: "一座老石桥卧在溪上，月光在桥洞里睡成一枚银币。水很清，几尾红鲤在桥影里慢慢游，像几枚会动的火苗。",
    interact: { label: "惊起一尾鲤鱼", fx: "fishjump" },
    choices: [
      { label: "往桥下丢一颗小石子，听回声", next: "bridge_echo" },
      { label: "走过石桥，进山那边的林子", next: "forest" },
    ],
  },
  bridge_echo: {
    id: "bridge_echo",
    scene: "bridge",
    text: "咚。咚。咚。桥洞把石子声叠成三下，轻轻还给你。你忽然想起很久没人这样回应你了——原来“有回响”这件事，本身就让人安心。",
    ending: { title: "回声桥", line: "你的每一点声音，都有地方落。", hue: "#9bd4e0" },
  },

  /* ---------- 四季限定 ---------- */
  sakura_rest: {
    id: "sakura_rest",
    scene: "sakura",
    text: "转角处，一株老樱开得正盛。风一过，花瓣像慢动作的雪，落了你一肩。有一片停在掌心，粉得认真，像在说：这一季，我赶上了。",
    interact: { label: "吹一口气，送花瓣远行", fx: "petalburst" },
    ending: { title: "花信", line: "赶上花开的人，也被花记着。", hue: "#f4b8c8" },
  },
  lotus_rest: {
    id: "lotus_rest",
    scene: "lotus",
    text: "山坳里藏着一方荷池。荷叶挤挤挨挨地摇，一朵白荷半开不开，蜻蜓点水，一圈一圈。风从叶缝里穿过来，带着水汽的凉——是夏天写的信。",
    interact: { label: "点一点池面", fx: "ripple" },
    ending: { title: "荷风", line: "风带来的一点凉，够整个夏天用。", hue: "#b8e0d0" },
  },
  moonrise_rest: {
    id: "moonrise_rest",
    scene: "moonrise",
    text: "今晚的月亮又大又圆，从海面升起来的时候，整条海都亮了。一条银路从你脚下一直铺到月亮里，好像走上去，就能到它身边坐一坐。",
    interact: { label: "等一颗流星路过", fx: "shooting" },
    ending: { title: "满月", line: "月亮在天上，就没有人真的孤单。", hue: "#e8f0fa" },
  },
  hearth_rest: {
    id: "hearth_rest",
    scene: "hearth",
    text: "门外风声紧，雪粒子敲着窗。屋里炉火正旺，壶在低声唱歌，火星噼啪地讲着这一年的事。你伸出手烤火，暖意顺着指尖一直爬进心里。",
    interact: { label: "拨一拨炉火", fx: "emberburst" },
    ending: { title: "围炉", line: "外面越冷，里面越暖，这就叫家。", hue: "#ffb066" },
  },
};

/** 四季限定入口：当季才出现在码头，过季即消失 */
export const SEASONAL_GATE: Record<Season, { from: string; label: string; node: string }> = {
  spring: { from: "harbor", label: "循着花香，去看那株老樱（春限）", node: "sakura_rest" },
  summer: { from: "harbor", label: "山坳里的荷池正开着（夏限）", node: "lotus_rest" },
  autumn: { from: "harbor", label: "今晚的月亮好像特别圆（秋限）", node: "moonrise_rest" },
  winter: { from: "harbor", label: "小屋的炉火刚刚生起（冬限）", node: "hearth_rest" },
};

/** 全部可收集的结局（用于图鉴计数） */
export const ALL_ENDINGS = Object.values(storyNodes)
  .filter((n) => n.ending)
  .map((n) => n.ending!);

export function getNode(id: string): StoryNode {
  return storyNodes[id] ?? storyNodes[START_ID];
}

/** 开场白（非 NPC 节点的旁白语音画像） */
export const NARRATOR_VOICE = { base: 260, jitter: 60, wave: "sine" as OscillatorType, every: 2 };
