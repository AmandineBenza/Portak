var grayTileTexture = null;
var powerTexture = null;
var grayWallTexture = null;
var portalTexture = null;
var zombieTexture = null;
var textureLoadingCanvas = null;

var normalPlayerTexture = null; 
var bluePlayerTexture = null; 
var greenPlayerTexture = null; 
var pinkPlayerTexture = null; 

var normalPlayerIcon = null;
var bluePlayerIcon = null;
var greenPlayerIcon = null;
var pinkPlayerIcon = null;

var arrowUpTexture = null;
var arrowDownTexture = null;

var TextureContext = {
	init(ctx, canvas){
		let s = MapContext.getTileSize();
		grayTileTexture = new Texture(ctx, canvas, "res/textures/tiles/grayTile.png", s, s);
		powerTexture = new Texture(ctx, canvas, "res/textures/power/power.png", s, s).scale(0.5, 0.5);
		grayWallTexture = new Texture(ctx, canvas, "res/textures/walls/wall.png", s, s);
		doorTexture = new Texture(ctx, canvas, "res/textures/doors/door2.png", s, s);
		destructibleWallTexture = new Texture(ctx, canvas, "res/textures/walls/destructibleWall.png", s, s);
		keyTexture = new Texture(ctx, canvas, "res/textures/keys/key.png", s, s).scale(0.5, 0.5);
		zombieTexture = new Texture(ctx, canvas, "res/textures/enemies/zombie.png", s << 2, s);
		textureLoadingCanvas = document.createElement("canvas");

		let pw = 48;
		let ph = 52;

		normalPlayerTexture = new Texture(ctx, canvas, "res/textures/icons/normalPlayerSelection.png", pw, ph);
		bluePlayerTexture = new Texture(ctx, canvas, "res/textures/icons/bluePlayerSelection.png", pw, ph);
		greenPlayerTexture = new Texture(ctx, canvas, "res/textures/icons/greenPlayerSelection.png", pw, ph);
		pinkPlayerTexture = new Texture(ctx, canvas, "res/textures/icons/pinkPlayerSelection.png", pw, ph);

		pw = 48;
		ph = 40;

		normalPlayerIcon = new Texture(ctx, canvas, "res/textures/icons/normalPlayerIcon.png", pw, ph);
		bluePlayerIcon = new Texture(ctx, canvas, "res/textures/icons/bluePlayerIcon.png", pw, ph);
		greenPlayerIcon = new Texture(ctx, canvas, "res/textures/icons/greenPlayerIcon.png", pw, ph);
		pinkPlayerIcon = new Texture(ctx, canvas, "res/textures/icons/pinkPlayerIcon.png", pw, ph);

		arrowUpTexture = new Texture(ctx, canvas, "res/textures/others/arrowUp.png", 22, 35);
		arrowDownTexture = new Texture(ctx, canvas, "res/textures/others/arrowDown.png", 22, 35);
	},

	getArrowUpTexture(){
		return arrowUpTexture;
	},

	getArrowDownTexture(){
		return arrowDownTexture;
	},

	getNormalPlayerTexture : function(){
		return normalPlayerTexture;
	},

	getBluePlayerTexture : function(){
		return bluePlayerTexture;
	},

	getGreenPlayerTexture : function(){
		return greenPlayerTexture;
	},

	getPinkPlayerTexture : function(){
		return pinkPlayerTexture;
	},

	getNormalPlayerIcon : function(){
		return normalPlayerIcon;
	},

	getBluePlayerIcon : function(){
		return bluePlayerIcon;
	},

	getGreenPlayerIcon : function(){
		return greenPlayerIcon;
	},

	getPinkPlayerIcon : function(){
		return pinkPlayerIcon;
	},

	getGrayTileTexture : function(){
		return grayTileTexture;
	},

	getPowerTexture : function(){
		return powerTexture;
	},

	getDestructibleWallTexture : function(){
		return destructibleWallTexture;
	},

	getGrayWallTexture : function(){
		return grayWallTexture;
	},

	getDoorTexture : function(){
		return doorTexture;
	},

	getKeyTexture : function(){
		return keyTexture;
	},

	getPortalTexture : function(){
		return portalTexture;
	},

	getZombieTexture : function(){
		return zombieTexture;
	},

	getTextureLoadingCanvas(){
		return textureLoadingCanvas;
	},
};

class Texture{
	constructor(ctx, canvas, path, width, height){
		this.ctx = ctx;
		this.canvas = canvas;
		this.path = path;
		this.width = width;
		this.height = height;
		this.data = new Image();
		this.data.src = this.path;
		this.xOffset = 0;
		this.yOffset = 0;
		this.dataPixels = null;
	}

	flipRender(x, y){
		this.ctx.save();
		this.ctx.scale(-1, 1);
		this.ctx.drawImage(this.data, -x, y, this.width * (-1), this.height);
		this.ctx.restore();
	}

	split(xStart, width, yStart, height){
		var splitTex = new Texture(this.ctx, this.canvas, this.path, width, height);
		splitTex.xOffset = xStart;
		splitTex.yOffset = yStart;
		return splitTex;
	}

	render(x, y){
		this.ctx.save();
		this.ctx.drawImage(this.data, x + this.xOffset, y + this.yOffset, this.width, this.height);
		this.ctx.restore();
	}

	sizedRender(x, y, w, h){
		this.ctx.save();
		this.ctx.drawImage(this.data, x, y, w, h);
		this.ctx.restore();
	}

	clippedRender(startX, startY, startWidth, startHeight, x, y, w, h){
		this.ctx.save();
		this.ctx.drawImage(this.data, startX, startY, startWidth, startHeight, x, y, w, h);
		this.ctx.restore();
	}

	// scales the texture and center it in the tile
	scale(scaleX, scaleY){
		let wDiff = 0;
		let hDiff = 0;

		if(scaleX != 0 && scaleX != 1){
			let wSave = this.width;
			this.width *= scaleX;
			wDiff = (Math.abs(wSave - this.width)) >> 1;
		}

		if(scaleY != 0 && scaleY != 1){
			let hSave = this.height;
			this.height *= scaleY;
			hDiff = (Math.abs(hSave - this.height)) >> 1;
		}

		this.xOffset = wDiff;
		this.yOffset = hDiff;

		return this;
	}

	loadDataPixels(){
		var _canvas = TextureContext.getTextureLoadingCanvas();
		_canvas.width = this.width;
		_canvas.height = this.height;
		var _ctx = _canvas.getContext("2d");
		_ctx.drawImage(this.data, 0, 0, this.width, this.height);
		this.dataPixels = _ctx.getImageData(0, 0, this.width, this.height).data;
		return this;
	}

	getContext(){return this.ctx;}
	getCanvas(){return this.canvas;}
	getPath(){return this.path;}
	getWidth(){return this.width;}
	getHeight(){return this.height;}
	getDataPixels(){return this.dataPixels;}
}