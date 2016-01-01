(function () {

function randomBetween(min, max) {
    if (min < 0) {
        return Math.floor(min + Math.random() * (Math.abs(min)+max));
    }else {
        return Math.floor(min + Math.random() * max);
    }
}


window.onload = function() {
	var innerWidth = window.innerWidth;
	var innerHeight = window.innerHeight;
	var gameRatio = innerWidth/innerHeight;
	var game = new Phaser.Game(Math.ceil(480*gameRatio), 480, Phaser.CANVAS, 'gameDiv');
	var ninja;
	var facing = 'right';
	var dragon;
	var ninjaGravity = 800;
	var ninjaJumpPower;
	var score=0;
	var scoreText;
  var topScore;
  var powerBar;
  var powerTween;
  var waves;
  var placedPoles;
	var poleGroup;
  var minPoleGap = 100;
  var maxPoleGap = 300;
  var ninjaJumping;
  var ninjaFallingDown;
  var jump_sound;
  var death_sound;
  var play = function(game){}
  play.prototype = {
		preload:function(){

      game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			game.scale.setScreenSize(true);

      // Load assets
      game.load.image("pole", "asset/pole/1.png");
      game.load.image("powerbar", "asset/powerbar.png");
      game.load.image("bg", "asset/bg/1.png");
      game.load.image("cloud", "asset/cloud.png");
      game.load.audio("jump_sound", "asset/sound/jump.wav");
      game.load.spritesheet("dragon", "asset/dragon.png", 135, 187, 6);
      game.load.spritesheet("jump_kango", "asset/jump_kango.png", 40, 70);
      game.load.spritesheet("waves", "asset/waves.png", 640, 70);
      //game.load.audio("death_sound", "asset/sound/game_over.wav");
		},
		create:function(){

      // Initialize variables
			ninjaJumping = false;
			ninjaFallingDown = false;
			score = 0;
			placedPoles = 0;

			// Add the background
			game.add.tileSprite(0, 0, 1000, 600, 'bg');



			// Pole group
			poleGroup = game.add.group();
			topScore = localStorage.getItem("topFlappyScore")==null?0:localStorage.getItem("topFlappyScore");
			scoreText = game.add.text(10,10,"-",{
				font:"bold 16px Arial"
			});

			// Update the score
			updateScore();


			// Add the dragon animation
			dragon = game.add.sprite(50, 30, 'dragon');

            //  Here we add a new animation called 'walk'
            //  Because we didn't give any other parameters it's going to make an animation from all available frames in the 'mummy' sprite sheet
            dragon.animations.add('run');

            //  And this starts the animation playing by using its key ("run")
            //  30 is the frame rate (30fps)
            //  true means it will loop when it finishes
            dragon.animations.play('run', 5, true);

            //dragon.body.velocity.x = 100;

			// Add and animate clouds
			clouds = game.add.group();

            for (var i = 0; i < 60; i++)
            {
                sprite = clouds.create(200 * i, randomBetween(20,70), 'cloud');
                game.physics.enable(sprite, Phaser.Physics.ARCADE);
                sprite.body.allowGravity = false;
                sprite.body.velocity.x = -30;
            }



			game.physics.startSystem(Phaser.Physics.ARCADE);
			ninja = game.add.sprite(80,200,"jump_kango");
			ninja.anchor.set(0.5);
			ninja.lastPole = 1;
			game.physics.arcade.enable(ninja);
			ninja.body.gravity.y = ninjaGravity;
			game.input.onDown.add(prepareToJump, this);
			addPole(80);

			// Add the waves
			waves = game.add.sprite(0, 410, 'waves');
			waves.animations.add('waves');
			waves.animations.play('waves', 2, true);



			// Add Kangoro's animations. We can call them with their declared names if we need
			ninja.animations.add('hold', [1], 10, true);
			ninja.animations.add('hold_fire', [2], 10, true);
            ninja.animations.add('jump', [3], 20, true);
            ninja.animations.add('right', [0], 10, true);
            ninja.animations.add('dead', [4,5], 10, true);


			//death_sound = game.add.audio('death_sound');
			jump_sound = game.add.audio('jump_sound');

		},
		update:function(){



			game.physics.arcade.collide(ninja, poleGroup, checkLanding);

			if(ninja.y>game.height){

			//death_sound.play();
			ninja.body.immovable = true;

			ninja.x = game.world.centerX;
		    ninja.body.velocity.y = -500;


            ninja.animations.play('dead');
            facing = 'dead';


            // After 1.2 seconds restart the game. Cause we are dead!
            game.time.events.add(Phaser.Timer.SECOND * 1.2, die, this);



			}

			// Go away dragon! Go!
			dragon.x += 2;

		}
	}
     // Define our Play state and play!
     game.state.add("Play",play);
     game.state.start("Play");


  // Update the current score and best score
	function updateScore(){
		scoreText.text = "Score: "+score+"\nBest: "+topScore;
	}

	function prepareToJump(){
		if(ninja.body.velocity.y==0){


		    if (facing != 'hold')
            {
                ninja.animations.play('hold');
                facing = 'hold';
            }


		    // Add powerbar and animate it with Kangoro's animations
	        powerBar = game.add.sprite(ninja.x,ninja.y-50,"powerbar");
	        powerBar.width = 0;
	        powerTween = game.add.tween(powerBar).to({
			   width:100
			}, 1000, "Linear",true).onUpdateCallback(callbackPowerbar);







	          game.input.onDown.remove(prepareToJump, this);
	          game.input.onUp.add(jump, this);
          }
	}

    function callbackPowerbar () {
                if(powerBar.width > 40){
                    ninja.animations.play('hold_fire');
                    facing = 'hold_fire';
                }
            }



     function jump(){


         if (facing != 'jump')
         {
              ninja.animations.play('jump');
              facing = 'jump';
         }


          ninjaJumpPower= -powerBar.width*3-100
          powerBar.destroy();
          game.tweens.removeAll();
          ninja.body.velocity.y = ninjaJumpPower*2;
          ninjaJumping = true;
          powerTween.stop();
          game.input.onUp.remove(jump, this);


          jump_sound.play();


     }



     function addNewPoles(){
     	var maxPoleX = 0;
		poleGroup.forEach(function(item) {
			maxPoleX = Math.max(item.x,maxPoleX)
		});
		var nextPolePosition = maxPoleX + game.rnd.between(minPoleGap,maxPoleGap);
		addPole(nextPolePosition);
	}
	function addPole(poleX){
		if(poleX<game.width*2){
			placedPoles++;
			var pole = new Pole(game,poleX,game.rnd.between(250,380));
			game.add.existing(pole);
	          pole.anchor.set(0.5,0);
			poleGroup.add(pole);
			var nextPolePosition = poleX + game.rnd.between(minPoleGap,maxPoleGap);
			addPole(nextPolePosition);
		}
	}
	function die(){

		localStorage.setItem("topFlappyScore",Math.max(score,topScore));
		game.state.restart();
	}
	function checkLanding(n,p){
		if(n.body.touching.down){
			var border = n.x-p.x
			if(Math.abs(border)>25){
				n.body.velocity.x=border*2;
				n.body.velocity.y=-200;
			}
			var poleDiff = p.poleNumber-n.lastPole;
			if(poleDiff>0){
				score+= Math.pow(2,poleDiff);
				updateScore();
				n.lastPole= p.poleNumber;
			}
			if(ninjaJumping){
               	ninjaJumping = false;
               	game.input.onDown.add(prepareToJump, this);
               	if(facing != 'right'){
		    //ninja.animations.stop();
            ninja.animations.play('right');
            facing = 'right';
		}
          	}
		}
		else{
			ninjaFallingDown = true;
			poleGroup.forEach(function(item) {
				item.body.velocity.x = 0;
			});
		}


	}
	Pole = function (game, x, y) {
		Phaser.Sprite.call(this, game, x, y, "pole");
		game.physics.enable(this, Phaser.Physics.ARCADE);
          this.body.immovable = true;
          this.poleNumber = placedPoles;
	};
	Pole.prototype = Object.create(Phaser.Sprite.prototype);
	Pole.prototype.constructor = Pole;
	Pole.prototype.update = function() {
          if(ninjaJumping && !ninjaFallingDown){
               this.body.velocity.x = ninjaJumpPower;
          }
          else{
               this.body.velocity.x = 0
          }
		if(this.x<-this.width){
			this.destroy();
			addNewPoles();
		}
	}
}

})();
