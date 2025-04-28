// DOM 要素へのアクセスを管理するモジュール
const DOMManager = {
	elements: {},

	// DOM要素を初期化する
	initialize: function() {
		// セレクタを使って要素を取得
		const $ = id => document.getElementById(id);

		this.elements = {
			// 設定関連
			regulationSelect: $("vocab"),
			regulationShouldUse: $("regulation-should-use"),
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
	},

	// 特定の要素の取得
	get: function(elementName) {
		return this.elements[elementName];
	}
};

// 辞書データの管理モジュール
const DictionaryManager = {
	dictionaries: {
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
	},

	// 辞書データを読み込む
	loadDictionaries: function() {
	  const promises = Object.keys(this.dictionaries)
	    .filter(dictName => dictName && dictName !== "custom")
	    .map(dictName => 
	      fetch(`json/${dictName}.json`)
	        .then(response => response.json())
	        .then(wordsData => {
	          if (!(this.dictionaries[dictName].categories instanceof Set)) {
	            this.dictionaries[dictName].categories = new Set(this.dictionaries[dictName].categories);
	          }
	          wordsData.forEach(item => {
	            this.dictionaries[dictName].words.push(item.word);
	            this.dictionaries[dictName].tags.push(item.tags);
	            item.tags.forEach(tag => this.dictionaries[dictName].categories.add(tag));
	          });
	          this.dictionaries[dictName].categories = [...this.dictionaries[dictName].categories];
	          console.log(`${dictName}.json 読み込み完了`);
	        })
	    );
	
	  return Promise.all(promises)
	    .catch(error => {
		  console.error(`辞書の読み込みでエラーが発生しました: ${dictName}.json`, error);
		  alert("辞書の読み込みに失敗しました。再試行してください。");
		});
	},

	// カスタム辞書を更新
	updateCustomDictionary: function() {
		const customVocabValue = DOMManager.get('customVocabList').value;
		if (customVocabValue) {
			this.dictionaries.custom.words = customVocabValue.split("\n");
		}
	},

	// 現在選択されている辞書を取得
	getCurrentDictionary: function() {
		return DOMManager.get('regulationSelect').value;
	}
};

// 単語生成を管理するモジュール
const WordGenerator = {
	generatedWordList: [],

	// 単語を生成する各種方法
	generateMethods: {
		// ランダム生成
		random: function() {
			const len = WordGenerator.getNumberOfWordsToGenerate();

			for (let i = 0; i < len; i++) {
				const word = WordGenerator.getRandomWord();

				if (WordGenerator.isValid(word)) {
					WordGenerator.generatedWordList.push(word);
				} else {
					i--;
				}
			}
		},

		// 重複回避
		avoidDuplicate: function() {
			const len = WordGenerator.getNumberOfWordsToGenerate();

			for (let i = 0; i < len; i++) {
				const word = WordGenerator.getRandomWord();

				if (WordGenerator.isValid(word) && !WordGenerator.generatedWordList.includes(word)) {
					WordGenerator.generatedWordList.push(word);
				} else {
					i--;
				}
			}
		},

		// 昇順生成
		ascendingOrder: function() {
			const len = WordGenerator.getNumberOfWordsToGenerate();
			const minimum = DOMManager.get('minimum');
			const maximum = DOMManager.get('maximum');
			const consonant = DOMManager.get('consonant');
			const vowel = DOMManager.get('vowel');

			let currentLength = +minimum.value;
			let generatedCount = 0;

			while (generatedCount < len && currentLength <= +maximum.value) {
				const consonants = consonant.value.split(" ");
				const vowels = vowel.value.split(" ");
				const numberOfC = consonants.length;
				const numberOfV = vowels.length;

				const limitForLength = Math.pow(numberOfC + numberOfV, currentLength);

				for (let i = 0; i < limitForLength && generatedCount < len; i++) {
					let word = "";
					let cv = 0;

					let temp_i = i;
					for (let j = 0; j < currentLength; j++) {
						if (cv === 0) {
							word += consonants[temp_i % numberOfC];
							temp_i = Math.floor(temp_i / numberOfC);
						} else {
							word += vowels[temp_i % numberOfV];
							temp_i = Math.floor(temp_i / numberOfV);
						}
						cv = 1 - cv;
					}

					if (WordGenerator.isValid(word) && !WordGenerator.generatedWordList.includes(word)) {
						WordGenerator.generatedWordList.push(word);
						generatedCount++;
					}
				}
				currentLength++;
			}
		},

		// ミニマルペア回避
		avoidMinimalPair: function() {
			const len = WordGenerator.getNumberOfWordsToGenerate();

			for (let i = 0; i < len; i++) {
				const word = WordGenerator.getRandomWord();

				if (WordGenerator.isValid(word) && !WordGenerator.generatedWordList.includes(word) && WordGenerator.avoidMinimalPair(word)) {
					WordGenerator.generatedWordList.push(word);
				} else {
					i--;
				}
			}
		}
	},

	// ランダムな単語を生成
	getRandomWord: function() {
		const consonant = DOMManager.get('consonant');
		const vowel = DOMManager.get('vowel');
		const minimum = DOMManager.get('minimum');
		const maximum = DOMManager.get('maximum');
		const firstOnlyUsableV = DOMManager.get('firstOnlyUsableV');
		const lastOnlyUsableV = DOMManager.get('lastOnlyUsableV');
		const firstOnlyUsableC = DOMManager.get('firstOnlyUsableC');
		const lastOnlyUsableC = DOMManager.get('lastOnlyUsableC');

		const numberOfC = consonant.value.split(" ").length;
		const numberOfV = vowel.value.split(" ").length;
		const total = numberOfC + numberOfV;
		let cv = ~~(Math.random() * total) < numberOfC ? 0 : 1;
		const len = ~~(Math.random() * ~~(+maximum.value - +minimum.value + 1)) + +minimum.value;

		let word = "";

		for (let i = 0; i < len; i++) {
			if (cv) {
				if (!i && firstOnlyUsableV.value) {
					const fouvvs = firstOnlyUsableV.value.split(" ");
					word += fouvvs[~~(Math.random() * fouvvs.length)];
				} else if (i == len - 1 && lastOnlyUsableV.value) {
					const louvvs = lastOnlyUsableV.value.split(" ");
					word += louvvs[~~(Math.random() * louvvs.length)];
				} else {
					word += vowel.value.split(" ")[~~(Math.random() * numberOfV)];
				}

				cv = 0;
			} else {
				if (!i && firstOnlyUsableC.value) {
					const foucvs = firstOnlyUsableC.value.split(" ");
					word += foucvs[~~(Math.random() * foucvs.length)];
				} else if (i == len - 1 && lastOnlyUsableC.value) {
					const loucvs = lastOnlyUsableC.value.split(" ");
					word += loucvs[~~(Math.random() * loucvs.length)];
				} else {
					word += consonant.value.split(" ")[~~(Math.random() * numberOfC)];
				}

				cv = 1;
			}
		}

		return word;
	},

	// ミニマルペアを回避するかチェック
	avoidMinimalPair: function(word) {
		const dodgeRange = DOMManager.get('dodgeRange');
		let avoid = true;

		this.generatedWordList.slice(-dodgeRange.value).forEach(e => {
			if (this.isMinimalPairCheck(word, e)) avoid = false;
		});

		return avoid;
	},

	// 二つの単語がミニマルペアかチェック
	isMinimalPairCheck: function(word1, word2) {
		if (word1.length !== word2.length) return false;

		let diffCount = 0;

		for (let i = 0; i < word1.length; i++) {
			if (word1[i] !== word2[i]) diffCount++;
			if (diffCount > 1) return false;
		}

		return diffCount === 1;
	},

	// 単語が有効かチェック
	isValid: function(word) {
	  const getWords = id => DOMManager.get(id).value.split(" ").filter(Boolean);
	  return !(
	    getWords('notInclude').some(e => word.includes(e)) ||
	    getWords('notIncludeFirst').some(e => word.startsWith(e)) ||
	    getWords('notIncludeLast').some(e => word.endsWith(e))
	  );
	},

	// 生成する単語数を取得
	getNumberOfWordsToGenerate: function() {
		const regulationSelect = DOMManager.get('regulationSelect');
		const customVocabList = DOMManager.get('customVocabList');
		const numberOfWordsInput = DOMManager.get('numberOfWordsInput');
		const result = DOMManager.get('result');

		if (regulationSelect.value == "no" || (regulationSelect.value == "custom" && !customVocabList.value)) {
			return +numberOfWordsInput.value;
		} else {
			if (!result.innerHTML.includes("<table>")) {
				result.innerText = "";
				this.generatedWordList = [];
			}
			return DictionaryManager.dictionaries[regulationSelect.value].words.length;
		}
	},

	// 単語生成を開始
	generate: function() {
		DictionaryManager.updateCustomDictionary();
		const method = DOMManager.get('method');
		this.generateMethods[method.value]();
		UIManager.displayResults();
	},

	// 結果をクリア
	clearResults: function() {
		this.generatedWordList = [];
	}
};

// UI操作を管理するモジュール
const UIManager = {
	// UI要素の有効/無効を切り替え
	updateUIState: function() {
		const dodgeRange = DOMManager.get('dodgeRange');
		const method = DOMManager.get('method');
		const customVocabList = DOMManager.get('customVocabList');
		const regulationSelect = DOMManager.get('regulationSelect');
		const numberOfWordsInput = DOMManager.get('numberOfWordsInput');
		const regulationSelection = DOMManager.get('regulationSelection');

		dodgeRange.disabled = !(method.value == "avoidMinimalPair");
		customVocabList.disabled = !(regulationSelect.value == "custom");
		numberOfWordsInput.disabled = !(regulationSelect.value == "no");
		regulationSelection.disabled = regulationSelect.value == "no";
	},

	// 結果を表示
	displayResults: function() {
		const regulationSelect = DOMManager.get('regulationSelect');
		const customVocabList = DOMManager.get('customVocabList');
		const txtEdit = DOMManager.get('txtEdit');
		const tableEdit = DOMManager.get('tableEdit');
		const result = DOMManager.get('result');

		txtEdit.value = tableEdit.innerText = result.innerText = "";

		if (regulationSelect.value == "no" || (regulationSelect.value == "custom" && !customVocabList.value)) {
			this.displayTextResults();
		} else {
			this.displayTableResults();
		}
	},

	// テキスト形式で結果を表示
	displayTextResults: function() {
		const txtEdit = DOMManager.get('txtEdit');
		const result = DOMManager.get('result');

		WordGenerator.generatedWordList.forEach(e => {
			if (e) {
				result.innerText += e + "\n";
				txtEdit.value += e + "\n";
			}
		});
	},

	// テーブル形式で結果を表示
	displayTableResults: function() {
		const txtEdit = DOMManager.get('txtEdit');
		const tableEdit = DOMManager.get('tableEdit');
		const result = DOMManager.get('result');
		const regulationSelect = DOMManager.get('regulationSelect');

		let editTableHTML = "<table><thead><th>単語</th><th>意味</th><th>カテゴリ</th></thead><tbody>";
		let displayTableHTML = "<table><thead><th>単語</th><th>意味</th><th>カテゴリ</th></thead><tbody>";

		WordGenerator.generatedWordList.forEach((e, i) => {
			if (e) {
				const dictType = regulationSelect.value;
				const dictionary = DictionaryManager.dictionaries[dictType];

				// 編集用テーブル
				editTableHTML += "<tr><td><input class='word-edit' type='text' value='" + e + "'></td><td>" +
					dictionary.words[i] + "</td>";
				editTableHTML += dictType == "custom" ? "<td>なし</td>" : "<td>" + dictionary.tags[i] + "</td>";
				editTableHTML += "</tr>";

				// 表示用テーブル
				displayTableHTML += "<tr><td>" + e + "</td><td>" + dictionary.words[i] + "</td>";
				displayTableHTML += dictType == "custom" ? "<td>なし</td>" : "<td>" + dictionary.tags[i] + "</td>";
				displayTableHTML += "</tr>";

				txtEdit.value += e + "\n";
			}
		});

		editTableHTML += "</tbody></table>";
		displayTableHTML += "</tbody></table>";

		result.innerHTML += displayTableHTML;
		tableEdit.innerHTML += editTableHTML;
		WordGenerator.clearResults();
	},

	// 編集モードに切り替え
	switchToEditMode: function() {
		const generatingBtn = DOMManager.get('generatingBtn');
		const copyBtnResult = DOMManager.get('copyBtnResult');
		const btnDeleteResult = DOMManager.get('btnDeleteResult');
		const result = DOMManager.get('result');
		const tableEdit = DOMManager.get('tableEdit');
		const txtEdit = DOMManager.get('txtEdit');
		const btnApplyEdit = DOMManager.get('btnApplyEdit');
		const btnEdit = DOMManager.get('btnEdit');

		generatingBtn.disabled = copyBtnResult.disabled = btnDeleteResult.disabled = true;
		result.hidden = true;

		if (result.innerHTML.includes("<table>")) {
			tableEdit.hidden = false;
			tableEdit.focus();
		} else {
			txtEdit.hidden = false;
			txtEdit.focus();
		}

		btnApplyEdit.hidden = false;
		btnEdit.hidden = true;
	},

	// 編集を適用
	applyEdit: function() {
		const generatingBtn = DOMManager.get('generatingBtn');
		const copyBtnResult = DOMManager.get('copyBtnResult');
		const btnDeleteResult = DOMManager.get('btnDeleteResult');
		const result = DOMManager.get('result');
		const tableEdit = DOMManager.get('tableEdit');
		const txtEdit = DOMManager.get('txtEdit');
		const btnApplyEdit = DOMManager.get('btnApplyEdit');
		const btnEdit = DOMManager.get('btnEdit');
		const regulationSelect = DOMManager.get('regulationSelect');

		generatingBtn.disabled = copyBtnResult.disabled = btnDeleteResult.disabled = false;
		result.hidden = false;

		if (result.innerHTML.includes("<table>")) {
			this.applyTableEdit();
		} else {
			this.applyTextEdit();
		}

		btnApplyEdit.hidden = true;
		btnEdit.hidden = false;
	},

	// テーブル編集を適用
	applyTableEdit: function() {
		const tableEdit = DOMManager.get('tableEdit');
		const txtEdit = DOMManager.get('txtEdit');
		const result = DOMManager.get('result');
		const regulationSelect = DOMManager.get('regulationSelect');

		tableEdit.hidden = true;

		let wordEdit = document.querySelectorAll(".word-edit");

		tableEdit.innerText = result.innerText = "";
		txtEdit.value = "";

		let updatedWords = [];
		[...wordEdit].forEach((e, i) => {
			updatedWords[i] = e.value ? e.value : txtEdit.value.split("\n")[i];
		});

		let editTableHTML = "<table><thead><th>単語</th><th>意味</th><th>カテゴリ</th></thead><tbody>";
		let displayTableHTML = "<table><thead><th>単語</th><th>意味</th><th>カテゴリ</th></thead><tbody>";

		const dictType = regulationSelect.value;
		const dictionary = DictionaryManager.dictionaries[dictType];

		updatedWords.forEach((e, i) => {
			if (e) {
				// 編集用テーブル
				editTableHTML += "<tr><td><input class='word-edit' type='text' value='" + e + "'></td><td>" +
					dictionary.words[i] + "</td>";
				editTableHTML += dictType == "custom" ? "<td>なし</td>" : "<td>" + dictionary.tags[i] + "</td>";
				editTableHTML += "</tr>";

				// 表示用テーブル
				displayTableHTML += "<tr><td>" + e + "</td><td>" + dictionary.words[i] + "</td>";
				displayTableHTML += dictType == "custom" ? "<td>なし</td>" : "<td>" + dictionary.tags[i] + "</td>";
				displayTableHTML += "</tr>";

				txtEdit.value += e + "\n";
			}
		});

		editTableHTML += "</tbody></table>";
		displayTableHTML += "</tbody></table>";

		result.innerHTML += displayTableHTML;
		tableEdit.innerHTML += editTableHTML;

		WordGenerator.clearResults();
	},

	// テキスト編集を適用
	applyTextEdit: function() {
		const txtEdit = DOMManager.get('txtEdit');
		const result = DOMManager.get('result');

		txtEdit.hidden = true;
		result.innerText = txtEdit.value;

		if (txtEdit.value) {
			WordGenerator.generatedWordList = txtEdit.value.split("\n");
		} else {
			WordGenerator.clearResults();
		}
	},

	// 入力検証
	validateInput: function() {
		const numberOfWordsInput = DOMManager.get('numberOfWordsInput');
		const regulationSelect = DOMManager.get('regulationSelect');
		const minimum = DOMManager.get('minimum');
		const maximum = DOMManager.get('maximum');
		const method = DOMManager.get('method');
		const dodgeRange = DOMManager.get('dodgeRange');
		const consonant = DOMManager.get('consonant');
		const vowel = DOMManager.get('vowel');
		const result = DOMManager.get('result');

		if (result.hidden) return false;

		if (!numberOfWordsInput.value && regulationSelect.value === "no") {
			alert("生成する単語数が不正です");
			return false;
		}

		if (!(1 <= minimum.value && minimum.value <= maximum.value && maximum.value <= 10)) {
			alert("文字数の範囲が不正です");
			return false;
		}

		if (method.value === "avoidMinimalPair" && !(1 <= dodgeRange.value && dodgeRange.value <= 100)) {
			alert("ミニマルペアの回避範囲が不正です");
			return false;
		}

		if (!consonant.value || !vowel.value) {
			alert("子音または母音が不正です");
			return false;
		}

		return true;
	}
};

// アプリ全体を制御するモジュール
const App = {
	// アプリを初期化
	initialize: function() {
		// DOM要素を初期化
		DOMManager.initialize();

		// 辞書を読み込む
		DictionaryManager.loadDictionaries();

		// UI状態を更新
		UIManager.updateUIState();

		// イベントリスナーを設定
		this.setupEventListeners();
	},

	// イベントリスナーを設定
	setupEventListeners: function() {
		// 入力方法の変更イベント
		DOMManager.get('method').addEventListener('change', () => {
			UIManager.updateUIState();
		});

		// 辞書選択の変更イベント
		DOMManager.get('regulationSelect').addEventListener('change', () => {
			UIManager.updateUIState();
		});

		// 生成ボタンのクリックイベント
		DOMManager.get('generatingBtn').addEventListener('click', () => {
			this.generateWords();
		});

		// 編集ボタンのクリックイベント
		DOMManager.get('btnEdit').addEventListener('click', () => {
			UIManager.switchToEditMode();
		});

		// 編集適用ボタンのクリックイベント
		DOMManager.get('btnApplyEdit').addEventListener('click', () => {
			UIManager.applyEdit();
		});

		// 結果削除ボタンのクリックイベント
		DOMManager.get('btnDeleteResult').addEventListener('click', () => {
			DOMManager.get('result').innerText = "";
			WordGenerator.clearResults();
		});

		// 結果コピーボタンのクリックイベント
		DOMManager.get('copyBtnResult').addEventListener('click', () => {
			const result = DOMManager.get('result');
			navigator.clipboard.writeText(result.innerText)
				.then(() => alert("結果をクリップボードにコピーしました"))
				.catch(err => console.error("コピーに失敗しました", err));
		});
	},

	// 単語生成を実行
	generateWords: function() {
		if (UIManager.validateInput()) {
			WordGenerator.generate();
		}
	}
};

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
	App.initialize();
});
