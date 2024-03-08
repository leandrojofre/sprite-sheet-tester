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

function showImage(event) {
	let file = event.target.files[0];
	
	if (!file) return;

	let reader = new FileReader();
	reader.onload = function (event) {
		sprite = new Sprite({
			src: event.target.result,
			width: 64,
			height: 64
		});
		sprite.animationEnded = true;
		sprite.img.onload = () => renderSprite();
	}
	reader.readAsDataURL(file);
}

function initializeInput() {
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
	// Maximum canvas width/height resolution in chrome: 32,767px.
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

document.querySelectorAll(".info-button").forEach(button =>
	button.addEventListener("mouseover", (e) => {
		const target = e.target;
		const brotherElementsOfTarget = Array.from(target.parentNode.parentNode.children);
		const infoBox = brotherElementsOfTarget.find(element => element.className === "info");

		infoBox.style.display = "block";
		infoBox.style.width = "200px";
		infoBox.style.height = "min-content";
		infoBox.style.overflowY = "scroll";
		infoBox.style.left = `${target.offsetLeft}px`;
		infoBox.style.top = `${target.offsetTop - infoBox.offsetHeight}px`;
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
