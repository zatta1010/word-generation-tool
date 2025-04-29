// モジュール化を強化し、ES6の機能を活用
// DOMアクセスを管理するクラス
class DOMManager {
	constructor() {
		this.elements = {};
	}

	// DOM要素を初期化する
	initialize() {
		// セレクタを使って要素を取得（キャッシュ利用）
		const $ = id => document.getElementById(id);

		this.elements = {
			// 設定関連
			detailedToggleIcon: $("detailed-toggle-icon"),
			detailedSetting: $("detailed-setting"),
			detailedSettingAccordion: $("detailed-setting-accordion"),
			regulationSelect: $("vocab"),
			regulationSelection: $("regulation-selection"),
			customVocabList: $("custom-vocab-list"),
			dodgeRange: $("dodge-range"),
			numberOfWordsInput: $("number-of-words-input"),

			// 文字制限関連
			firstOnlyUsableV: $("first-only-usable-V"),
			lastOnlyUsableV: $("last-only-usable-V"),
			firstOnlyUsableC: $("first-only-usable-C"),
			lastOnlyUsableC: $("last-only-usable-C"),
			notInclude: $("not-include"),
			notIncludeFirst: $("not-include-first"),
			notIncludeLast: $("not-include-last"),

			// 母音子音設定
			consonant: $("consonant"),
			vowel: $("vowel"),
			minimum: $("minimum"),
			maximum: $("maximum"),
			method: $("method"),

			// ボタン類
			generatingBtn: $("generating-btn"),
			copyBtnResult: $("copy-btn-result"),
			btnDeleteResult: $("btn-delete-result"),
			btnEdit: $("btn-edit"),
			btnApplyEdit: $("btn-apply-edit"),

			// 表示・編集エリア
			txtEdit: $("txt-edit"),
			tableEdit: $("table-edit"),
			result: $("result")
		};

		// デフォルト値の設定
		this.elements.customVocabList.value = "人\nする\n物\n事";
	}

	// 特定の要素の取得
	get(elementName) {
		if (!this.elements[elementName]) {
			console.warn(`Element "${elementName}" not found`);
		}
		return this.elements[elementName];
	}
}

// 辞書データを管理するクラス
class DictionaryManager {
	constructor() {
		this.dictionaries = {
			swadesh: {
				words: [],
				tags: [],
				categories: new Set()
			},
			sakamoto: {
				words: [],
				tags: [],
				categories: new Set()
			},
			custom: {
				words: []
			}
		};
	}

	// 辞書データを非同期で読み込む（Promise改善）
	async loadDictionaries() {
		try {
			const dictNames = Object.keys(this.dictionaries).filter(name => name && name !== "custom");
			
			const loadPromises = dictNames.map(async (dictName) => {
				try {
					const response = await fetch(`json/${dictName}.json`);
					if (!response.ok) {
						throw new Error(`HTTP error ${response.status} while loading ${dictName}.json`);
					}
					
					const wordsData = await response.json();
					const dict = this.dictionaries[dictName];
					
					if (!(dict.categories instanceof Set)) {
						dict.categories = new Set(dict.categories);
					}
					
					wordsData.forEach(item => {
						dict.words.push(item.word);
						dict.tags.push(item.tags);
						item.tags.forEach(tag => dict.categories.add(tag));
					});
					
					dict.categories = [...dict.categories];
					console.log(`${dictName}.json 読み込み完了`);
				} catch (error) {
					console.error(`辞書の読み込みでエラーが発生しました: ${dictName}.json`, error);
					throw error; // 再スロー
				}
			});
			
			await Promise.all(loadPromises);
			return true;
		} catch (error) {
			console.error("辞書の読み込みに失敗しました", error);
			alert("辞書の読み込みに失敗しました。再試行してください。");
			return false;
		}
	}

	// カスタム辞書を更新
	updateCustomDictionary(customVocabValue) {
		if (customVocabValue) {
			// 空行を除外
			this.dictionaries.custom.words = customVocabValue.split("\n").filter(line => line.trim());
		} else {
			this.dictionaries.custom.words = [];
		}
	}

	// 現在選択されている辞書を取得
	getCurrentDictionary(regulationSelectValue) {
		return regulationSelectValue;
	}
}

// 単語生成ルールを管理するクラス
class RegulationManager {
	constructor(domManager, dictionaryManager) {
		this.wordGenerationRule = new Map();
		this.domManager = domManager;         // DOMManagerの参照を保持
		this.dictionaryManager = dictionaryManager; // DictionaryManagerの参照を保持
		
		// 単語生成規則の初期値
		this.defaultRegulation = {
			consonant: "",
			vowel: "",
			firstOnlyUsableC: "",
			lastOnlyUsableC: "",
			firstOnlyUsableV: "",
			lastOnlyUsableV: "",
			notInclude: "",
			notIncludeFirst: "",
			notIncludeLast: "",
			minimum: "",
			maximum: ""
		};
	}
	
	// カテゴリ
	setRegulation(regulationSelection, domManager) {
		// 現在選択されているカテゴリの規則を追加
		if (!this.wordGenerationRule.has(regulationSelection)) {
			// 新しい規則を作成（デフォルト値のディープコピー）
			const newRegulation = JSON.parse(JSON.stringify(this.defaultRegulation));
			
			// DOM要素から値を取得して設定
			Object.keys(newRegulation).forEach(key => {
				newRegulation[key] = domManager.get(key).value;
			});
			
			// 規則を保存
			this.wordGenerationRule.set(regulationSelection, newRegulation);
		}
		
		return this.wordGenerationRule.get(regulationSelection);
	}
	
	// 特定の規則を取得
	getRegulation(regulationSelection) {
		return this.wordGenerationRule.get(regulationSelection) || this.defaultRegulation;
	}

	// 入力フォームの状態を保存する
	saveRegulation(regulationSelection, domManager) {
	    const newRegulation = JSON.parse(JSON.stringify(this.defaultRegulation));
	    Object.keys(newRegulation).forEach(key => {
	        if (domManager.get(key)) {
	            newRegulation[key] = domManager.get(key).value;
	        }
	    });
	    this.wordGenerationRule.set(regulationSelection, newRegulation);
	}

	// 引数の単語のカテゴリの生成規則を取得する
	getWordProductionRule(wordIndex) {
		// 返す入力規則を変数で代入する（デフォルト規則をベースにする）
		const defaultRule = this.wordGenerationRule.get("default") || this.defaultRegulation;
		let resultRule = JSON.parse(JSON.stringify(defaultRule));

		// 現在選択されている辞書を取得
		const regulationSelect = this.domManager.get('regulationSelect').value;

		// カスタム辞書または辞書なしの場合はデフォルト規則を返す
		if (regulationSelect === "no" || regulationSelect === "custom") {
			// ここでdefaultを定義
			this.saveRegulation("default", this.domManager);
			const defaultRule = this.wordGenerationRule.get("default");

			return defaultRule;
		}

		// DictionaryManager.dictionariesで今選択されている辞書のwordsとtagsを取得する
		const dictionary = this.dictionaryManager.dictionaries[regulationSelect];

		// 辞書の中でwordIndex番目のtagsを取得
		const tags = dictionary.tags[wordIndex];

		console.log(tags, defaultRule, resultRule);

		// タグがない場合はデフォルト規則を返す
		if (!tags || tags.length === 0) {
			return resultRule;
		}

		// 取得したtagsの中にRegulationManager.wordGenerationRuleのいずれか（defaultを除く）が含まれているか調べる
		for (const [category, rule] of this.wordGenerationRule.entries()) {
			// defaultカテゴリはスキップ
			if (category === "default") continue;

			// タグにカテゴリが含まれているか確認
			if (tags.includes(category)) {
				// 含まれている場合はRegulationManager.wordGenerationRuleの中のオブジェクトを全探索する
				Object.keys(rule).forEach(key => {
					// 値が空白なら返す入力規則の同じオブジェクトのキー名の値はRegulationManager.wordGenerationRule["default"]に置き換える
					// 値が何かしら入力されている場合は同じオブジェクトのキー名の値をそれに置き換える
					if (rule[key] !== undefined && rule[key] !== null && rule[key] !== "") {
						resultRule[key] = rule[key];
					}
				});

				// 最初に見つかったカテゴリのルールを適用して終了
				return resultRule;
			}
		}

		// 含まれていない場合はRegulationManager.wordGenerationRule["default"]をまんま返す
		return resultRule;
	}
}

// 単語生成を管理するクラス
class WordGenerator {
	constructor(domManager, dictionaryManager, regulationManager) {
		this.domManager = domManager;
		this.dictionaryManager = dictionaryManager;
		this.regulationManager = regulationManager;
		this.generatedWordList = [];
	}

	// 単語生成の主要メソッド
	generate() {
		this.updateDictionary();
		const methodName = this.domManager.get('method').value;
		
		if (!this.generateMethods[methodName]) {
			console.error(`Method ${methodName} not found`);
			return false;
		}
		
		this.generateMethods[methodName].call(this);
		return true;
	}
	
	// 辞書更新
	updateDictionary() {
		const customVocabValue = this.domManager.get('customVocabList').value;
		this.dictionaryManager.updateCustomDictionary(customVocabValue);
	}

	// 単語を生成する各種方法
	generateMethods = {
		// ランダム生成
		random() {
			const len = this.getNumberOfWordsToGenerate();
			let attempts = 0;
			const maxAttempts = len * 10; // 無限ループ防止

			for (let i = 0; i < len && attempts < maxAttempts; attempts++) {
				const word = this.getRandomWord();

				if (this.isValid(word)) {
					this.generatedWordList.push(word);
					i++;
				}
			}
			
			if (attempts >= maxAttempts) {
				console.warn("生成試行回数が上限に達しました。条件を見直してください。");
			}
		},

		// 重複回避
		avoidDuplicate() {
			const len = this.getNumberOfWordsToGenerate();
			let attempts = 0;
			const maxAttempts = len * 20; // 無限ループ防止

			for (let i = 0; i < len && attempts < maxAttempts; attempts++) {
				const word = this.getRandomWord();

				if (this.isValid(word) && !this.generatedWordList.includes(word)) {
					this.generatedWordList.push(word);
					i++;
				}
			}
			
			if (attempts >= maxAttempts) {
				console.warn("重複しない単語の生成が困難です。条件を見直してください。");
			}
		},

		// 昇順生成（最適化）
		ascendingOrder() {
			const len = this.getNumberOfWordsToGenerate();
			const minimum = parseInt(this.domManager.get('minimum').value, 10);
			const maximum = parseInt(this.domManager.get('maximum').value, 10);
			const consonants = this.domManager.get('consonant').value.split(" ").filter(Boolean);
			const vowels = this.domManager.get('vowel').value.split(" ").filter(Boolean);
			
			// 効率化：事前計算とセットを使用
			const generatedSet = new Set();
			let currentLength = minimum;
			let generatedCount = 0;

			while (generatedCount < len && currentLength <= maximum) {
				// 効率的なパターン生成方法（反復的な試行）
				for (let attempt = 0; attempt < 1000 && generatedCount < len; attempt++) {
					let word = this.generateWordOfLength(currentLength, consonants, vowels);
					
					if (this.isValid(word) && !generatedSet.has(word)) {
						this.generatedWordList.push(word);
						generatedSet.add(word);
						generatedCount++;
					}
				}
				currentLength++;
			}
		},

		// ミニマルペア回避
		avoidMinimalPair() {
			const len = this.getNumberOfWordsToGenerate();
			let attempts = 0;
			const maxAttempts = len * 30; // 無限ループ防止

			for (let i = 0; i < len && attempts < maxAttempts; attempts++) {
				const word = this.getRandomWord();

				if (this.isValid(word) &&
					!this.generatedWordList.includes(word) &&
					this.avoidMinimalPair(word)) {
					this.generatedWordList.push(word);
					i++;
				}
			}
			
			if (attempts >= maxAttempts) {
				console.warn("ミニマルペアを回避できない場合があります。条件を見直してください。");
				alert("ミニマルペアを回避できない場合があります。条件を見直してください。");
			}
		}
	};

	// 特定の長さの単語を生成（昇順生成用）
	generateWordOfLength(length, consonants, vowels) {
		let word = "";
		let isConsonant = Math.random() * (consonants.length + vowels.length) > vowels.length; // ランダムに子音か母音から始める
		
		const firstOnlyUsableV = this.domManager.get('firstOnlyUsableV').value.split(" ").filter(Boolean);
		const lastOnlyUsableV = this.domManager.get('lastOnlyUsableV').value.split(" ").filter(Boolean);
		const firstOnlyUsableC = this.domManager.get('firstOnlyUsableC').value.split(" ").filter(Boolean);
		const lastOnlyUsableC = this.domManager.get('lastOnlyUsableC').value.split(" ").filter(Boolean);
		
		for (let i = 0; i < length; i++) {
			if (isConsonant) {
				if (i === 0 && firstOnlyUsableC.length) {
					word += firstOnlyUsableC[Math.floor(Math.random() * firstOnlyUsableC.length)];
				} else if (i === length - 1 && lastOnlyUsableC.length) {
					word += lastOnlyUsableC[Math.floor(Math.random() * lastOnlyUsableC.length)];
				} else {
					word += consonants[Math.floor(Math.random() * consonants.length)];
				}
			} else {
				if (i === 0 && firstOnlyUsableV.length) {
					word += firstOnlyUsableV[Math.floor(Math.random() * firstOnlyUsableV.length)];
				} else if (i === length - 1 && lastOnlyUsableV.length) {
					word += lastOnlyUsableV[Math.floor(Math.random() * lastOnlyUsableV.length)];
				} else {
					word += vowels[Math.floor(Math.random() * vowels.length)];
				}
			}
			
			isConsonant = !isConsonant; // 交互に切り替え
		}
		
		return word;
	}

	// ランダムな単語を生成
	getRandomWord() {
		// 修正案
		// 現在のthis.domManager.get('regulationSelection')に基づく選択は関係ない
		// 単語を生成するときに、<table><thead><th>単語</th><th>意味</th><th>カテゴリ</th></thead><tbody>〜（単語など）〜</tbody></table>のように生成するけど、単語に対応したカテゴリの中に例えば（名詞,人間,代名詞,人称代名詞,生物）というカテゴリが合った場合に、規則に名詞あった場合は、その単語は"名詞"の規則で生成する。次の単語のカテゴリがもしも（形容詞,サイズ）で、その中に規則に形容詞というものがあったら、"形容詞"という規則でその単語を生成する

		// 現在の選択に基づいた単語の入力規則を取得
		const regulationSelect = this.domManager.get('regulationSelect');
		const regulationSelection = this.domManager.get('regulationSelection');
		
		// 辞書ベースの生成の場合、単語インデックスを取得
		let wordIndex = -1;
		if (regulationSelect.value !== "no" && 
			!(regulationSelect.value === "custom" && !this.domManager.get('customVocabList').value)) {
			// 既に生成された単語数をインデックスとして使用
			wordIndex = this.generatedWordList.length;
		}
		
		// 現在適用すべき規則を取得
		let rule = this.regulationManager.getWordProductionRule(wordIndex);
		
		// 規則から値を取得
		const consonants = (rule.consonant || "").split(" ").filter(Boolean);
		const vowels = (rule.vowel || "").split(" ").filter(Boolean);
		const firstOnlyUsableV = (rule.firstOnlyUsableV || "").split(" ").filter(Boolean);
		const lastOnlyUsableV = (rule.lastOnlyUsableV || "").split(" ").filter(Boolean);
		const firstOnlyUsableC = (rule.firstOnlyUsableC || "").split(" ").filter(Boolean);
		const lastOnlyUsableC = (rule.lastOnlyUsableC || "").split(" ").filter(Boolean);
		
		// 規則に値がない場合、DOM要素の値をフォールバックとして使用
		if (consonants.length === 0) {
			consonants.push(...this.domManager.get('consonant').value.split(" ").filter(Boolean));
		}
		
		if (vowels.length === 0) {
			vowels.push(...this.domManager.get('vowel').value.split(" ").filter(Boolean));
		}
		
		const numberOfC = consonants.length;
		const numberOfV = vowels.length;
		const total = numberOfC + numberOfV;
		
		// 子音または母音がない場合の処理
		if (numberOfC === 0 || numberOfV === 0) {
			console.warn("子音または母音が指定されていません");
			return "";
		}
		
		// 最初の文字タイプをランダムに決定（0: 子音、1: 母音）
		let cv = Math.floor(Math.random() * total) < numberOfC ? 0 : 1;
		
		// 最小値と最大値の間でランダムな長さを決定
		const min = parseInt(rule.minimum || this.domManager.get('minimum').value, 10);
		const max = parseInt(rule.maximum || this.domManager.get('maximum').value, 10);
		const len = Math.floor(Math.random() * (max - min + 1)) + min;

		let word = "";

		for (let i = 0; i < len; i++) {
			if (cv === 1) { // 母音の場合
				if (i === 0 && firstOnlyUsableV.length > 0) {
					word += firstOnlyUsableV[Math.floor(Math.random() * firstOnlyUsableV.length)];
				} else if (i === len - 1 && lastOnlyUsableV.length > 0) {
					word += lastOnlyUsableV[Math.floor(Math.random() * lastOnlyUsableV.length)];
				} else {
					word += vowels[Math.floor(Math.random() * numberOfV)];
				}
				cv = 0;
			} else { // 子音の場合
				if (i === 0 && firstOnlyUsableC.length > 0) {
					word += firstOnlyUsableC[Math.floor(Math.random() * firstOnlyUsableC.length)];
				} else if (i === len - 1 && lastOnlyUsableC.length > 0) {
					word += lastOnlyUsableC[Math.floor(Math.random() * lastOnlyUsableC.length)];
				} else {
					word += consonants[Math.floor(Math.random() * numberOfC)];
				}
				cv = 1;
			}
		}

		return word;
	}

	// ミニマルペアを回避するかチェック
	avoidMinimalPair(word) {
		const dodgeRange = parseInt(this.domManager.get('dodgeRange').value, 10);
		const recentWords = this.generatedWordList.slice(-dodgeRange);
		
		// 任意の単語とミニマルペアであるかチェック
		return !recentWords.some(existingWord => this.isMinimalPair(word, existingWord));
	}

	// 二つの単語がミニマルペアかチェック（より明確なロジック）
	isMinimalPair(word1, word2) {
		if (word1.length !== word2.length) return false;

		let diffCount = 0;
		const len = word1.length;

		for (let i = 0; i < len; i++) {
			if (word1[i] !== word2[i]) {
				diffCount++;
				if (diffCount > 1) return false; // 早期リターン
			}
		}

		return diffCount === 1;
	}

	// 単語が有効かチェック（バリデーション強化）
	isValid(word) {
		if (!word || typeof word !== 'string') return false;
	
		const wordIndex = this.generatedWordList.length; // 現在生成中の単語のインデックス
		const rule = this.regulationManager.getWordProductionRule(wordIndex);
	
		const notInclude = (rule.notInclude || "").split(" ").filter(Boolean);
		const notIncludeFirst = (rule.notIncludeFirst || "").split(" ").filter(Boolean);
		const notIncludeLast = (rule.notIncludeLast || "").split(" ").filter(Boolean);
	
		// 禁止文字列チェック
		if (notInclude.some(forbidden => word.includes(forbidden))) return false;
		if (notIncludeFirst.some(forbidden => word.startsWith(forbidden))) return false;
		if (notIncludeLast.some(forbidden => word.endsWith(forbidden))) return false;

		return true;
	}

	// 生成する単語数を取得
	getNumberOfWordsToGenerate() {
		const regulationSelect = this.domManager.get('regulationSelect');
		const customVocabList = this.domManager.get('customVocabList');
		const numberOfWordsInput = this.domManager.get('numberOfWordsInput');
		const result = this.domManager.get('result');

		// 独自生成の場合
		if (regulationSelect.value === "no" || 
				(regulationSelect.value === "custom" && !customVocabList.value)) {
			return parseInt(numberOfWordsInput.value, 10);
		} 
		// 辞書ベースの場合
		else {
			if (!result.innerHTML.includes("<table>")) {
				result.innerText = "";
				this.clearResults();
			}
			return this.dictionaryManager.dictionaries[regulationSelect.value].words.length;
		}
	}

	// 結果をクリア
	clearResults() {
		this.generatedWordList = [];
	}
}

// UI操作を管理するクラス
class UIManager {
	constructor(domManager, wordGenerator, dictionaryManager, regulationManager) {
		this.domManager = domManager;
		this.wordGenerator = wordGenerator;
		this.dictionaryManager = dictionaryManager;
		this.regulationManager = regulationManager;
	}

	// UI要素の有効/無効を切り替え
	updateUIState() {
		const dodgeRange = this.domManager.get('dodgeRange');
		const method = this.domManager.get('method');
		const customVocabList = this.domManager.get('customVocabList');
		const regulationSelect = this.domManager.get('regulationSelect');
		const numberOfWordsInput = this.domManager.get('numberOfWordsInput');
		const regulationSelection = this.domManager.get('regulationSelection');

		// 条件に基づいて要素の有効/無効を切り替え
		dodgeRange.disabled = method.value !== "avoidMinimalPair";
		customVocabList.disabled = regulationSelect.value !== "custom";
		numberOfWordsInput.disabled = regulationSelect.value !== "no";
		regulationSelection.disabled = regulationSelect.value === "no";
	}

	// 結果を表示
	displayResults() {
		const regulationSelect = this.domManager.get('regulationSelect');
		const customVocabList = this.domManager.get('customVocabList');
		const txtEdit = this.domManager.get('txtEdit');
		const tableEdit = this.domManager.get('tableEdit');
		const result = this.domManager.get('result');

		// 編集フィールドと結果をクリア
		txtEdit.value = tableEdit.innerText = result.innerText = "";

		// 表示形式を決定
		if (regulationSelect.value === "no" || 
				(regulationSelect.value === "custom" && !customVocabList.value)) {
			this.displayTextResults();
		} else {
			this.displayTableResults();
		}
	}

	// テキスト形式で結果を表示
	displayTextResults() {
		const txtEdit = this.domManager.get('txtEdit');
		const result = this.domManager.get('result');
		const wordList = this.wordGenerator.generatedWordList;

		// 各単語を表示
		wordList.forEach(word => {
			if (word) {
				result.innerText += word + "\n";
				txtEdit.value += word + "\n";
			}
		});
	}

	// テーブル形式で結果を表示
	displayTableResults() {
		const txtEdit = this.domManager.get('txtEdit');
		const tableEdit = this.domManager.get('tableEdit');
		const result = this.domManager.get('result');
		const regulationSelect = this.domManager.get('regulationSelect');
		const wordList = this.wordGenerator.generatedWordList;

		// テーブルのヘッダー部分
		let editTableHTML = "<table><thead><tr><th>単語</th><th>意味</th><th>カテゴリ</th></tr></thead><tbody>";
		let displayTableHTML = "<table><thead><tr><th>単語</th><th>意味</th><th>カテゴリ</th></tr></thead><tbody>";

		// 各単語の情報を追加
		wordList.forEach((word, i) => {
			if (word) {
				const dictType = regulationSelect.value;
				const dictionary = this.dictionaryManager.dictionaries[dictType];
				const categoryText = dictType === "custom" ? "なし" : (dictionary.tags[i] || "なし");

				// 編集用テーブル行
				editTableHTML += `<tr>
					<td><input class='word-edit' type='text' value='${this.escapeHtml(word)}'></td>
					<td>${this.escapeHtml(dictionary.words[i] || "")}</td>
					<td>${this.escapeHtml(categoryText)}</td>
				</tr>`;

				// 表示用テーブル行
				displayTableHTML += `<tr>
					<td>${this.escapeHtml(word)}</td>
					<td>${this.escapeHtml(dictionary.words[i] || "")}</td>
					<td>${this.escapeHtml(categoryText)}</td>
				</tr>`;

				txtEdit.value += word + "\n";
			}
		});

		// テーブルのフッター部分
		editTableHTML += "</tbody></table>";
		displayTableHTML += "</tbody></table>";

		// HTMLを挿入
		result.innerHTML = displayTableHTML;
		tableEdit.innerHTML = editTableHTML;
		
		// 生成リストをクリア
		this.wordGenerator.clearResults();
	}

	// HTML特殊文字のエスケープ（セキュリティ対策）
	escapeHtml(text) {
		if (!text) return "";
		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	// 編集モードに切り替え
	switchToEditMode() {
		const generatingBtn = this.domManager.get('generatingBtn');
		const copyBtnResult = this.domManager.get('copyBtnResult');
		const btnDeleteResult = this.domManager.get('btnDeleteResult');
		const result = this.domManager.get('result');
		const tableEdit = this.domManager.get('tableEdit');
		const txtEdit = this.domManager.get('txtEdit');
		const btnApplyEdit = this.domManager.get('btnApplyEdit');
		const btnEdit = this.domManager.get('btnEdit');

		// ボタンの状態変更
		generatingBtn.disabled = copyBtnResult.disabled = btnDeleteResult.disabled = true;
		result.hidden = true;

		// 表示形式に合わせて編集エリアを表示
		if (result.innerHTML.includes("<table>")) {
			tableEdit.hidden = false;
			tableEdit.focus();
		} else {
			txtEdit.hidden = false;
			txtEdit.focus();
		}

		// 編集用ボタンの表示切替
		btnApplyEdit.hidden = false;
		btnEdit.hidden = true;
	}

	// 編集を適用
	applyEdit() {
		const generatingBtn = this.domManager.get('generatingBtn');
		const copyBtnResult = this.domManager.get('copyBtnResult');
		const btnDeleteResult = this.domManager.get('btnDeleteResult');
		const result = this.domManager.get('result');
		const tableEdit = this.domManager.get('tableEdit');
		const txtEdit = this.domManager.get('txtEdit');
		const btnApplyEdit = this.domManager.get('btnApplyEdit');
		const btnEdit = this.domManager.get('btnEdit');

		// ボタンの状態変更
		generatingBtn.disabled = copyBtnResult.disabled = btnDeleteResult.disabled = false;
		result.hidden = false;

		// 表示形式に合わせて編集適用
		if (result.innerHTML.includes("<table>")) {
			this.applyTableEdit();
		} else {
			this.applyTextEdit();
		}

		// 編集用ボタンの表示切替
		btnApplyEdit.hidden = true;
		btnEdit.hidden = false;
	}

	// テーブル編集を適用
	applyTableEdit() {
		const tableEdit = this.domManager.get('tableEdit');
		const txtEdit = this.domManager.get('txtEdit');
		const result = this.domManager.get('result');
		const regulationSelect = this.domManager.get('regulationSelect');

		tableEdit.hidden = true;

		// 編集された単語を取得
		const wordEdits = document.querySelectorAll(".word-edit");
		const dictType = regulationSelect.value;
		const dictionary = this.dictionaryManager.dictionaries[dictType];

		// フィールドをクリア
		tableEdit.innerText = result.innerText = "";
		txtEdit.value = "";

		// 更新された単語を配列に格納
		const updatedWords = Array.from(wordEdits).map(input => input.value.trim());

		// テーブルの再構築
		let editTableHTML = "<table><thead><tr><th>単語</th><th>意味</th><th>カテゴリ</th></tr></thead><tbody>";
		let displayTableHTML = "<table><thead><tr><th>単語</th><th>意味</th><th>カテゴリ</th></tr></thead><tbody>";

		updatedWords.forEach((word, i) => {
			if (word) {
				const categoryText = dictType === "custom" ? "なし" : (dictionary.tags[i] || "なし");

				// 編集用テーブル行
				editTableHTML += `<tr>
					<td><input class='word-edit' type='text' value='${this.escapeHtml(word)}'></td>
					<td>${this.escapeHtml(dictionary.words[i] || "")}</td>
					<td>${this.escapeHtml(categoryText)}</td>
				</tr>`;

				// 表示用テーブル行
				displayTableHTML += `<tr>
					<td>${this.escapeHtml(word)}</td>
					<td>${this.escapeHtml(dictionary.words[i] || "")}</td>
					<td>${this.escapeHtml(categoryText)}</td>
				</tr>`;

				txtEdit.value += word + "\n";
			}
		});

		// テーブルのフッター部分
		editTableHTML += "</tbody></table>";
		displayTableHTML += "</tbody></table>";

		// HTMLを挿入
		result.innerHTML = displayTableHTML;
		tableEdit.innerHTML = editTableHTML;

		// 生成リストをクリア
		this.wordGenerator.clearResults();
	}

// テキスト編集を適用
	applyTextEdit() {
		const txtEdit = this.domManager.get('txtEdit');
		const result = this.domManager.get('result');

		txtEdit.hidden = true;
		result.innerText = txtEdit.value;

		if (txtEdit.value) {
			// 編集されたテキストを行ごとに分割し、空行を除外
			this.wordGenerator.generatedWordList = txtEdit.value.split("\n").filter(line => line.trim());
		} else {
			this.wordGenerator.clearResults();
		}
	}

	// 入力バリデーション
	validateInput() {
		const numberOfWordsInput = this.domManager.get('numberOfWordsInput');
		const regulationSelect = this.domManager.get('regulationSelect');
		const minimum = this.domManager.get('minimum');
		const maximum = this.domManager.get('maximum');
		const method = this.domManager.get('method');
		const dodgeRange = this.domManager.get('dodgeRange');
		const consonant = this.domManager.get('consonant');
		const vowel = this.domManager.get('vowel');
		const result = this.domManager.get('result');
		const regulationSelection = this.domManager.get('regulationSelection');

		// 編集モード中は検証しない
		if (result.hidden) return false;

		if (regulationSelection.value == "default") {
			// 生成単語数のバリデーション
			if (regulationSelect.value === "no") {
				const numWords = parseInt(numberOfWordsInput.value, 10);
				if (isNaN(numWords) || numWords <= 0) {
					alert("生成する単語数が不正です。正の整数を入力してください。");
					return false;
				}
			}
	
			// 文字数範囲のバリデーション
			const min = parseInt(minimum.value, 10);
			const max = parseInt(maximum.value, 10);
			if (isNaN(min) || isNaN(max) || min < 1 || min > max || max > 10) {
				alert("文字数の範囲が不正です。1 ≤ 最小値 ≤ 最大値 ≤ 10 の範囲で指定してください。");
				return false;
			}
	
			// ミニマルペア回避範囲のバリデーション
			if (method.value === "avoidMinimalPair") {
				const range = parseInt(dodgeRange.value, 10);
				if (isNaN(range) || range < 1 || range > 100) {
					alert("ミニマルペアの回避範囲が不正です。1〜100の範囲で指定してください。");
					return false;
				}
			}
	
			// 子音・母音入力のバリデーション
			if (!consonant.value.trim() || !vowel.value.trim()) {
				alert("子音と母音は少なくとも1つずつ指定してください。");
				return false;
			}
	
			return true;
		} else {
			const rule = this.regulationManager.getRegulation('default');
		
			// 最小・最大文字数チェック
			const min = parseInt(rule.minimum, 10);
			const max = parseInt(rule.maximum, 10);
			if (isNaN(min) || isNaN(max) || min < 1 || min > max || max > 10) {
				alert("選択されたカテゴリの文字数範囲が不正です。1 ≤ 最小値 ≤ 最大値 ≤ 10 の範囲で指定してください。");
				return false;
			}
		
			// ミニマルペア回避が必要な場合
			if (this.domManager.get('method').value === "avoidMinimalPair") {
				const dodgeRange = parseInt(this.domManager.get('dodgeRange').value, 10);
				if (isNaN(dodgeRange) || dodgeRange < 1 || dodgeRange > 100) {
					alert("ミニマルペアの回避範囲が不正です。1〜100の範囲で指定してください。");
					return false;
				}
			}
		
			// 子音・母音チェック（空文字でないか）
			if (!rule.consonant.trim() || !rule.vowel.trim()) {
				alert("選択されたカテゴリの子音と母音は少なくとも1つずつ指定されている必要があります。");
				return false;
			}
		
			return true;
		}
	}
}

// アプリ全体を制御するクラス
class App {
	constructor() {
		this.domManager = new DOMManager();
		this.dictionaryManager = new DictionaryManager();
		this.regulationManager = new RegulationManager();
		this.wordGenerator = null;
		this.uiManager = null;
	}
	
	// アプリを初期化
	async initialize() {
	    // DOM要素を初期化
	    this.domManager.initialize();
	    
	    // RegulationManagerに必要な参照を渡す
	    this.regulationManager = new RegulationManager(this.domManager, this.dictionaryManager);
	    
	    // ワードジェネレーターとUIマネージャーを初期化
	    this.wordGenerator = new WordGenerator(this.domManager, this.dictionaryManager, this.regulationManager);
	    this.uiManager = new UIManager(this.domManager, this.wordGenerator, this.dictionaryManager, this.regulationManager);
	    
	    // 辞書を読み込む
	    try {
	        await this.dictionaryManager.loadDictionaries();
	        // UI状態を更新
	        this.uiManager.updateUIState();
	        // イベントリスナーを設定
	        this.setupEventListeners();
	    } catch (error) {
	        console.error("アプリの初期化中にエラーが発生しました:", error);
	        alert("アプリの初期化に失敗しました。ページを再読み込みしてください。");
	    }
	}
	
	// イベントリスナーを設定（イベント委任パターンを使用）
	setupEventListeners() {
		// 変更イベントの一元管理
		document.addEventListener('change', this.handleChangeEvents.bind(this));
		
		// クリックイベントの一元管理
		document.addEventListener('click', this.handleClickEvents.bind(this));
		
		// ダブルクリックイベントの管理
		document.addEventListener('dblclick', this.handleDblClickEvents.bind(this));

		// キーダウンイベントの管理
		document.addEventListener('keydown', this.handleKeyDownEvents.bind(this));
	}
	
	// 変更イベントハンドラー
	handleChangeEvents(e) {
		// 辞書選択の変更イベント
		if (e.target === this.domManager.get('regulationSelect')) {
			const vocab = this.domManager.get('regulationSelect');
			const regulationSelection = this.domManager.get('regulationSelection');
		
			// 今のカテゴリ規則を保存
			const previousCategory = regulationSelection.value || "default";
			this.regulationManager.saveRegulation(previousCategory, this.domManager);
		
			// UIリセット
			regulationSelection.innerHTML = "<option value='default'>デフォルト</option>";
		
			// 辞書が swadesh や sakamoto のような場合
			if (vocab.value !== "no") {
				const categories = this.dictionaryManager.dictionaries[vocab.value].categories;
				if (categories && categories.length) {
					categories.forEach(category => {
						const option = document.createElement('option');
						option.textContent = category;
						option.value = category;
						regulationSelection.appendChild(option);
					});
				}
		
				// default の規則を読み込み
				const defaultRule = this.regulationManager.getRegulation("default");
				Object.keys(defaultRule).forEach(key => {
					if (this.domManager.get(key)) {
						this.domManager.get(key).value = defaultRule[key];
					}
				});
		
				regulationSelection.value = "default";
				regulationSelection.dataset.previousSelection = "default";
			}
			// vocab = no の場合 → デフォルトだけに戻す
			else {
				const rule = this.regulationManager.getRegulation("default");
				Object.keys(rule).forEach(key => {
					if (this.domManager.get(key)) {
						this.domManager.get(key).value = rule[key];
					}
				});
				regulationSelection.value = "default";
				regulationSelection.dataset.previousSelection = "default";
			}
		
			this.uiManager.updateUIState();
		}
		
	    // 変更対象が regulationSelection の場合
	    if (e.target === this.domManager.get('regulationSelection')) {
	        // 1. まず今のカテゴリの規則を保存する
	        const previousSelection = e.target.dataset.previousSelection || "default";
	        this.regulationManager.saveRegulation(previousSelection, this.domManager); // ←これを追加！

	        // 2. 新しいカテゴリの規則を取得して反映する
	        const regulationSelection = e.target.value;
	        const rule = this.regulationManager.getRegulation(regulationSelection);
	
	        Object.keys(rule).forEach(key => {
	            if (this.domManager.get(key)) {
	                this.domManager.get(key).value = rule[key];
	            }
	        });
	
	        // 3. 現在の選択肢を記憶しておく
	        e.target.dataset.previousSelection = regulationSelection;
	    }
		
		// 生成方法の変更イベント
		if (e.target === this.domManager.get('method')) {
			this.uiManager.updateUIState();
		}
	}
	
	// クリックイベントハンドラー
	handleClickEvents(e) {
		const regulationSelection = this.domManager.get('regulationSelection').value;
		this.regulationManager.saveRegulation(regulationSelection, this.domManager);

		if (e.target === this.domManager.get('detailedSetting')) {
			const detailedSetting = this.domManager.get('detailedSettingAccordion');
			const detailedToggleIcon = this.domManager.get('detailedToggleIcon');
			const toggle = this.domManager.get('detailedSetting');
			toggle.classList.toggle("close", !detailedSetting.hidden);
			detailedSetting.hidden = !detailedSetting.hidden;
			detailedToggleIcon.innerText = detailedToggleIcon.innerText === "＋" ? "ー" : "＋";
		}
		// 生成ボタンのクリックイベント
		else if (e.target === this.domManager.get('generatingBtn')) {
			this.generateWords();
		}
		
		// 編集ボタンのクリックイベント
		else if (e.target === this.domManager.get('btnEdit')) {
			this.uiManager.switchToEditMode();
		}
		
		// 編集適用ボタンのクリックイベント
		else if (e.target === this.domManager.get('btnApplyEdit')) {
			this.uiManager.applyEdit();
		}
		
		// 結果削除ボタンのクリックイベント
		else if (e.target === this.domManager.get('btnDeleteResult')) {
			this.confirmAndDeleteResults();
		}
		
		// 結果コピーボタンのクリックイベント
		else if (e.target === this.domManager.get('copyBtnResult')) {
			this.copyResultsToClipboard();
		}
	}
	
	// ダブルクリックイベントハンドラー
	handleDblClickEvents(e) {
		// 結果エリアのダブルクリックで編集モードに
		if (e.target === this.domManager.get('result')) {
			this.uiManager.switchToEditMode();
		}
	}

	// キーダウンイベントハンドラー
	handleKeyDownEvents(e) {
		// saveregulation
	}
	
	// 単語生成を実行
	generateWords() {
		if (this.uiManager.validateInput()) {
			try {
				const success = this.wordGenerator.generate();
				if (success) {
					this.uiManager.displayResults();
				}
			} catch (error) {
				console.error("単語生成中にエラーが発生しました:", error);
				alert("単語生成中にエラーが発生しました。");
			}
		}
	}
	
	// 結果削除の確認と実行
	confirmAndDeleteResults() {
		if (confirm("本当に削除しますか？")) {
			this.wordGenerator.clearResults();
			this.domManager.get('txtEdit').value = "";
			this.domManager.get('result').innerText = "";
		}
	}
	
	// 結果をクリップボードにコピー
	copyResultsToClipboard() {
		const resultText = this.domManager.get('result').innerText;
		
		if (!resultText.trim()) {
			alert("コピーする結果がありません。");
			return;
		}
		
		try {
			navigator.clipboard.writeText(resultText)
				.then(() => alert("結果をクリップボードにコピーしました"))
				.catch(err => {
					console.error("クリップボードへのコピーに失敗しました", err);
					alert("コピーに失敗しました。ブラウザの権限設定を確認してください。");
				});
		} catch (error) {
			// Clipboardに非対応のブラウザのフォールバック
			this.fallbackCopyTextToClipboard(resultText);
		}
	}
	
	// クリップボードAPIに非対応の場合のフォールバック
	fallbackCopyTextToClipboard(text) {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";	// ビューからはずす
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		
		try {
			const successful = document.execCommand('copy');
			if (successful) {
				alert("結果をクリップボードにコピーしました");
			} else {
				alert("コピーに失敗しました");
			}
		} catch (err) {
			console.error("クリップボードへのコピーに失敗しました", err);
			alert("コピーに失敗しました");
		}
		
		document.body.removeChild(textArea);
	}
}

// アプリケーションのインスタンス化と初期化
document.addEventListener('DOMContentLoaded', () => {
	const app = new App();
	app.initialize();
});
