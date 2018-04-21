var PlayerContext = {
	getBasePower : function(){return 0;},
	getBaseMaxSpeed : function(){return MapContext.getTileSize() >> 1;}, // >> 1
};

class Player extends Entity{
	constructor(ctx, canvas, world, x, y, w, h, speedX, speedY){
		super(ctx, canvas, world, x, y, w, h, speedX, speedY);

		println("Player generation...");

		this.power = PlayerContext.getBasePower();
		this.maxSpeed = PlayerContext.getBaseMaxSpeed();

		// for move purposes
		this.blocked = false;
		this.tileDestReached = true;

		this.lastDx = 0;
		this.lastDy = 0;
		this.xSave = this.x;
		this.ySave = this.y;
		
		this.direction = AnimationContext.getNoneDirValue();
		this.savedDirection = AnimationContext.getDownDirValue();

		this.projectiles = [];
		this.deadProjectiles = [];
		
		this.animation = new Animation(this.ctx, this.canvas, "res/textures/player/player.png",
			644, 64, 0, 64, 64, this.savedDirection, AnimationContext.getNullValue(), 2, 2, 3, 3, 0, 128, 256, 448);
		this.animation.start();

		this.shootCounter = null;

		this.xInit = this.x;
		this.yInit = this.y;
		this.powerInit = this.power;


		println("Player: OK.");
	}

	reset(){
		this.x = this.xInit;
		this.y = this.yInit;
		this.xSave = this.xInit;
		this.ySave = this.yInit;
		this.power = this.powerInit;
		this.blocked = false;
		this.stopped = false;
		this.tileDestReached = true;
		this.lastDx = 0;
		this.lastDy = 0;
		this.shootCounter = null;
		this.direction = AnimationContext.getNoneDirValue();
		this.savedDirection = AnimationContext.getDownDirValue();
		this.projectiles = [];
		this.deadProjectiles = [];
		this.animation.reset();
		this.animation.start();
	}

	update(){
		if(!this.isDead()) {
			this.tick();
			this.handleInput();
			this.move();
			this.checkBoundCollisions();
			this.checkPortalsCollisions();
			this.updateProjectiles();
			this.updateBox();
		}
	}

	tick(){
		if(this.shootCounter != null)
			this.shootCounter.tick();
	}

	handleInput(){
		if(isPressed(EventContext.upKey())){
			this.changeDirection(AnimationContext.getUpDirValue());
		} else if(isPressed(EventContext.leftKey())){
			this.changeDirection(AnimationContext.getLeftDirValue());
		} else if(isPressed(EventContext.downKey())){
			this.changeDirection(AnimationContext.getDownDirValue());
		} else if(isPressed(EventContext.rightKey())){
			this.changeDirection(AnimationContext.getRightDirValue());
		} else if(isPressed(EventContext.spaceKey())) {
			if(this.shootCounter == null){
				this.shoot();
				this.shootCounter = new TickCounter(10);
				return;
			}

			if(this.shootCounter.isStopped()){
				this.shootCounter.reset();
				this.shoot();
			}
		}
	}

	shoot(){			
	//	println("Power :" + this.power);
		let projectile = new PlayerProjectile(this.ctx, this.canvas, this.world, this.x + this.w/2, this.y + this.h/2, this.savedDirection, this.level.getEnemies());
		this.projectiles.push(projectile);
	}

	move(){
		if(this.tileDestReached){
			let dx = 0;
			let dy = 0;
			let offset = PlayerContext.getBaseMaxSpeed() >> 2; // 2 ; 1 ; PlayerContext.getBaseMaxSpeed() >> 1 MapContext.getTileSize() >> 2
			this.xSave = this.x;
			this.ySave = this.y;

			switch(this.direction){
				case AnimationContext.getLeftDirValue(): // left
					dx = -offset;
					this.lastDx = dx;
					break;
				case AnimationContext.getUpDirValue(): // up
					dy = -offset;
					this.lastDy = dy;
					break;
				case AnimationContext.getRightDirValue(): // right
					dx = offset;
					this.lastDx = dx;
					break;
				case AnimationContext.getDownDirValue(): // down
					dy = offset;
					this.lastDy = dy;
					break;
				default:
					return;
			}

			let canMove = this.move2(dx, 0);
			canMove = canMove && this.move2(0, dy);
			this.blocked = !canMove;

			this.requireBoxSync();
			this.updateBox();
		} else {
			let canMove = this.move2(this.lastDx, 0);
			canMove = canMove && this.move2(0, this.lastDy);
			this.blocked = !canMove;

			this.requireBoxSync();
			this.updateBox();
		}

		let xPlusTs = this.xSave + MapContext.getTileSize();
		let yPlusTs = this.ySave + MapContext.getTileSize();
		let xMinusTs = this.xSave - MapContext.getTileSize();
		let yMinusTs = this.ySave - MapContext.getTileSize();

		if(this.x >= xPlusTs || this.y >= yPlusTs || this.x <= xMinusTs || this.y <= yMinusTs){
			if(this.x >= xPlusTs)
				this.x = xPlusTs;
			else if(this.x <= xMinusTs)
				this.x = xMinusTs;

			if(this.y >= yPlusTs)
				this.y = yPlusTs;
			else if(this.y <= yMinusTs)
				this.y = yMinusTs;

			this.subPower(1);
			this.resetMovement();
		} else {
			if(!this.blocked){
				this.tileDestReached = false;
			} else{
				this.resetMovement();
			}
		}
	}

	move2(dx, dy){
		if(dx != 0 && dy != 0) throw "Player movement failed.";

		let xr = MapContext.getTileSize() - 1;
		let yr = xr;
		let sv = Math.log2(xr + 1);
		
		let rowTo0 = this.y >> sv;
		let colTo0 = this.x >> sv;
		let rowTo1 = (this.y + yr) >> sv;
		let colTo1 = (this.x + xr) >> sv;

		let row0 = (this.y + dy) >> sv;
		let col0 = (this.x + dx) >> sv;
		let row1 = (this.y + dy + yr) >> sv;
		let col1 = (this.x + dx + xr) >> sv;

		for(let row = row0; row <= row1; ++row){
			for(let col = col0; col <= col1; ++col){
				if(col >= colTo0 && col <= colTo1 && row >= rowTo0 && row <= rowTo1) continue;
				if(row < 0 || row >= this.map.getNumRows() || col < 0 || col >= this.map.getNumCols()) continue;

				let tile = this.map.getTileAt(row, col);
				if(tile != null) {
					if(tile.isOccupied() || tile.isAntagonised()){
						this.resetMovement();
						return false;
					} else if(tile.isPoweredUp()){
						this.addPower(tile.getPower().getValue());
						tile.unpower();
					}
				}
			}
		}

		this.addX(dx);
		this.addY(dy);
		this.animation.tick();

		// can move
		return true;
	}

	changeDirection(dir){
		if(this.tileDestReached){
			this.stopped = false;
			this.direction = dir;
			this.animation.setDirection(dir);
			this.saveDirection();
		}
	}

	saveDirection(){
		if(this.direction != AnimationContext.getNoneDirValue()){
			this.savedDirection = this.direction;
		}
	}

	resetMovement(){
		this.tileDestReached = true;
		this.lastDx = 0;
		this.lastDy = 0;
		this.direction = AnimationContext.getNoneDirValue();
	}

	resetMovementAndBlock(){
		this.resetMovement();
		this.blocked = true;
	}

	stop(){
		if(this.tileDestReached)
			this.stopped = true;
	}

	checkBoundCollisions(){
		if(this.x < 0){
			this.x = 0;
			this.resetMovementAndBlock();
		}

		if(this.x + this.w > RenderingContext.getCanvasWidth(this.canvas)){
			this.x = RenderingContext.getCanvasWidth(this.canvas) - this.w;
			this.resetMovementAndBlock();
		}

		if(this.y < 0){
			this.y = 0;
			this.resetMovementAndBlock();
		}

		if(this.y + this.h > RenderingContext.getCanvasHeight(this.canvas)){
			this.y = RenderingContext.getCanvasHeight(this.canvas) - this.h;
			this.resetMovementAndBlock();
		}
	}

	checkPortalsCollisions(){
		let currentTile = this.map.getNormTileAt(this.x, this.y);
		let portalCollision = this.world.portalCollision(currentTile);
		if(portalCollision != null){
			println("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee\n");
			portalCollision.interact(this);
			this.resetMovementAndBlock();
		}
	}

	updateProjectiles(){
		this.projectiles.forEach((proj) => {
			proj.update();
		});
		this.checkProjectilesState();
	}

	checkProjectilesState(){
		for(let i = 0; i < this.projectiles.length; i++) {
			let proj = this.projectiles[i];
			if(proj.isDead()){
				this.deadProjectiles.push(proj);
			}
		}

		for(let i = 0; i < this.deadProjectiles.length; i++) {
			this.removeProjectile(this.deadProjectiles[i]);
		}
	}

	removeProjectile(projectile){
		removeFromArray(this.projectiles, projectile);
	}

	addToDeadProjectiles(projectile) {
		this.deadProjectiles.push(projectile);
	}

	render(){
		this.renderEntity();
		this.renderPower();
		this.renderProjectiles();
	}

	renderProjectiles(){
		this.projectiles.forEach((proj) => {
			proj.render();
		});
	}

	renderEntity(){
		this.ctx.save();
		this.ctx.fillStyle = this.color;
		this.animation.render(this.x, this.y);
		this.ctx.restore();
	}

	renderPower(){
		//renderComposedText(this.ctx, this.power, " power", RenderingContext.getCanvasWidth(this.canvas) * (40 / 100), MapContext.getTileSize() * 1.2, RenderingContext.getCanvasHeight(this.canvas) + (RenderingContext.getUIHeight() >> 1), 0, "DarkGreen");
		//let w = RenderingContext.getCanvasWidth(this.canvas) / 2;
		let w = -(MapContext.getTileSize() >> 2);
		let h = RenderingContext.getCanvasHeight(this.canvas);
		TextureContext.getPowerTexture().render(w, h);
		renderText(this.ctx, this.power, w + 50, h + 40, "Black"); // LightGreen, DarkGreen
	/*	let tm = MapContext.getTileSize();
		let startX = w * 0.10;
		let startY = h + 4; // + (tm >> 1);

		// TODO
		for(let i = 0; i < this.power; i += 10)
			TextureContext.getPowerTexture().render(startX + 8 * i, startY); */
	}

	changeLevel(level){
		if(level != null){
			println("Player changed of level !");
			this.level = level;	
			this.map = this.level.getMap();
		//	this.addPower(level.getPowerAmount());
		}
	}

	addPower(value){this.power += value;}
	subPower(value){this.power -= value;}
	getPower(){return this.power;}
	setPower(value){this.power = value;}
	getMaxSpeed(){return this.maxSpeed;}
	isDead(){return (this.power <= 0);}
}