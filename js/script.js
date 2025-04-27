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
const btnEdit = $("btn-edit");
const btnApplyEdit = $("btn-apply-edit");

const txtEdit = $("txt-edit");
const tableEdit = $("table-edit");

customVocabList.value = "人\nする\n物\n事";

disableEntry();

let generatedWords = [];

let vocabList = {
	swadesh: [],
	sakamoto: [],
	custom: []
};

Object.keys(vocabList).forEach(e => {
	if (e && e !== "custom") {
		fetch("txt/" + e + ".txt")
		.then(response => response.text())
		.then(data => {
			vocabList[e] = data.split("\n");
			console.log(e + ".txt loadingSuccess");
		})
		.catch(error => {
			console.log("readError");
		});
	}
});

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
		return vocabList[vocab.value].length;
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
	if (!result.hidden) {
		if (numberOfWords.value || vocab.value !== "no") {
			if (1 <= minimum.value && minimum.value <= maximum.value && maximum.value <= 10) {
				if ((method.value == "avoidMinimalPair" && 1 <= dodgeRange.value && dodgeRange.value <= 100) || method.value !== "avoidMinimalPair") {
					if (consonant.value && vowel.value) {
						cvlv = customVocabList.value;
				
						if (cvlv) vocabList.custom = cvlv.split("\n");
						generate[method.value]();
				
						selectDictionary();
					} else {
						alert("子音または母音が不正です");
					}
				} else {
					alert("ミニマルペアの回避範囲が不正です");
				}
			} else {
				alert("文字数の範囲が不正です");
			}
		} else {
				alert("生成する単語数が不正です");
		}
	}
}

function disableEntry() {
	dodgeRange.disabled = !(method.value == "avoidMinimalPair");
	customVocabList.disabled = !(vocab.value == "custom");
	numberOfWords.disabled = !(vocab.value == "no");
}

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
	btnEdit.hidden = true;
}

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
				editChar += "<tr><td><input class='word-edit' type='text' value='" + e + "'></td><td>" + vocabList[vocab.value][i] + "</tr>";
				generatingChar += "<tr><td>" + e + "</td><td>" + vocabList[vocab.value][i] + "</tr>";
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
	btnEdit.hidden = false;
}

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
				editChar += "<tr><td><input class='word-edit' type='text' value='" + e + "'></td><td>" + vocabList[vocab.value][i] + "</tr>";
				generatingChar += "<tr><td>" + e + "</td><td>" + vocabList[vocab.value][i] + "</tr>";
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
