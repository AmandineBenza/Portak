class Tile{
	constructor(id, ctx, canvas, world, map, row, col, texture){
		this.id = id;
		this.ctx = ctx;
		this.canvas = canvas;
		this.map = map;
		this.row = row;
		this.world = world;
		this.col = col;
		this.x = this.col * MapContext.getTileSize();
		this.y = this.row * MapContext.getTileSize();
		this.color = null;
		this.occupier = null;
		this.power = null;
		this.enemy = null;
		this.door = null;
		this.destructibleWall = null;
		this.key = null;
		this.savedKey = null;

		if(texture != null)
			this.texture = texture;
		else
			this.texture = TextureContext.getGrayTileTexture();
	}

	reset(){
		this.color = null;
		this.occupier = null;
		this.power = null;
		this.enemy = null;
		this.door = null;
		this.key = null;
		this.savedKey = null;
		this.destructibleWall = null;
	}

	update(){
	}

	render(){
		this.ctx.save();
		this.texture.render(this.x, this.y);
		this.ctx.restore();
	}

	occupyWith(occupier){
		if(this.occupier == null){
			this.occupier = occupier;
		}
		else {
			throw "Tile was already occupied !";
		}
	}

	closeWith(door){
		if(this.door == null){
			this.door = door;
		}
		else {
			throw "Tile was already blocked !";
		}
	}

	openUpWith(key){
		if(this.key == null){
			this.key = key;
			this.savedKey = key;
		}
		else {
			throw "Tile was already blocked !";
		}
	}

	antagoniseWith(enemy){
		if(this.enemy == null){
			this.enemy = enemy;
		}
		else {
			throw "Tile was already antogonised !";
		}
	}

	powerUpWith(power){
		if(this.power == null){
			this.power = power;
		}
		else {
			throw "Tile was already powered up !";
		}
	}

	blockWith(destructibleWall){
		if(this.destructibleWall == null){
			this.destructibleWall = destructibleWall;
		}
		else {
			throw "Tile was already blocked !";
		}
	}

    unpower() {
        this.map.removePower(this.power);
        this.power = null;
	}
	
	unopen() {
        this.map.removeKey(this.key);
        this.key = null;
	}
	
	unclose() {
        this.map.removeDoor(this.door);
        this.door = null;
    }

	getOccupier(){return this.occupier;}
	isOccupied(){return this.occupier != null;}

	colorize(color){this.color = color;}
	hide(){this.color = null;}

	getContext(){return this.ctx;}
	getCanvas(){return this.canvas;}
	getMap(){return this.map;}
	getRow(){return this.row;}
	getCol(){return this.col;}
	getX(){return this.x;}
	getY(){return this.y;}
	isPoweredUp(){return this.power != null;}
	isAntagonised(){return this.enemy != null;}
	isClosed(){return this.door != null;}
	isOpenedUp(){return this.key != null;}
	isBlocked(){return this.destructibleWall != null;}
	getPower(){return this.power;}
	getId(){return this.id;}
	forgetEnemy(){this.enemy = null;}
	forgetDestructibleWall(){this.destructibleWall = null;}
}