const $ = id => document.getElementById(id);

const customVocabList = $("custom-vocab-list");
const dodgeRange = $("dodge-range");
const numberOfWords = $("number-of-words");

const firstOnlyUsableV = $("first-only-usable-V");
const lastOnlyUsableV = $("last-only-usable-V");
const firstOnlyUsableC = $("first-only-usable-C");
const lastOnlyUsableC = $("last-only-usable-C");

const notInclude = $("not-include");
const notIncludeFirst = $("not-include-first");
const notIncludeLast = $("not-include-last");

const generatingBtn = $("generating-btn");
const copyBtnResult = $("copy-btn-result");
const btnDeleteResult = $("btn-delete-result");
const btnApplyEdit = $("btn-apply-edit");

const txtEdit = $("txt-edit");
const tableEdit = $("table-edit");

customVocabList.value = "人\nする\n物\n事";

disableEntry();

let generatedWords = [];
let displayingWords = [];

const VOCAB_LIST = {
	swadesh: ["私", "君 / 貴方", "彼", "私たち", "君たち", "彼ら", "これ", "あれ", "ここ", "そこ", "誰",
		"何", "どこ", "いつ", "どう", "否", "全て", "多く", "少し", "少ない", "他", "一", "二", "三",
		"四", "五", "大きい", "長い", "広い", "厚い", "重い", "小さい", "短い", "狭い", "細い", "女", "男",
		"人", "子", "妻", "夫", "母", "父", "生き物", "魚", "鳥", "犬", "シラミ", "蛇", "虫", "木",
		"森", "枝", "実 / 果物", "種", "葉", "根", "木皮", "花", "草", "縄", "皮", "肉", "血", "骨",
		"脂", "卵", "角", "尻尾", "羽", "髪", "頭", "耳", "目", "鼻", "口", "歯", "舌", "爪", "足",
		"脚", "膝", "手", "翼", "腹", "腸", "首", "背", "胸", "心", "肝", "飲む", "食べる", "噛む",
		"吸う", "吐く（つばなどを、自発的）", "吐く（嘔吐など、自発的でない）", "吹く", "息する", "笑う", "見る", "聞く",
		"知る", "思う", "嗅ぐ", "恐れる", "寝る", "生きる", "死ぬ", "殺す", "戦う", "狩る", "打つ", "切る",
		"割る", "刺す", "掻く", "掘る", "泳ぐ", "飛ぶ", "歩く", "来る", "寝る / 横たわる", "座る", "立つ",
		"回る", "落ちる", "与える / 上げる", "持つ", "絞る", "擦る", "洗う", "拭く", "引く", "押す", "投げる",
		"結ぶ", "縫う", "数える", "言う", "歌う", "遊ぶ", "浮く", "流れる", "凍る", "膨らむ", "日", "月",
		"星", "水", "雨", "川", "湖", "海", "塩", "石", "砂", "塵", "土", "雲", "霧", "空", "風",
		"雪", "氷", "煙", "火", "灰", "燃える", "道", "山", "赤", "緑", "黄色", "白", "黒", "夜",
		"日", "年", "暖かい", "寒い", "満ちた", "新しい", "古い", "良い", "悪い", "腐った", "汚い", "真っ直ぐ",
		"丸い", "鋭い", "鈍い", "滑らか", "濡れた", "乾いた", "正しい", "近い", "遠い", "右", "左",
		"at / で（場所、時間、イベント）", "in / で（大きな範囲、空間、領域の）", "with / と共に / を用いて", "と",
		"もし", "なぜなら 〜 だから", "名前"
	],
	sakamoto: ["一", "二", "三", "四", "五", "六", "七", "大きい", "小さい", "黒い", "白い", "足、脚",
		"手、腕", "火", "私", "あなた", "彼、彼女", "誰", "～に", "非常に", "少し", "長い", "短い", "名前",
		"新しい", "古い", "鼻", "時間", "来る", "する", "飲む", "食べる", "得る", "与える", "行く", "言う",
		"水", "八", "九", "十", "百", "～が", "～から", "～の", "～へ", "～とともに", "～で", "中", "外",
		"そして", "または", "悪い", "良い", "鳥", "血", "～できる", "日", "昼", "夜", "目", "父", "母",
		"家", "これ", "このように、こう", "それ", "そのように、そう", "あれ", "あのように、ああ", "どれ", "どのように、どう",
		"なぜ", "何", "いつ", "月", "太陽", "口", "～ではない（否定）", "力", "赤い", "縄", "空", "石",
		"我々", "あなた方", "これら", "それら", "あれら", "～である（コピュラ）", "ある", "ない", "持つ", "打つ、叩く",
		"殺す", "愛する", "見る", "立つ", "欲する", "歯", "木", "風", "～を", "～によって", "全て", "体",
		"骨", "下", "上", "胸", "炭", "寒い、冷たい", "熱い", "正しい", "誤った", "満ちた", "死", "命",
		"重い", "軽い", "暗い", "明るい", "光", "闇", "犬", "薬", "耳", "地面", "卵", "魚",
		"寒色系の色（緑、青など）", "頭", "毛", "ここ", "そこ", "あそこ", "どこ", "角", "ただ、単に", "葉", "左",
		"右", "シラミ", "膝", "男", "女", "多い", "少ない", "肉", "山", "いいえ", "はい", "狭い", "広い",
		"首", "次の", "今", "場所", "川", "塩", "砂", "履き物", "肌", "星", "尻尾", "厚い", "薄い",
		"吹く", "燃える", "変わる", "切る", "ある、いる", "～になる", "落ちる", "戦う", "育つ", "聞く", "狩る",
		"知る", "作る", "置く", "走る", "取る", "吸う", "思う、考える", "投げる", "曲がる", "起きる",
		"～しようとする", "歩く", "今日", "舌", "町", "良く", "世界", "黄色い", "灰", "背中", "腹", "なぜなら",
		"しかし", "だから", "雲", "～ごとに", "善の、正義の", "悪の", "生（なま）の", "花", "蝿", "～のために",
		"高い", "低い", "夫", "妻", "内臓", "主な", "心", "心臓", "雨", "根", "腐る", "種子", "煙", "蛇",
		"土", "蜘蛛", "太腿", "雷", "始まる", "終わる", "噛む", "含む", "泣く", "死ぬ", "生きる", "凍る",
		"去る", "動く", "開ける、開く", "閉じる、閉まる", "眠る", "刺す", "刺激する", "止まる", "使う", "働く",
		"道具、～機", "道", "言葉、単語", "どうぞ～してください"
	],
	miniv2: ["私", "貴方 君", "これ", "それ", "あれ", "どれ 何 誰", "の", "と また", "できる もし",
		"から 始まる より", "終わる まで", "事", "物", "数 量", "いくつか 達 ら", "全", "いいえ ない 無 非 不",
		"裏 逆 反", "欺く 嘘 偽 虚 騙す", "表 真 正 本当", "同じ", "違う", "場所", "方向", "上", "下", "縦",
		"右", "左", "隣 横", "斜め", "間 中 内", "外", "前", "後 奥", "性別", "男性", "女性", "絵 図",
		"息 呼吸", "文字", "言語 言葉", "霧 煙", "水", "元 源", "感覚 感じる 気持ち 心", "学", "殺 死",
		"覚える 記憶 知る 知識", "痛い 跡 痕 傷 傷つく", "角 鋭い", "面 板 壁", "糸 縄 毛", "軸 棒 針", "回 時間",
		"音声", "訓練 練習", "多分 恐らく", "唯一 だけ", "別 他", "色", "白 明るい", "黒 暗い", "赤", "青 緑",
		"黄", "人", "身体 形", "味", "しょっぱい", "酸っぱい", "渋い 苦い", "感情", "喜ばしい", "憤ろしい",
		"悲しい", "面白い 楽しい", "恐ろしい 怖い", "良い", "悪い", "固い 硬い", "柔らかい", "強い", "弱い",
		"重い すべき", "軽い", "新しい 早い 速い", "古い 遅い", "厳しい 難しい", "簡単 易しい 優しい", "大きい", "小さい",
		"熱い 暑い", "寒い 涼しい", "ある いる", "する", "した", "動く", "忘れる", "売る", "買う", "生きる",
		"変わる", "食べる 飲む", "あげる 渡す", "なる 得る 取る 持つ 貰う", "折れる", "開く", "閉まる",
		"関わる 続く 繋ぐ", "受ける される", "使う 用いる", "生む 産む", "作る", "切る", "したい ほしい 欲する"
	],
	S: ["私", "あなた 君", "彼 彼女", "これ", "それ", "あれ", "どれ 何", "の", "と また なお", "もし",
		"から", "まで", "こと", "もの", "数 数える 量", "０", "１", "２", "３", "４", "５", "６", "７",
		"８", "９", "いくつか 達 ら", "全部 すべて", "多分 恐らく だろう", "唯一 だけ のみ", "別 他",
		"いいえ ない 無 不 非", "裏 逆 反対", "再", "嘘 偽 虚", "表 真 本当 正しい", "同じ 等しい", "違う 異なる",
		"位置 場所", "方向", "上", "下", "縦", "右", "左", "隣 横", "斜め", "間 中 内", "外", "前",
		"後 奥", "性別", "男性", "女性", "回 時間", "今", "意味", "したい ほしい 欲する 欲望", "絵 図 印 記",
		"息 呼吸", "文字", "言語 言葉", "元 源", "感覚 気持ち 心", "学 考え", "記憶 知識",
		"跡 痕 痛い 痛み 辛い 傷 傷つく", "角 鋭い", "面 板 壁", "糸 縄", "毛", "棒 針", "訓練 練習", "生きる 生命",
		"殺 殺す 死 死ぬ", "音声", "音楽 曲", "年 歳", "月", "時", "切 切る 分", "秒", "色", "白", "黒",
		"灰", "赤", "青 緑", "紫", "黄", "星", "太陽 日", "調子 天気 空 様子", "雷", "空気", "風", "穴",
		"土 砂", "山", "穴 谷", "霧 煙", "水", "愛", "家族 属", "親", "兄弟 姉妹", "子ども", "動物", "魚類",
		"鳥類", "甲殻類 昆虫", "両生類 爬虫類", "犬", "猫", "卵", "植物", "りんご", "みかん", "スイカ かぼちゃ",
		"ぶどう マスカット", "木", "花", "種", "果実 つぼみ", "野菜", "神様", "悪魔", "人 者", "身体 形", "血",
		"涙", "おしっこ うんち", "頭 顔", "胸", "尻尾", "腰 おしり", "首", "茎", "目 眼", "耳", "鼻", "口",
		"歯", "舌", "爪", "手", "葉", "羽 翼", "足", "根", "肉", "味", "しょっぱい", "酸っぱい",
		"渋い 苦い", "感情", "うれしい 喜ばしい", "憤ろしい", "悲しい", "面白い 楽しい", "恐ろしい 怖い", "忙しい",
		"疲労 疲れる だるい", "甘い かわいい", "かっこいい", "美しい きれい", "汚い 醜い", "良い", "悪い", "固い 硬い",
		"柔らかい", "強い", "弱い", "重い すべき", "軽い", "新しい", "古い", "早い 速い", "遅い", "難しい",
		"簡単 易しい", "厳しい", "優しい", "大きい", "小さい", "濃い", "薄い", "熱い 暑い", "寒い 涼しい", "明るい",
		"暗い", "ある いる", "する", "した", "できる", "させる 作る", "される 受ける", "なる 得る 取る 持つ 貰う",
		"動く", "寝る 眠る", "忘れる", "売る", "買う", "押す", "引く", "刺す", "変わる", "腐る", "食べる 飲む",
		"あげる 渡す", "折れる 曲がる", "止まる", "始まる", "終わる", "開く", "閉まる", "関わる", "続く 繋ぐ",
		"使う 用いる", "生む 産む", "加える 足す", "重なり ビラ", "殴る 蹴る 叩く", "戦い 戦う"
	],
	custom: []
};

const generate = {
	random: () => {
		let len = detectLength();

		for (let i = 0; i < len; i++) {
			word = getCharacter();

			if (isValid(word)) {
				generatedWords.push(word);
			} else {
				i--;
			}
		}
	},
	avoidDuplicate: () => {
		let len = detectLength();

		for (let i = 0; i < len; i++) {
			word = getCharacter();

			if (isValid(word) && !generatedWords.includes(word)) {
				generatedWords.push(word);
			} else {
				i--;
			}
		}
	},
	avoidMinimalPair: () => {
		let len = detectLength();

		for (let i = 0; i < len; i++) {
			word = getCharacter();

			if (isValid(word) && !generatedWords.includes(word) && avoidWord(word)) {
				generatedWords.push(word);
			} else {
				i--;
			}
		}
	}
};

function avoidWord(word) {
	avoid = true;

	generatedWords.slice(-dodgeRange.value).forEach(e => {
		if (isMinimalPair(word, e)) avoid = false;
	});

	return avoid;
}

function isMinimalPair(word1, word2) {
	if (word1.length !== word2.length) return false;

	let diffCount = 0;

	for (let i = 0; i < word1.length; i++) {
		if (word1[i] !== word2[i]) diffCount++;
		if (diffCount > 1) return false;
	}

	return diffCount === 1;
}

function getCharacter() {
	let numberOfC = consonant.value.split(" ").length;
	let numberOfV = vowel.value.split(" ").length;
	let total = numberOfC + numberOfV;
	let cv = ~~(Math.random() * total) < numberOfC ? 0 : 1;
	const len = ~~(Math.random() * ~~(+maximum.value - +minimum.value + 1)) + +minimum.value;

	let word = "";

	for (let i = 0; i < len; i++) {
		if (cv) {
			if (!i && firstOnlyUsableV.value) {
				fouvvs = firstOnlyUsableV.value.split(" ");
				word += fouvvs[~~(Math.random() * fouvvs.length)];
			} else if (i == len - 1 && lastOnlyUsableV.value) {
				louvvs = lastOnlyUsableV.value.split(" ");
				word += louvvs[~~(Math.random() * louvvs.length)];
			} else {
				word += vowel.value.split(" ")[~~(Math.random() * numberOfV)];
			}

			cv = 0;
		} else {
			if (!i && firstOnlyUsableC.value) {
				foucvs = firstOnlyUsableC.value.split(" ");
				word += foucvs[~~(Math.random() * foucvs.length)];
			} else if (i == len - 1 && lastOnlyUsableC.value) {
				loucvs = lastOnlyUsableC.value.split(" ");
				word += loucvs[~~(Math.random() * loucvs.length)];
			} else {
				word += consonant.value.split(" ")[~~(Math.random() * numberOfC)];
			}

			cv = 1;
		}
	}

	return word;
}

function detectLength() {
	if (vocab.value == "no" || (vocab.value == "custom" && !customVocabList.value)) {
		return +numberOfWords.value;
	} else {
		if (!result.innerHTML.includes("<table>")) result.innerText = "", generatedWords = [];
		return VOCAB_LIST[vocab.value].length;
	}
}

function isValid(word) {
	let valid = true;

	notInclude.value.split(" ").forEach(e => {
		if (e && word.includes(e)) valid = false;
	});

	notIncludeFirst.value.split(" ").forEach(e => {
		if (e && word.startsWith(e)) valid = false;
	});

	notIncludeLast.value.split(" ").forEach(e => {
		if (e && word.endsWith(e)) valid = false;
	});

	return valid;
}

function generateResult() {
	if (!result.hidden && consonant.value && vowel.value && 1 <= dodgeRange.value && dodgeRange.value <=100 && 1 <= minimum.value && minimum.value <= maximum.value && maximum.value <= 10) {
		cvlv = customVocabList.value;

		if (cvlv) VOCAB_LIST.custom = cvlv.split("\n");
		generate[method.value]();

		selectDictionary();
	} else {
		alert("入力が不正です");
	}
}

function disableEntry () {
	dodgeRange.disabled = !(method.value == "avoidMinimalPair");
	customVocabList.disabled = !(vocab.value == "custom");
	numberOfWords.disabled = !(vocab.value == "no");
}

addEventListener("change", () => {
	disableEntry();
});

generatingBtn.addEventListener("click", () => {
	generateResult();
});

copyBtnResult.addEventListener("click", () => {
	navigator.clipboard.writeText(result.innerText);
	alert("結果をコピーしました");
});

btnDeleteResult.addEventListener("click", () => {
	if (confirm("本当に削除しますか？")) generatedWords = [], txtEdit.value = result.innerText = "";
});

function edit() {
	result.hidden = true;

	if (result.innerHTML.includes("<table>")) {
		tableEdit.hidden = false;
		tableEdit.focus();
	} else {
		txtEdit.hidden = false;
		txtEdit.focus();
	}

	btnApplyEdit.hidden = false;
}

result.addEventListener("dblclick", () => {
	edit();
});

function applyEdit() {
	result.hidden = false;

	if (result.innerHTML.includes("<table>")) {
		tableEdit.hidden = true;

		let wordEdit = document.querySelectorAll(".word-edit");

		tableEdit.innerText = result.innerText = "";

		[...wordEdit].forEach((e, i) => {
			generatedWords[i] = e.value ? e.value : txtEdit.value.split("\n")[i];
		});

		editChar = generatingChar = "<table>";

		generatedWords.forEach((e, i) => {
			if (e) {
				editChar += "<tr><td><input class='word-edit' type='text' value='" + e + "'></td><td>" + VOCAB_LIST[vocab.value][i] + "</tr>";
				generatingChar += "<tr><td>" + e + "</td><td>" + VOCAB_LIST[vocab.value][i] + "</tr>";
				txtEdit.value += e + "\n";
			}
		});

		editChar += "</table>";
		generatingChar += "</table>";

		result.innerHTML += generatingChar;
		tableEdit.innerHTML += editChar;

		generatedWords = [];
	} else {
		txtEdit.hidden = true;

		result.innerText = txtEdit.value;

		if (txtEdit.value) {
			generatedWords = txtEdit.value.split("\n");
		} else {
			generatedWords = [];
		}
	}

	btnApplyEdit.hidden = true;
}

btnApplyEdit.addEventListener("click", () => {
	applyEdit();
});

txtEdit.addEventListener("change", () => {
	applyEdit();
});

addEventListener("keydown", e => {
	if (e.ctrlKey && e.key == "Enter") applyEdit();
});

function selectDictionary() {
	txtEdit.value = tableEdit.innerText = result.innerText = "";

	if (vocab.value == "no" || (vocab.value == "custom" && !customVocabList.value)) {
		generatedWords.forEach(e => {
			if (e) result.innerText += e + "\n", txtEdit.value += e + "\n";
		});
	} else {
		editChar = generatingChar = "<table>";

		generatedWords.forEach((e, i) => {
			if (e) {
				editChar += "<tr><td><input class='word-edit' type='text' value='" + e + "'></td><td>" + VOCAB_LIST[vocab.value][i] + "</tr>";
				generatingChar += "<tr><td>" + e + "</td><td>" + VOCAB_LIST[vocab.value][i] + "</tr>";
				txtEdit.value += e + "\n";
			}
		});

		editChar += "</table>";
		generatingChar += "</table>";

		result.innerHTML += generatingChar;
		tableEdit.innerHTML += editChar;
		generatedWords = [];
	}
}
