addEventListener("change", () => {
	disableEntry();
});

// actions;
generatingBtn.addEventListener("click", () => {
	generateResult();
});

copyBtnResult.addEventListener("click", () => {
	navigator.clipboard.writeText(result.innerText);
	alert("結果をコピーしました");
});

btnEdit.addEventListener("click", () => {
	edit();
});

btnDeleteResult.addEventListener("click", () => {
	if (confirm("本当に削除しますか？")) generatedWords = [], txtEdit.value = result.innerText = "";
});

//edit;
result.addEventListener("dblclick", () => {
	edit();
});

btnApplyEdit.addEventListener("click", () => {
	applyEdit();
});

addEventListener("keydown", e => {
	if (e.ctrlKey && e.key == "Enter") applyEdit();
});
