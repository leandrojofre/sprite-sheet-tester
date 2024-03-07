const $canvasSpriteDisplay = document.getElementById("sprite-display");
const $formConfiguration = document.getElementById("configure-sprite");

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;
$canvasSpriteDisplay.width = CANVAS_WIDTH;
$canvasSpriteDisplay.height = CANVAS_HEIGHT

let context = $canvasSpriteDisplay.getContext('2d');
let sprite;
let animationID;

function renderSprite() {
	context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	sprite.draw();
}

function showImage(event) {
	var file = event.target.files[0];
	var reader = new FileReader();
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
	var inputFile = document.getElementById("input-sprite");
	inputFile.addEventListener("change", showImage);
}

async function recibirForm(e) {
	e.preventDefault();

	if (sprite === undefined) return alert("No sprite selected");

	await sprite.stopAnimation()
	
	const elements = e.target.elements;
	
	sprite.width = Number(elements["sprite-size"].value);
	sprite.height = Number(elements["sprite-size"].value);
	sprite.sWidth = Number(elements["sprite-frame-size"].value);
	sprite.sHeight = Number(elements["sprite-frame-size"].value);
	sprite.frameSpeed = Number(elements["sprite-frame-rate"].value);
	sprite.frameStart = Number(elements["sprite-frame-start"].value) - 1;
	sprite.frameEnd = Number(elements["sprite-frame-end"].value);
	sprite.sy = (Number(elements["sprite-frame-row"].value) - 1) * sprite.sHeight;
	sprite.animate = elements["can-animate"].checked;
	
	sprite.setFrame(sprite.frameStart, sprite.sy);
	
	if (sprite.animate) sprite.setAnimation();
}

async function timeOut(timeInMiliseconds) {
	await new Promise(resolve => setTimeout(resolve, timeInMiliseconds));
}

Sprite.prototype.setFrame = function(sx, sy) {
	this.sx = sx * this.sWidth;
	this.sy = sy * this.sHeight;

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

	this.setFrame(this.frameStart, this.sy);
}

Sprite.prototype.setAnimation = async function() {
	if (!this.animate) return this.animationEnded = true;

	this.animationEnded = false;
	const FRAME_DURATION_MSEC =  1000 / this.frameSpeed;
	
	this.setFrame(this.frameStart, this.sy);
	await timeOut(FRAME_DURATION_MSEC);
	
	for (let i = 1; i < this.frameEnd; i++) {
		this.nextFrame();
		await timeOut(FRAME_DURATION_MSEC);
	}
	
	this.setAnimation();
}

$formConfiguration.addEventListener("submit", recibirForm);
window.addEventListener('load', initializeInput);