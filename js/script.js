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
      dictionarySelection: $("dictionary-selection"),
      categorySelection: $("category-selection"),
      customVocabList: $("custom-vocab-list"),
      dodgeRange: $("dodge-range"),
			dodgeLenOfLevMin: $("dodge-len-of-lev-min"),
			dodgeLenOfLevMax: $("dodge-len-of-lev-max"),
			dodgeRangeOfCharsMin: $("dodge-range-of-chars-min"),
			dodgeRangeOfCharsMax: $("dodge-range-of-chars-max"),
      wordCountInput: $("word-count-input"),

      // 文字制限関連
      firstOnlyUsableVowels: $("first-only-usable-vowels"),
      lastOnlyUsableVowels: $("last-only-usable-vowels"),
      firstOnlyUsableConsonants: $("first-only-usable-consonants"),
      lastOnlyUsableConsonants: $("last-only-usable-consonants"),
      forbiddenCharacters: $("forbidden-characters"),
      forbiddenStartCharacters: $("forbidden-start-characters"),
      forbiddenEndCharacters: $("forbidden-end-characters"),

      // 母音子音設定
			maxConsecutiveConsonants: $("max-consecutive-consonants"),
			maxConsecutiveVowels: $("max-consecutive-vowels"),
      consonants: $("consonants"),
      vowels: $("vowels"),
      minimum: $("minimum"),
      maximum: $("maximum"),
      method: $("method"),

      // ボタン類
      btnGenerateWords: $("btn-generate-words"),
      btnCopyResult: $("btn-copy-result"),
      btnDeleteResult: $("btn-delete-result"),
      btnEnterEditMode: $("btn-enter-edit-mode"),
      btnApplyEdit: $("btn-apply-edit"),

      // 表示・編集エリア
      txtEdit: $("txt-edit"),
      tableEdit: $("table-edit"),
      result: $("result"),

			// 生成規則のjsonファイルを読み込む
			importRegulation: $("import-regulation"),
			btnExportRegulation: $("btn-export-regulation")
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
  getCurrentDictionary(dictionarySelectionValue) {
    return dictionarySelectionValue;
  }
}

// 単語生成ルールを管理するクラス
class RegulationManager {
  constructor(domManager, dictionaryManager) {
    this.wordGenerationRule = new Map();
    this.domManager = domManager; // DOMManagerの参照を保持
    this.dictionaryManager = dictionaryManager; // DictionaryManagerの参照を保持

    // 単語生成規則の初期値
    this.defaultRegulation = {
      consonants: "",
      vowels: "",
			maxConsecutiveConsonants: "",
			maxConsecutiveVowels:"",
      firstOnlyUsableConsonants: "",
      lastOnlyUsableConsonants: "",
      firstOnlyUsableVowels: "",
      lastOnlyUsableVowels: "",
      forbiddenCharacters: "",
      forbiddenStartCharacters: "",
      forbiddenEndCharacters: "",
      minimum: "",
      maximum: ""
    };
  }

  // カテゴリ
  setRegulation(categorySelection, domManager) {
    // 現在選択されているカテゴリの規則を追加
    if (!this.wordGenerationRule.has(categorySelection)) {
      // 新しい規則を作成（デフォルト値のディープコピー）
      const newRegulation = JSON.parse(JSON.stringify(this.defaultRegulation));

      // DOM要素から値を取得して設定
      Object.keys(newRegulation).forEach(key => {
        newRegulation[key] = domManager.get(key).value;
      });

      // 規則を保存
      this.wordGenerationRule.set(categorySelection, newRegulation);
    }

    return this.wordGenerationRule.get(categorySelection);
  }

  // 特定の規則を取得
  getRegulation(categorySelection) {
    return this.wordGenerationRule.get(categorySelection) || this.wordGenerationRule.get("default");
  }

  // 入力フォームの状態を保存する
  saveRegulation(categorySelection, domManager) {
    const newRegulation = JSON.parse(JSON.stringify(this.defaultRegulation));
    Object.keys(newRegulation).forEach(key => {
      if (domManager.get(key)) {
        newRegulation[key] = domManager.get(key).value;
      }
    });
    this.wordGenerationRule.set(categorySelection, newRegulation);
  }

  // 引数の単語のカテゴリの生成規則を取得する
  getWordProductionRule(wordIndex) {
    // 返す入力規則を変数で代入する（デフォルト規則をベースにする）
    const defaultRule = this.wordGenerationRule.get("default") || this.defaultRegulation;
    let resultRule = JSON.parse(JSON.stringify(defaultRule));

    // 現在選択されている辞書を取得
    const dictionarySelection = this.domManager.get("dictionarySelection").value;

    // カスタム辞書または辞書なしの場合はデフォルト規則を返す
    if (dictionarySelection === "no" || dictionarySelection === "custom") {
      // ②②でdefaultを定義
      this.saveRegulation("default", this.domManager);
      const defaultRule = this.wordGenerationRule.get("default");

      return defaultRule;
    }

    // DictionaryManager.dictionariesで今選択されている辞書のwordsとtagsを取得する
    const dictionary = this.dictionaryManager.dictionaries[dictionarySelection];

    // 辞書の中でwordIndex番目のtagsを取得
    const tags = dictionary.tags[wordIndex];

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
          if (rule[key] !== undefined && rule[key] !== null) {
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
	// JSON形式で現在の規則を保存する
	exportRegulationToJSON() {
	  // 現在の規則をすべて取得
	  const allRegulations = {};
	  
	  // WordGenerationRuleマップからオブジェクトに変換
	  for (const [category, rule] of this.wordGenerationRule.entries()) {
	    allRegulations[category] = rule;
	  }
	  
	  // JSONに変換して返す
	  return JSON.stringify(allRegulations, null, 2);
	}
	
	// JSON形式から規則を読み込む
	importRegulationFromJSON(jsonData) {
	  try {
	    // JSONデータをパース
	    const importedRegulations = JSON.parse(jsonData);
	    
	    // 既存の規則をクリア
	    this.wordGenerationRule.clear();
	    
	    // 読み込んだ規則を設定
	    for (const category in importedRegulations) {
	      if (importedRegulations.hasOwnProperty(category)) {
	        this.wordGenerationRule.set(category, importedRegulations[category]);
	      }
	    }
	    
	    return true;
	  } catch (error) {
	    console.error("規則のインポートでエラーが発生しました:", error);
	    return false;
	  }
	}
	
	// 規則をUIに反映する
	applyRegulationToUI(category, domManager) {
	  const rule = this.getRegulation(category);
	  if (!rule) return false;
	  
	  // 各設定項目に値を反映
	  Object.keys(rule).forEach(key => {
	    if (domManager.get(key)) {
	      domManager.get(key).value = rule[key];
	    }
	  });
	  
	  return true;
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
    const methodName = this.domManager.get("method").value;

    if (!this.generateMethods[methodName]) {
      console.error(`Method ${methodName} not found`);
      return false;
    }

    this.generateMethods[methodName].call(this);
    return true;
  }

  // 辞書更新
  updateDictionary() {
    const customVocabValue = this.domManager.get("customVocabList").value;
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
				alert("重複しない単語の生成が困難です。条件を見直してください。");
        console.warn("重複しない単語の生成が困難です。条件を見直してください。");
      }
    },

    // ミニマルペア回避
    avoidMinimalPair() {
      const len = this.getNumberOfWordsToGenerate();
      let attempts = 0;
      const maxAttempts = len * 100; // 無限ループ防止

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

  // ランダムな単語を生成
  getRandomWord() {
    // 現在の選択に基づいた単語の入力規則を取得
    const dictionarySelection = this.domManager.get("dictionarySelection");
    const categorySelection = this.domManager.get("categorySelection");

    // 辞書ベースの生成の場合、単語インデックスを取得
    let wordIndex = -1;
    if (dictionarySelection.value !== "no" &&
      !(dictionarySelection.value === "custom" && !this.domManager.get("customVocabList").value)) {
      // 既に生成された単語数をインデックスとして使用
      wordIndex = this.generatedWordList.length;
    }

    // 現在適用すべき規則を取得
    let rule = this.regulationManager.getWordProductionRule(wordIndex);

    // 規則から値を取得
    const consonants = (rule.consonants || "").split(" ").filter(Boolean);
    const vowels = (rule.vowels || "").split(" ").filter(Boolean);
    const firstOnlyUsableVowels = (rule.firstOnlyUsableVowels || "").split(" ").filter(Boolean);
    const lastOnlyUsableVowels = (rule.lastOnlyUsableVowels || "").split(" ").filter(Boolean);
    const firstOnlyUsableConsonants = (rule.firstOnlyUsableConsonants || "").split(" ").filter(Boolean);
    const lastOnlyUsableConsonants = (rule.lastOnlyUsableConsonants || "").split(" ").filter(Boolean);
		const maxConsecutiveConsonants = (rule.maxConsecutiveConsonants || "").split(" ").filter(Boolean);
		const maxConsecutiveVowels = (rule.maxConsecutiveVowels || "").split(" ").filter(Boolean);

    // 規則に値がない場合、DOM要素の値をフォールバックとして使用
    if (consonants.length === 0) {
      consonants.push(...this.domManager.get("consonants").value.split(" ").filter(Boolean));
    }

    if (vowels.length === 0) {
      vowels.push(...this.domManager.get("vowels").value.split(" ").filter(Boolean));
    }

    const numberOfC = consonants.length;
    const numberOfV = vowels.length;
    const total = numberOfC + numberOfV;

    // 子音または母音がない場合の処理
    if (numberOfC === 0 || numberOfV === 0) {
      console.warn("子音または母音が指定されていません");
			alert("子音または母音が指定されていません");
      return "";
    }

    // 最初の文字タイプをランダムに決定（0: 子音、1: 母音）
    let cv = Math.floor(Math.random() * total) < numberOfC ? 0 : 1;

    // 最小値と最大値の間でランダムな長さを決定
    const min = parseInt(rule.minimum || this.domManager.get("minimum").value, 10);
    const max = parseInt(rule.maximum || this.domManager.get("maximum").value, 10);
    const len = Math.floor(Math.random() * (max - min + 1)) + min;

    let word = "";

    for (let i = 0; i < len; i++) {
      if (cv === 1) { // 母音の場合
				if (i === 0 && firstOnlyUsableVowels.length > 0) {
					word += firstOnlyUsableVowels[Math.floor(Math.random() * firstOnlyUsableVowels.length)];
				} else if (i === len - 1 && lastOnlyUsableVowels.length > 0) {
					word += lastOnlyUsableVowels[Math.floor(Math.random() * lastOnlyUsableVowels.length)];
				} else {
					const stackTimes = Math.floor(Math.random() * rule.maxConsecutiveVowels) + 1;
					for (let j = 0; j < stackTimes; j++) {
	          word += vowels[Math.floor(Math.random() * numberOfV)];
					}
				}
        cv = 0;
      } else { // 子音の場合
				if (i === 0 && firstOnlyUsableConsonants.length > 0) {
					word += firstOnlyUsableConsonants[Math.floor(Math.random() * firstOnlyUsableConsonants.length)];
				} else if (i === len - 1 && lastOnlyUsableConsonants.length > 0) {
					word += lastOnlyUsableConsonants[Math.floor(Math.random() * lastOnlyUsableConsonants.length)];
				} else {
					const stackTimes = Math.floor(Math.random() * rule.maxConsecutiveConsonants) + 1;
					for (let j = 0; j < stackTimes; j++) {
	          word += consonants[Math.floor(Math.random() * numberOfC)];
					}
				}
        cv = 1;
      }
    }

    return word;
  }

  // ミニマルペアを回避するかチェック
  avoidMinimalPair(word) {
    const dodgeRange = parseInt(this.domManager.get("dodgeRange").value, 10);
    const recentWords = this.generatedWordList.slice(-dodgeRange);

    // 任意の単語とミニマルペアであるかチェック
    return !recentWords.some(existingWord => this.isMinimalPair(word, existingWord));
  }

  // レーベンシュタイン距離を計算する関数
  calculateLevenshteinDistance(a, b) {
    // 文字列が同一の場合は0を返す
    if (a === b) return 0;
    
    // 文字列の長さを取得
    const m = a.length;
    const n = b.length;
    
    // どちらかが空文字列の場合、もう一方の長さを返す
    if (m === 0) return n;
    if (n === 0) return m;
    
    // 距離行列を初期化
    let matrix = Array(m + 1);
    for (let i = 0; i <= m; i++) {
      matrix[i] = Array(n + 1);
      matrix[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      matrix[0][j] = j;
    }
    
    // 距離を計算
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,     // 削除
          matrix[i][j-1] + 1,     // 挿入
          matrix[i-1][j-1] + cost // 置換
        );
      }
    }
    
    // 最終的な距離を返す
    return matrix[m][n];
  }
  
	// WordGenerator クラスの isMinimalPair メソッドを修正
	isMinimalPair(word1, word2) {
	  // ミニマルペアの設定を取得
	  const minLev = parseInt(this.domManager.get("dodgeLenOfLevMin").value, 10) || 1;
	  const maxLev = parseInt(this.domManager.get("dodgeLenOfLevMax").value, 10) || 1;
	  
	  // 文字数範囲の設定を取得
	  const minChars = parseInt(this.domManager.get("dodgeRangeOfCharsMin").value, 10) || 0;
	  const maxChars = parseInt(this.domManager.get("dodgeRangeOfCharsMax").value, 10) || 1000;
	  
	  // 単語の長さをチェック
	  const word1Length = word1.length;
	  const word2Length = word2.length;
	  
	  // いずれかの単語が指定範囲外ならミニマルペアとして検出しない
	  if (word1Length < minChars || word1Length > maxChars || 
	      word2Length < minChars || word2Length > maxChars) {
	    return false;
	  }
	  
	  // レーベンシュタイン距離を計算
	  const distance = this.calculateLevenshteinDistance(word1, word2);
	  
	  // 指定した距離の範囲内にあればミニマルペアとみなす
	  return distance >= minLev && distance <= maxLev;
	}

  // 単語が有効かチェック（バリデーション強化）
  isValid(word) {
    if (!word || typeof word !== "string") return false;

    const wordIndex = this.generatedWordList.length; // 現在生成中の単語のインデックス
    const rule = this.regulationManager.getWordProductionRule(wordIndex);

    const forbiddenCharacters = (rule.forbiddenCharacters || "").split(" ").filter(Boolean);
    const forbiddenStartCharacters = (rule.forbiddenStartCharacters || "").split(" ").filter(Boolean);
    const forbiddenEndCharacters = (rule.forbiddenEndCharacters || "").split(" ").filter(Boolean);

    // 禁止文字列チェック
    if (forbiddenCharacters.some(forbidden => word.includes(forbidden))) return false;
    if (forbiddenStartCharacters.some(forbidden => word.startsWith(forbidden))) return false;
    if (forbiddenEndCharacters.some(forbidden => word.endsWith(forbidden))) return false;

    return true;
  }

  // 生成する単語数を取得
  getNumberOfWordsToGenerate() {
    const dictionarySelection = this.domManager.get("dictionarySelection");
    const customVocabList = this.domManager.get("customVocabList");
    const wordCountInput = this.domManager.get("wordCountInput");
    const result = this.domManager.get("result");

    // 独自生成の場合
    if (dictionarySelection.value === "no" ||
      (dictionarySelection.value === "custom" && !customVocabList.value)) {
      return parseInt(wordCountInput.value, 10);
    }
    // 辞書ベースの場合
    else {
      if (!result.innerHTML.includes("<table>")) {
        result.textContent = "";
        this.clearResults();
      }
      return this.dictionaryManager.dictionaries[dictionarySelection.value].words.length;
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
    const dodgeRange = this.domManager.get("dodgeRange");
    const method = this.domManager.get("method");
    const customVocabList = this.domManager.get("customVocabList");
    const dictionarySelection = this.domManager.get("dictionarySelection");
    const wordCountInput = this.domManager.get("wordCountInput");
    const categorySelection = this.domManager.get("categorySelection");
		const dodgeRangeOfCharsMin = this.domManager.get("dodgeRangeOfCharsMin");
		const dodgeRangeOfCharsMax = this.domManager.get("dodgeRangeOfCharsMin");
		const dodgeLenOfLevMin = this.domManager.get("dodgeLenOfLevMin");
		const dodgeLenOfLevMax = this.domManager.get("dodgeLenOfLevMin");

    // 条件に基づいて要素の有効/無効を切り替え
    dodgeRange.disabled = method.value !== "avoidMinimalPair";
		dodgeRangeOfCharsMin.disabled = dodgeRangeOfCharsMax.disabled = method.value !== "avoidMinimalPair";
		dodgeLenOfLevMin.disabled = dodgeLenOfLevMax.disabled = method.value !== "avoidMinimalPair";
    customVocabList.disabled = dictionarySelection.value !== "custom";
    wordCountInput.disabled = dictionarySelection.value !== "no";
    categorySelection.disabled = dictionarySelection.value === "no";
  }

  // 結果を表示
  displayResults() {
    const dictionarySelection = this.domManager.get("dictionarySelection");
    const customVocabList = this.domManager.get("customVocabList");
    const txtEdit = this.domManager.get("txtEdit");
    const tableEdit = this.domManager.get("tableEdit");
    const result = this.domManager.get("result");

    // 編集フィールドと結果をクリア
    txtEdit.value = tableEdit.textContent = result.textContent = "";

    // 表示形式を決定
    if (dictionarySelection.value === "no" ||
      (dictionarySelection.value === "custom" && !customVocabList.value)) {
      this.displayTextResults();
    } else {
      this.displayTableResults();
    }
  }

  // テキスト形式で結果を表示
  displayTextResults() {
    const txtEdit = this.domManager.get("txtEdit");
    const result = this.domManager.get("result");
    const wordList = this.wordGenerator.generatedWordList;

    // 各単語を表示
    wordList.forEach(word => {
      if (word) {
				// 改行で出力するため、innerText
        result.innerText += word + "\n";
        txtEdit.value += word + "\n";
      }
    });
  }

  // テーブル形式で結果を表示
  displayTableResults() {
    const txtEdit = this.domManager.get("txtEdit");
    const tableEdit = this.domManager.get("tableEdit");
    const result = this.domManager.get("result");
    const dictionarySelection = this.domManager.get("dictionarySelection");
    const wordList = this.wordGenerator.generatedWordList;

    // テーブルのヘッダー部分
    let editTableHTML = "<table><thead><tr><th>単語</th><th>意味</th><th>カテゴリ</th></tr></thead><tbody>";
    let displayTableHTML = "<table><thead><tr><th>単語</th><th>意味</th><th>カテゴリ</th></tr></thead><tbody>";

    // 各単語の情報を追加
    wordList.forEach((word, i) => {
      if (word) {
        const dictType = dictionarySelection.value;
        const dictionary = this.dictionaryManager.dictionaries[dictType];
        const categoryText = dictType === "custom" ? "なし" : (dictionary.tags[i] || "なし");

        // 編集用テーブル行
        editTableHTML += `<tr>
<td><input class="word-edit" type="text" value="${this.escapeHtml(word)}"></td>
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
      .replace(/"/g, "&#039;");
  }

  // 編集モードに切り替え
  switchToEditMode() {
    const btnGenerateWords = this.domManager.get("btnGenerateWords");
    const btnCopyResult = this.domManager.get("btnCopyResult");
    const btnDeleteResult = this.domManager.get("btnDeleteResult");
    const result = this.domManager.get("result");
    const tableEdit = this.domManager.get("tableEdit");
    const txtEdit = this.domManager.get("txtEdit");
    const btnApplyEdit = this.domManager.get("btnApplyEdit");
    const btnEnterEditMode = this.domManager.get("btnEnterEditMode");

    // ボタンの状態変更
    btnGenerateWords.disabled = btnCopyResult.disabled = btnDeleteResult.disabled = true;
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
    btnEnterEditMode.hidden = true;
  }

  // 編集を適用
  applyEdit() {
    const btnGenerateWords = this.domManager.get("btnGenerateWords");
    const btnCopyResult = this.domManager.get("btnCopyResult");
    const btnDeleteResult = this.domManager.get("btnDeleteResult");
    const result = this.domManager.get("result");
    const tableEdit = this.domManager.get("tableEdit");
    const txtEdit = this.domManager.get("txtEdit");
    const btnApplyEdit = this.domManager.get("btnApplyEdit");
    const btnEnterEditMode = this.domManager.get("btnEnterEditMode");

    // ボタンの状態変更
    btnGenerateWords.disabled = btnCopyResult.disabled = btnDeleteResult.disabled = false;
    result.hidden = false;

    // 表示形式に合わせて編集適用
    if (result.innerHTML.includes("<table>")) {
      this.applyTableEdit();
    } else {
      this.applyTextEdit();
    }

    // 編集用ボタンの表示切替
    btnApplyEdit.hidden = true;
    btnEnterEditMode.hidden = false;
  }

  // テーブル編集を適用
  applyTableEdit() {
    const tableEdit = this.domManager.get("tableEdit");
    const txtEdit = this.domManager.get("txtEdit");
    const result = this.domManager.get("result");
    const dictionarySelection = this.domManager.get("dictionarySelection");

    tableEdit.hidden = true;

    // 編集された単語を取得
    const wordEdits = document.querySelectorAll(".word-edit");
    const dictType = dictionarySelection.value;
    const dictionary = this.dictionaryManager.dictionaries[dictType];

    // フィールドをクリア
    tableEdit.textContent = result.textContent = "";
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
<td><input class="word-edit" type="text" value="${this.escapeHtml(word)}"></td>
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
    const txtEdit = this.domManager.get("txtEdit");
    const result = this.domManager.get("result");

    txtEdit.hidden = true;
		// 改行が含まれているため
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
    const wordCountInput = this.domManager.get("wordCountInput");
    const dictionarySelection = this.domManager.get("dictionarySelection");
    const minimum = this.domManager.get("minimum");
    const maximum = this.domManager.get("maximum");
    const method = this.domManager.get("method");
    const dodgeRange = this.domManager.get("dodgeRange");
    const consonants = this.domManager.get("consonants");
    const vowels = this.domManager.get("vowels");
    const result = this.domManager.get("result");
    const categorySelection = this.domManager.get("categorySelection");

    // 編集モード中は検証しない
    if (result.hidden) return false;

    if (categorySelection.value === "default") {
      // 生成単語数のバリデーション
      if (dictionarySelection.value === "no") {
        const numWords = parseInt(wordCountInput.value, 10);
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
        if (isNaN(range) || range < 1) {
          alert("ミニマルペアの回避範囲が不正です。1〜100の範囲で指定してください。");
          return false;
        }
      }

      // 子音・母音入力のバリデーション
      if (!consonants.value.trim() || !vowels.value.trim()) {
        alert("子音と母音は少なくとも1つずつ指定してください。");
        return false;
      }

      return true;
    } else {
      const rule = this.regulationManager.getRegulation("default");

      // 最小・最大文字数チェック
      const min = parseInt(rule.minimum, 10);
      const max = parseInt(rule.maximum, 10);
      if (isNaN(min) || isNaN(max) || min < 1 || min > max || max > 10) {
        alert("選択されたカテゴリの文字数範囲が不正です。1 ≤ 最小値 ≤ 最大値 ≤ 10 の範囲で指定してください。");
        return false;
      }

      // ミニマルペア回避が必要な場合
      if (this.domManager.get("method").value === "avoidMinimalPair") {
        const dodgeRange = parseInt(this.domManager.get("dodgeRange").value, 10);
        if (isNaN(dodgeRange) || dodgeRange < 1 || dodgeRange > 100) {
          alert("ミニマルペアの回避範囲が不正です。1〜100の範囲で指定してください。");
          return false;
        }
      }

      // 子音・母音チェック（空文字でないか）
      if (!rule.consonants.trim() || !rule.vowels.trim()) {
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
		this.regulationManager = new RegulationManager(this.domManager, this.dictionaryManager);
    this.wordGenerator = null;
    this.uiManager = null;
  }

  // アプリを初期化
  async initialize() {
    // DOM要素を初期化
    this.domManager.initialize();

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
    document.addEventListener("change", this.handleChangeEvents.bind(this));

    // クリックイベントの一元管理
    document.addEventListener("click", this.handleClickEvents.bind(this));

    // ダブルクリックイベントの管理
    document.addEventListener("dblclick", this.handleDblClickEvents.bind(this));

    // キーダウンイベントの管理
    document.addEventListener("keydown", this.handleKeyDownEvents.bind(this));
  }

  // 変更イベントハンドラー
  handleChangeEvents(e) {
    // 辞書選択の変更イベント
    if (e.target === this.domManager.get("dictionarySelection")) {
      const vocab = this.domManager.get("dictionarySelection");
      const categorySelection = this.domManager.get("categorySelection");

      // 今のカテゴリ規則を保存
      const previousCategory = categorySelection.value || "default";
      this.regulationManager.saveRegulation(previousCategory, this.domManager);

      // UIリセット
      categorySelection.innerHTML = '<option value="default">デフォルト</option>';

      // 辞書が swadesh や sakamoto のような場合
      if (vocab.value !== "no") {
        const categories = this.dictionaryManager.dictionaries[vocab.value].categories;
        if (categories && categories.length) {
          categories.forEach(category => {
            const option = document.createElement("option");
            option.textContent = category;
            option.value = category;
            categorySelection.appendChild(option);
          });
        }

        // default の規則を読み込み
        const defaultRule = this.regulationManager.getRegulation("default");
        Object.keys(defaultRule).forEach(key => {
          if (this.domManager.get(key)) {
            this.domManager.get(key).value = defaultRule[key];
          }
        });

        categorySelection.value = "default";
        categorySelection.dataset.previousSelection = "default";
      }
      // vocab = no の場合 → デフォルトだけに戻す
      else {
        const rule = this.regulationManager.getRegulation("default");
        Object.keys(rule).forEach(key => {
          if (this.domManager.get(key)) {
            this.domManager.get(key).value = rule[key];
          }
        });
        categorySelection.value = "default";
        categorySelection.dataset.previousSelection = "default";
      }

      this.uiManager.updateUIState();
    }

    // 変更対象が categorySelection の場合
    if (e.target === this.domManager.get("categorySelection")) {
      // 1. まず今のカテゴリの規則を保存する
      const previousSelection = e.target.dataset.previousSelection || "default";
      this.regulationManager.saveRegulation(previousSelection, this.domManager); // ←②れを追加！

      // 2. 新しいカテゴリの規則を取得して反映する
      const categorySelection = e.target.value;
      const rule = this.regulationManager.getRegulation(categorySelection);

      Object.keys(rule).forEach(key => {
        if (this.domManager.get(key)) {
          this.domManager.get(key).value = rule[key];
        }
      });

      // 3. 現在の選択肢を記憶しておく
      e.target.dataset.previousSelection = categorySelection;
    }

    // 生成方法の変更イベント
    if (e.target === this.domManager.get("method")) {
      this.uiManager.updateUIState();
    }
		// ファイルインポートの変更イベント
	  if (e.target === this.domManager.get("importRegulation")) {
	    const fileInput = e.target;
	    
	    if (fileInput.files && fileInput.files[0]) {
	      this.importRegulationFromFile(fileInput.files[0]);
	      // ファイル選択をリセット（同じファイルを再選択できるように）
	      fileInput.value = "";
	    }
	  }
  }

  // クリックイベントハンドラー
  handleClickEvents(e) {
    const categorySelection = this.domManager.get("categorySelection").value;
    this.regulationManager.saveRegulation(categorySelection, this.domManager);

    if (e.target === this.domManager.get("detailedSetting")) {
      const detailedSetting = this.domManager.get("detailedSettingAccordion");
      const detailedToggleIcon = this.domManager.get("detailedToggleIcon");
      const toggle = this.domManager.get("detailedSetting");
      toggle.classList.toggle("close", !detailedSetting.hidden);
      detailedSetting.hidden = !detailedSetting.hidden;
      detailedToggleIcon.textContent = detailedToggleIcon.textContent === "＋" ? "ー" : "＋";
    }
    // 生成ボタンのクリックイベント
    else if (e.target === this.domManager.get("btnGenerateWords")) {
      this.generateWords();
    }

    // 編集ボタンのクリックイベント
    else if (e.target === this.domManager.get("btnEnterEditMode")) {
      this.uiManager.switchToEditMode();
    }

    // 編集適用ボタンのクリックイベント
    else if (e.target === this.domManager.get("btnApplyEdit")) {
      this.uiManager.applyEdit();
    }

    // 結果削除ボタンのクリックイベント
    else if (e.target === this.domManager.get("btnDeleteResult")) {
      this.confirmAndDeleteResults();
    }

    // 結果コピーボタンのクリックイベント
    else if (e.target === this.domManager.get("btnCopyResult")) {
      this.copyResultsToClipboard();
    }

		// エクスポートボタンのクリックイベント
		else if (e.target === this.domManager.get("btnExportRegulation")) {
    	this.exportRegulationToFile();
  	}
  }

  // ダブルクリックイベントハンドラー
  handleDblClickEvents(e) {
		// 前は編集ができた
  }

  // キーダウンイベントハンドラー
  handleKeyDownEvents(e) {
		// ショートカットなど
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
      this.domManager.get("txtEdit").value = "";
      this.domManager.get("result").textContent = "";
    }
  }

  // 結果をクリップボードにコピー
  copyResultsToClipboard() {
    const resultText = this.domManager.get("result").innerText;

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
    textArea.style.position = "fixed"; // ビューからはずす
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
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

	// 規則をJSONファイルとして保存
	exportRegulationToFile() {
	  const jsonData = this.regulationManager.exportRegulationToJSON();
	  
	  // Blobを作成してダウンロードリンクを生成
	  const blob = new Blob([jsonData], { type: 'application/json' });
	  const url = URL.createObjectURL(blob);
	  
	  // 一時的なリンク要素を作成してクリックをシミュレート
	  const a = document.createElement('a');
	  a.href = url;
	  a.download = 'word_generation_rules.json';
	  document.body.appendChild(a);
	  a.click();
	  
	  // クリーンアップ
	  setTimeout(() => {
	    document.body.removeChild(a);
	    URL.revokeObjectURL(url);
	  }, 0);
	}
	
	// JSONファイルから規則を読み込む
	importRegulationFromFile(file) {
	  // ファイルが選択されていない場合は処理しない
	  if (!file) return;
	  
	  const reader = new FileReader();
	  
	  reader.onload = (event) => {
	    try {
	      const jsonData = event.target.result;
	      const success = this.regulationManager.importRegulationFromJSON(jsonData);
	      
	      if (success) {
	        // カテゴリ選択肢を更新
	        this.updateCategorySelectionOptions();
	        
	        // デフォルトカテゴリを選択して設定を反映
	        const categorySelection = this.domManager.get("categorySelection");
	        categorySelection.value = "default";
	        categorySelection.dataset.previousSelection = "default";
	        
	        // UIに規則を反映
	        this.regulationManager.applyRegulationToUI("default", this.domManager);
	        
	        alert("規則を正常にインポートしました。");
	      } else {
	        alert("規則のインポートに失敗しました。JSONの形式を確認してください。");
	      }
	    } catch (error) {
	      console.error("規則のインポート中にエラーが発生しました:", error);
	      alert("規則のインポートに失敗しました。ファイル形式を確認してください。");
	    }
	  };
	  
	  reader.onerror = () => {
	    alert("ファイルの読み込みに失敗しました。");
	  };
	  
	  // ファイルをテキストとして読み込む
	  reader.readAsText(file);
	}
	
	// カテゴリ選択肢を更新するメソッド
	updateCategorySelectionOptions() {
	  const categorySelection = this.domManager.get("categorySelection");
	  
	  // 現在の選択肢をクリア
	  categorySelection.innerHTML = '<option value="default">デフォルト</option>';
	  
	  // 規則マネージャーからすべてのカテゴリを取得
	  for (const category of this.regulationManager.wordGenerationRule.keys()) {
	    // デフォルト以外のカテゴリを選択肢に追加
	    if (category !== "default") {
	      const option = document.createElement("option");
	      option.textContent = category;
	      option.value = category;
	      categorySelection.appendChild(option);
	    }
	  }
	}
}

document.getElementById("import-regulation").addEventListener("change", function (e) {
  const fileNameSpan = document.getElementById("file-name-display");
  const file = e.target.files[0];
  fileNameSpan.textContent = file ? file.name : "未選択";
});

// アプリケーションのインスタンス化と初期化
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.initialize();
});
