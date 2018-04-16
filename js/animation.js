
// horizontal spritesheets only ?
class Animation{
    constructor(ctx, canvas, spritesheetTexturePath, sheetWidth, sheetHeight, yOffset, frameWidth, frameHeight,
        direction, downFrames, upFrames, rightFrames, leftFrames, downDirStartX, upDirStartX, rightDirStartX, leftDirStartX){
        this.ctx = ctx;
        this.canvas = canvas;

        this.downDirStartX = downDirStartX;
        this.upDirStartX = upDirStartX;
        this.rightDirStartX = rightDirStartX;
        this.leftDirStartX = leftDirStartX;

        this.sheet = new Texture(ctx, canvas, spritesheetTexturePath, sheetWidth, sheetHeight);

        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;

        this.downFrames = downFrames;
        this.upFrames = upFrames;
        this.rightFrames = rightFrames;
        this.leftFrames = leftFrames;
        this.frames = this.getFrames(direction);
        this.countFrames = 1;

        this.downDelay = this.getDelayFromFrames(downFrames);
        this.upDelay = this.getDelayFromFrames(upFrames);
        this.rightDelay = this.getDelayFromFrames(rightFrames);
        this.leftDelay = this.getDelayFromFrames(leftFrames);
        this.delay = this.getDelay(direction);

        this.frameCounter = null;
        this.downFrameCounter = null;
        this.upFrameCounter = null;
        this.rightFrameCounter = null;
        this.leftFrameCounter = null;

        this.startX = 0;
        this.direction = direction;
        this.savedStartX = this.startX;
        this.yOffset = yOffset;
    }

    start(){
        // this.frameCounter = new TickCounter(this.delay);
        this.direction = this.setDirection(this.direction);
        this.downFrameCounter = new TickCounter(this.downDelay);
        this.upFrameCounter = new TickCounter(this.upDelay);
        this.rightFrameCounter = new TickCounter(this.rightDelay);
        this.leftFrameCounter = new TickCounter(this.leftDelay);
        this.frameCounter = this.getCounter(this.direction);
    }

    tick(){
        if(this.frameCounter == null)
            return;
        
        this.frameCounter.tick();

        if(this.frameCounter.isStopped()){
            this.startX += this.frameWidth;
            this.countFrames++;
            
            // this.countFrames >= this.getFrames(this.direction)
            // this.startX >= this.savedStartX + (this.frames * this.frameWidth) || 
            if(this.startX >= this.savedStartX + (this.frames * this.frameWidth) || this.startX >= this.savedStartX + (this.frames * this.frameWidth)){
            //|| this.startX >= this.sheet.getWidth() - this.frameWidth){ // - this.frameWidth
                this.startX = this.savedStartX;
                this.countFrames = 1;
                println("Set startX to saved one: " + this.startX);
            }

            this.frameCounter.reset();
        }
    }

    getDelayFromFrames(frames){
        return frames << 3;
    }

    getFrames(direction){
        switch(direction){
			case PlayerContext.getDownDirValue():
				return this.downFrames;
			case PlayerContext.getUpDirValue():
				return this.upFrames;
			case PlayerContext.getRightDirValue():
				return this.rightFrames;
			case PlayerContext.getLeftDirValue():
				return this.leftFrames;
			default:
				return this.downFrames;			
		}         
    }

    getCounter(direction){
        switch(direction){
			case PlayerContext.getDownDirValue():
				return this.downFrameCounter;
			case PlayerContext.getUpDirValue():
				return this.upFrameCounter;
			case PlayerContext.getRightDirValue():
				return this.rightFrameCounter;
			case PlayerContext.getLeftDirValue():
				return this.leftFrameCounter;
			default:
				return this.downFrameCounter;			
		}       
    }

    getDelay(direction){
        switch(direction){
			case PlayerContext.getDownDirValue():
				return this.downDelay;
			case PlayerContext.getUpDirValue():
				return this.upDelay;
			case PlayerContext.getRightDirValue():
				return this.rightDelay;
			case PlayerContext.getLeftDirValue():
				return this.leftDelay;
			default:
				return this.downDelay;			
		}
    }

    getStartX(direction){
		switch(direction){
			case PlayerContext.getDownDirValue():
				return this.downDirStartX;
			case PlayerContext.getUpDirValue():
				return this.upDirStartX;
			case PlayerContext.getRightDirValue():
				return this.rightDirStartX;
			case PlayerContext.getLeftDirValue():
				return this.leftDirStartX;
			default:
				return this.downDirStartX;			
		}
    }

    // setStartX(startX){
    //     this.startX = startX;
    //     this.savedStartX = this.startX;
    // }

    // getTickCounter(direction){

    // }
    
    setDirection(direction){
        if(direction != this.direction){
            this.frames = this.getFrames(direction);
            this.delay = this.getDelay(direction);
            this.direction = direction;
            this.startX = this.getStartX(direction);
            this.savedStartX = this.startX;
            this.frameCounter = this.getCounter(direction);
            this.frameCounter.reset();
        }

        // this.frames = this.getFrames(direction);
        // this.delay = this.getDelay(direction);

        // if(direction != this.direction){
        //     this.startX = this.getStartX(direction);
        //     this.savedStartX = this.start;
        // }


        // if(direction == this.direction){
        //     this.direction = direction;
        //     this.startX = this.getStartX(direction);
        //     this.savedStartX = this.startX;
        //     this.delay = this.getDelay(direction);
        //     return;
        // }

        // this.direction = direction;
        // this.startX = this.getStartX(direction);
        // this.savedStartX = this.startX;
        // this.delay = this.getDelay(direction);
        // this.frameCounter.resetWith(this.delay);
    }

    // organise(startX, delay){
    //     this.startX = startX;
    //     this.Delay = delay;
    //     this.frameCounter.resetWith(delay);
    // }

    render(x, y){
        if(this.frameCounter == null)
            return;

        // 	clippedRender(startX, startY, startWidth, startHeight, x, y, w, h){
        this.sheet.clippedRender(this.startX, this.yOffset, this.frameWidth, this.frameHeight, x, y, this.frameWidth, this.frameHeight);
    }

    getSheet(){return this.sheet;}
}