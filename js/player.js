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
		
		this.animation = new Animation(this.ctx, this.canvas, MenuContext.getUserPlayerSelection(),
			644, 64, 0, 64, 64, this.savedDirection, AnimationContext.getNullValue(), 2, 2, 3, 3, 0, 128, 256, 448);
		this.animation.start();

		this.shootCounter = null;

		this.xInit = this.x;
		this.yInit = this.y;
		this.powerInit = this.power;
		this.deathTimer = null;

		this.musicEnableCounter = null;

		println("Player: OK.");
	}

	reset(x, y){
		this.x = x;
		this.y = y;
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
			this.updateShootCounter();
			this.handleInput();
			this.move();
			this.checkBoundCollisions();
			this.checkPortalsCollisions();
			this.updateBox();
		} else if(this.deathTimer == null){
			this.deathTimer = new TickCounter(180);
		} else{
			this.deathTimer.update();
			if(this.deathTimer.isStopped()){
				this.deathTimer = null;
				this.world.resetCurrentLevel();
			}
		}
		this.updateProjectiles();
	}

	updateShootCounter(){
		if(this.shootCounter != null)
			this.shootCounter.update();
	}

	handleInput(){
		if(isPressed(EventContext.resetKey())){
			this.world.resetCurrentLevel();
		} else if(isPressed(EventContext.upKey())){
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
		let projectile = new PlayerProjectile(this.ctx, this.canvas, this.world, this.x + this.w/2, this.y + this.h/2, this.savedDirection, this.level.getEnemies(), this.level.getDestructiblesWalls());
		this.projectiles.push(projectile);
		this.subPower(2);
		SoundContext.getHitSound().play();
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
					if(tile.isOccupied() || tile.isAntagonised() || tile.isClosed() || tile.isBlocked()){
						this.resetMovement();
						SoundContext.getWallHitSound().play();
						return false;
					} else if(tile.isPoweredUp()){
						this.addPower(tile.getPower().getValue());
						tile.unpower();
						SoundContext.getPowerupSound().play();
					}
					else if(tile.isOpenedUp()){
						tile.unopen();
						SoundContext.getDoorOpeningSound().play();
					}
				}
			}
		}

		this.addX(dx);
		this.addY(dy);
		this.animation.update();

		// can move
		return true;
	}

	accurateProjCollision(px, py, pradius){
		let p2 = pradius >> 1;
		this.updateBoxAccordingToFrame();
		return this.box.collides(px + p2, py + p2, pradius, pradius);
	}

	updateBoxAccordingToFrame(){
		let x = this.x;
		let y = this.y;
		let w = 0;
		let h = 0;
		let scale = MapContext.getTileSize() >> 4;

		switch(this.direction){
			case AnimationContext.getDownDirValue():
			switch(this.animation.frameUpdates){
					case 0:
						x += (2 * scale);
						y += y + (2 * scale);
						w = (16 - 3) * scale;
						h = (16 - 3) * scale;
						break;
					case 1:
						x += (3 * scale);
						y += (3 * scale);
						w = (16 - 3) * scale;
						h = (16 - 3) * scale;
						break;
				}
				break;
			case AnimationContext.getLeftDirValue():
				switch(this.animation.frameUpdates){
					case 0:
						x += (3 * scale);
						y += (2 * scale);
						w = (16 - 8) * scale;
						h = (16 - 3) * scale;
						break;
					case 1:
						x += (2 * scale);
						y += (2 * scale);
						w = (16 - 6) * scale;
						h = (16 - 3) * scale;
						break;
					case 2:
						x += (2 * scale);
						y += (2 * scale);
						w = (16 - 6) * scale;
						h = (16 - 3) * scale;
						break;
				}
				break;
			case AnimationContext.getRightDirValue():
				switch(this.animation.frameUpdates){
					case 0:
						x += (2 * scale);
						y += (2 * scale);
						w = (16 - 8) * scale;
						h = (16 - 3) * scale;
						break;
					case 1:
						x += (3 * scale);
						y += (2 * scale);
						w = (16 - 6) * scale;
						h = (16 - 3) * scale;
						break;
					case 2:
						x += (3 * scale);
						y += (2 * scale);
						w = (16 - 6) * scale;
						h = (16 - 3) * scale;
						break;
				}
				break;
			case AnimationContext.getUpDirValue():
				switch(this.animation.frameUpdates){
					case 0:
					case 1:
						x += (3 * scale);
						y += (3 * scale);
						w = (16 - 3) * scale;
						h = (16 - 3) * scale;
						break;
				}
				break;
			case AnimationContext.getNullValue():
				break;
		}

		if(w <= 0 || h <= 0){
			this.requireBoxSync();
			this.updateBox();
		} else {
			this.box.x = x;
			this.box.y = y;
			this.box.w = w;
			this.box.h = h;
		}
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
		let portalCollision = this.world.portalCollision(this.x, this.y);
		
		if(portalCollision != null){
			portalCollision.interact();
		}

		if(this.world.currentLevelId != 12) return;
		
		let fakePortalCollision = this.world.fakePortalCollision(this.x, this.y);

		if(fakePortalCollision != null){
			fakePortalCollision.downInteract();
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
		if(this.isDead()){
			this.renderDeathTimer();
		}
	}

	renderDeathTimer(){
		if(this.deathTimer != null){
			let secLeft = castToInt((this.deathTimer.getLimit() - this.deathTimer.getUpdates() + 60)/ 60);
			let emptyPowerText = "No   more   power  !";
			let timerTimeLeftText = secLeft + "s";

			let w = RenderingContext.getCanvasWidth(this.canvas);
			let h = RenderingContext.getCanvasHeight(this.canvas);
			let x = w * 0.5;
			let y = h * 0.4;

			let fontSize = 48;
			let color = "White";

			renderText(this.ctx, emptyPowerText, x * 0.65, y, color, fontSize);
			renderText(this.ctx, timerTimeLeftText, x - (w * 0.025), y + (h * 0.10), color, fontSize);
		}
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
		let ts = MapContext.getTileSize();
		let w = -(ts >> 2);
		let h = RenderingContext.getCanvasHeight(this.canvas) - (ts >> 1);

		TextureContext.getPowerTexture().render(w - 2, h - (ts * 0.4));

		let x = w + (ts * 0.8);
		let fontSize = 40; 

		if(this.power % 10 != this.power){
			x -= (ts * 0.1);
			fontSize = 30;
		}

		renderText(this.ctx, this.power, x - 2, h + (ts * 0.3), "White", fontSize);
	}

	teleport(level){
		this.reset();
		this.changeLevel(level);
	}

	changeLevel(level){
		if(level != null){
			println("Level " + level.getId());
			this.level = level;
			this.map = this.level.getMap();
			this.x = this.level.getPlayerInitX();
			this.y = this.level.getPlayerInitY();
			this.power = this.level.getPlayerInitPower();
			this.level.start();
		}
	}

	addPower(value){
		println("Player Power value : " + value);
		this.power += value;}

	subPower(value){
		this.power -= value;
		if(this.power < 0)
			this.power = 0;
	}

	getPower(){return this.power;}
	setPower(value){this.power = value;}
	getMaxSpeed(){return this.maxSpeed;}
	isDead(){return (this.power <= 0);}
}