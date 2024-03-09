const $canvasSpriteDisplay = document.getElementById("sprite-display");
const $formConfiguration = document.getElementById("configure-sprite");
const $canvasTitle = document.getElementById("canvas-title");

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;
const KEY_PRESSED = {};
$canvasSpriteDisplay.width = CANVAS_WIDTH;
$canvasSpriteDisplay.height = CANVAS_HEIGHT
$canvasTitle.style.width = CANVAS_WIDTH;

let context = $canvasSpriteDisplay.getContext("2d");
let sprite;
let animationID;

function renderSprite() {
	context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	sprite.draw();
}

async function setSprite(spriteObj) {
	let imgLoaded = false;
	sprite = new Sprite(spriteObj);
	sprite.img.onload = () => imgLoaded = true;
	sprite.animationEnded = true;
	
	await new Promise((resolve) => {
		let interval = setInterval(() => {
			if (imgLoaded) resolve(renderSprite(), clearInterval(interval));
		}, 100);
	});
}

function showImage(event) {
	let file = event.target.files[0];
	
	if (!file) return;

	let reader = new FileReader();
	reader.onload = function (event) {
		setSprite({src: event.target.result, width: 64, height: 64});
	}
	
	reader.readAsDataURL(file);
}

function initializeInput() {
	setHistoryItems();

	let inputFile = document.getElementById("input-sprite");
	inputFile.addEventListener("change", showImage);
}

async function receiveForm(event) {
	event.preventDefault();

	if (sprite === undefined) return alert("No sprite selected");

	await sprite.stopAnimation();
	
	const elements = event.target.elements;
	
	sprite.width = Number(elements["sprite-size"].value);
	sprite.height = Number(elements["sprite-size"].value);
	sprite.sWidth = Number(elements["sprite-frame-size"].value);
	sprite.sHeight = Number(elements["sprite-frame-size"].value);
	sprite.frameSpeed = Number(elements["sprite-frame-rate"].value);
	sprite.frameStart = Number(elements["sprite-frame-start"].value) - 1;
	sprite.frameEnd = Number(elements["sprite-frame-end"].value);
	sprite.sy = (Number(elements["sprite-frame-row"].value) - 1) * sprite.sHeight;
	sprite.animate = elements["can-animate"].checked;
	
	addImgToHistory();
	sprite.setFrame(sprite.frameStart);
	
	if (sprite.animate) sprite.setAnimation();
}

async function timeOut(timeInMiliseconds) {
	await new Promise(resolve => setTimeout(resolve, timeInMiliseconds));
}

Sprite.prototype.setFrame = function(sx) {
	this.sx = sx * this.sWidth;

	renderSprite();
}

Sprite.prototype.nextFrame = function() {
	this.sx += this.sWidth;

	renderSprite();
}

Sprite.prototype.stopAnimation = async function() {
	this.animate = false;

	await new Promise(resolve => {
		let interval = setInterval(() => {
			if (sprite.animationEnded) resolve(clearInterval(interval))
		}, 100);
	})

	this.setFrame(this.frameStart);
}

Sprite.prototype.setAnimation = async function() {
	if (!this.animate) return this.animationEnded = true;

	this.animationEnded = false;
	const FRAME_DURATION_MSEC =  1000 / this.frameSpeed;
	
	this.setFrame(this.frameStart);
	await timeOut(FRAME_DURATION_MSEC);
	
	for (let i = this.frameStart + 1; i < this.frameEnd; i++) {
		this.nextFrame();
		await timeOut(FRAME_DURATION_MSEC);
	}
	
	this.setAnimation();
}

$formConfiguration.addEventListener("submit", receiveForm);

function setInputNumberValue(e) {
	e.preventDefault();
	const deltaY = e.deltaY;
	const input = e.target;

	let inputValueVariation = 1;
	let symbol = 1;
	
	if (KEY_PRESSED.shift) inputValueVariation = 5;
	if (KEY_PRESSED.shift && KEY_PRESSED.alt) inputValueVariation = 10;
	if (deltaY > 0) symbol = -1;
	
	const finalValue = Number(input.value) + (inputValueVariation * symbol);

		if (finalValue >= input.max) return input.value = input.max;
	else if (finalValue <= input.min) return input.value = input.min;
	else return input.value = finalValue;
}

function setMaxNumberOfRows(inputValue) {
	// Maximum canvas img resolution in chrome: 32,767px.
	const MAX_CAVAS_RESOLUTION = 32767;
	const MAX_NUM_OF_ROWS = Math.floor(MAX_CAVAS_RESOLUTION / inputValue);

	document.querySelectorAll(".max-frame-count").forEach(element =>
		element.innerHTML = `, the maximum number is ${MAX_NUM_OF_ROWS}`
	);

	document.getElementById("sprite-frame-start").max = MAX_NUM_OF_ROWS;
	document.getElementById("sprite-frame-end").max = MAX_NUM_OF_ROWS;
	document.getElementById("sprite-frame-row").max = MAX_NUM_OF_ROWS;
}

document.querySelectorAll(".input-number").forEach(input => 
	input.addEventListener("wheel", (e) => {
		if (e.target.id === "sprite-frame-size")
			return setMaxNumberOfRows(setInputNumberValue(e));
		else setInputNumberValue(e);
	})
);

document.querySelectorAll(".input-title").forEach(title => 
	title.addEventListener("wheel", (e) => e.preventDefault())
);

document.querySelectorAll(".info-button").forEach(button =>
	button.addEventListener("mouseover", (e) => {
		const target = e.target;
		const brotherElementsOfTarget = Array.from(target.parentNode.parentNode.children);
		const infoBox = brotherElementsOfTarget.find(element => element.className === "info");

		infoBox.style.display = "block";
		infoBox.style.position = "absolute";
		infoBox.style.width = "200px";
		infoBox.style.height = "min-content";
			
		const offsetTransform = target.offsetLeft - infoBox.offsetLeft;
		const infoBoxRight = infoBox.offsetLeft + infoBox.offsetWidth + offsetTransform;
		const pageWidth = document.body.offsetWidth;

		let offsetX = infoBoxRight - pageWidth;

		if (infoBoxRight <= pageWidth) offsetX = 0;

		infoBox.style.transform = `translate(
			${offsetTransform - offsetX}px,
			-${infoBox.offsetHeight}px
		)`;
	})
);

document.querySelectorAll(".info-button").forEach(button =>
	button.addEventListener("mouseout", (e) => {
		const target = e.target;
		const brotherElementsOfTarget = Array.from(target.parentNode.parentNode.children);
		const infoBox = brotherElementsOfTarget.find(element => element.className === "info");

		infoBox.style.display = "none";
	})
);

function keyDown(e) {
	KEY_PRESSED[e.key.toLocaleLowerCase()] = true;
}

function keyUp(e) {
	KEY_PRESSED[e.key.toLocaleLowerCase()] = false;
}

window.addEventListener("load", initializeInput);
window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

function showHistoryItems() {
	const $historyItems = document.getElementById("history-items");
	let spriteItems = localStorage.getItem("sprites");
	
	if (spriteItems === undefined || spriteItems === null) return $historyItems.style.display = "none";
	else spriteItems = JSON.parse(spriteItems);

	if (spriteItems.length === 0)  return $historyItems.style.display = "none";

	return $historyItems.style.display = "flex";
};

function setHistoryItems() {
	let spriteItems = localStorage.getItem("sprites");
	
	if (spriteItems === undefined || spriteItems === null) return;
	else spriteItems = JSON.parse(spriteItems);

	const $historyItemsContainer = document.getElementById("history-items");
	const HISTORY_ITEM_WIDTH = 128;

	const generateItemContainer = (index, spriteObj) => {
		const $div = document.createElement("div");
		$div.className = "history-item";
		$div.style.width = 128;
		$div.style.height = 128;
		
		const $input = document.createElement("input");
		$input.type = "button";
		$input.value = "X";
		$input.style.position = "absolute";
		$input.style.cursor = "pointer";
		$input.style.width = "min-content";
		$input.style.height = "min-content";
		$input.style.zIndex = 1;
		$input.style.alignSelf = "end";
		$input.style.backgroundColor = "#473524";
		$input.style.webkitTextFillColor = "#eadbac";
		$input.style.textAlign = "center";
		$input.style.border = "0px";
		$input.historyIndex = index;
		$input.onclick = (e) => deleteImgFromHistory(e.target.historyIndex);
		$div.appendChild($input);
		
		const $img = document.createElement("img");
		$img.src = spriteObj.src;
		$img.id = index;
		$img.style.cursor = "copy";
		$img.style.position = "absolute";
		$img.style.zIndex = 0;

		$img.onload = () => $img.style.width = `${$img.width * (HISTORY_ITEM_WIDTH / spriteObj.sWidth)}px`;
		$img.onclick = (e) => loadImgFromHistory(e.target.id);
		$div.appendChild($img);
		
		return $div;
	}
	
	$historyItemsContainer.innerHTML = "";

	for (let i = 0; i < spriteItems.length; i++) 
		$historyItemsContainer.appendChild(generateItemContainer(i, spriteItems[i]));

	showHistoryItems();
}

async function loadImgFromHistory(index) {
	const sprites = JSON.parse(localStorage.getItem("sprites"));

	setSprite(sprites[index]);
	
	document.getElementById("sprite-size").value = sprite.width;
	document.getElementById("sprite-frame-size").value = sprite.sWidth;
	document.getElementById("sprite-frame-rate").value = sprite.frameSpeed;
	document.getElementById("sprite-frame-start").value = sprite.frameStart + 1;
	document.getElementById("sprite-frame-end").value = sprite.frameEnd;
	document.getElementById("sprite-frame-row").value = (sprite.sy / sprite.sHeight) + 1;
	document.getElementById("can-animate").checked = sprite.animate;

	setMaxNumberOfRows(sprite.sWidth);
	sprite.setFrame(sprite.frameStart);

	if (sprite.animate) sprite.setAnimation();
}

function removeDuplicatesFromArray(arr, filter) {
	const filteredArr = [];
	
	for (let i = 0; i < arr.length; i++) {
		const element = arr[i];

		if (filter(element, filteredArr)) continue;
		else filteredArr.push(element);
	}
	
	arr.splice(0, arr.length);
	arr.push(...filteredArr);

	return arr;
}

function addImgToHistory() {
	if (sprite?.img === undefined) return alert("No sprite selected");

	let spriteItems = localStorage.getItem("sprites");

	if (spriteItems === undefined || spriteItems === null) spriteItems = [];
	else spriteItems = JSON.parse(spriteItems);

	spriteItems.push(sprite);

	removeDuplicatesFromArray(spriteItems, (element, filteredArray) => {
		let isDuplicate = true;
		let sameImgSrc;

		if (filteredArray.length == 0) return false;

		for (let i = 0; i < filteredArray.length; i++) {
			const elementFiltered = filteredArray[i];

			for (const key of Object.keys(element)) {
				if (element.src === elementFiltered.src) sameImgSrc = i;
				if (element[key] === elementFiltered[key]) continue;
				else {
					isDuplicate = false;
				}
			}
		}

		if (sameImgSrc !== undefined === !isDuplicate) filteredArray.splice(sameImgSrc, 1);
		
		return isDuplicate;
	});

	localStorage.setItem("sprites", JSON.stringify(spriteItems));
	setHistoryItems();
}

function deleteImgFromHistory(index) {
	const spriteItems = JSON.parse(localStorage.getItem("sprites"));

	spriteItems.splice(index, 1);
	
	localStorage.setItem("sprites", JSON.stringify(spriteItems));
	setHistoryItems();
}
