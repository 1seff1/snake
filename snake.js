const level1 = [ 
  "###############################",
  "#              #              #",
  "#          #      #  #   #    #",
  "#  # #  #           #         #",
  "#       o                     #",
  "#                             #",
  "#        ############         #",
  "#                             #",
  "#              o        o     #",
  "#                             #",
  "#              #              #",
  "#          #      #  #   #    #",
  "#  # #  #           #         #",
  "#                             #",
  "#                             #",
  "#        ############         #",
  "#             *               #",
  "#                             #",
  "#                             #",
  "#              #              #",
  "#          #      #  #   #    #",
  "#  # #  #           #         #",
  "#             o               #",
  "#                   o         #",
  "#        ############         #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#       ### # # ### ###       #",
  "#                             #",
  "###############################"
];

const TILE_WIDTH  = 14;
const TILE_HEIGHT = 14;
const REFRESH     = 1000.0 / 60.0;
const UPDATE      = REFRESH / 4.0;

// Actors ----------------------------------------------------------------------
class Actor {
  constructor(type, x, y) {
    this.x       = x;
    this.y       = y;
    this.offsetX = 0;
    this.offsetY = 0;
    this.width   = -1;
    this.height  = -1;
    this.type    = type;
  }
  update(elapsedTime) {

  }
};
class Wall extends Actor {
  constructor(type, x, y) {
    super(type, x, y);
    this.width   = 14;
    this.height  = this.width;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  update(elapsedTime) {
  }
};
class Dot extends Actor {
  constructor(type, x, y) {
    super(type, x, y);
    this.width   = 8;
    this.height  = this.width;
    this.offsetX = (TILE_WIDTH  - this.width)  / 2;
    this.offsetY = (TILE_HEIGHT - this.height) / 2;
    this.angle   = 0;
  }
  update(elapsedTime) {
    let centerX = (TILE_WIDTH  / 2);
    let centerY = (TILE_HEIGHT / 2);

    this.angle += elapsedTime / 3;
    
    centerX += Math.cos(this.angle * 0.0174533);
    centerY += Math.sin(this.angle * 0.0174533);

    this.offsetX = centerX - (this.width  / 2);
    this.offsetY = centerY - (this.height / 2);
  }
};
class Snake extends Actor {
  constructor(type, x, y) {
    super(type, x, y);
    this.width     = 12;
    this.height    = 14;
    this.offsetX   = (TILE_WIDTH  - this.width)  / 2;
    this.offsetY   = (TILE_HEIGHT - this.height) / 2;
    this.direction = 0;
    this.length    = 1;
    this.init();
  }
  init() {
    addEventListener("keypress", this.controller.bind(this));
  }
  controller(event) {
    event.preventDefault();
    switch(event.keyCode) {
      case 37: // left
        this.direction = 1;
        break;
      case 38: // up
        this.direction = 0;
        break;
      case 39: // right
        this.direction = 2;
        break;
      case 40: // down
        this.direction = 3;
        break;
    }
  }
  update(elapsedTime) {
    let move = 0.05;

    switch(this.direction) {
      case 0:
        this.y -= move;
        break;
      case 1:
        this.x -= move;
        break;
      case 2:
        this.x += move;
        break;
      case 3:
        this.y += move;
        break;
    }
  }
};
class ActorFactory {
  constructor() {
    this.actorMap = new Map();

    // register actors
    this.actorMap.set("#", Wall);
    this.actorMap.set("o", Dot);
    this.actorMap.set("*", Snake);
  }

  createActor(type, x, y) {
    let actorDef = this.actorMap.get(type);

    if (!actorDef) {
      return null;
    }
    return new actorDef(type, x, y);
  }
};
//------------------------------------------------------------------------------


// Levels ----------------------------------------------------------------------
class Level {
  constructor(width, height) {
    this.width  = width;
    this.height = height;
    this.actors = [];
  }
  addActor(actor) {
    if (!actor)
      this.actors.push(null);
    this.actors.push(actor);
  }
  update(elapsedTime) {
    for (let i = 0; i < this.actors.length; i++) {
      let actor = this.actors[i];
      
      if (actor) {
        if (actor instanceof Snake) {
          this.actors[(Math.round(actor.y) * this.width) + Math.round(actor.x)] = null;
        }
        actor.update(elapsedTime);
        if (actor instanceof Snake) {
          this.actors[(Math.round(actor.y) * this.width) + Math.round(actor.x)] = actor;
        }
      }
    };
  }
};
class LevelManager {
  constructor() {
    this.levels = [];
  }
};
//------------------------------------------------------------------------------

// Renderer --------------------------------------------------------------------
class Renderer {
  constructor(tileWidth, tileHeight, level) {
    this.tileWidth      = tileWidth;
    this.tileHeight     = tileHeight;
    this.level          = level;
    this.cummulatedTime = 0;
    this.canvas         = null;
    this.context        = null;
    this.assets         = new Map();

    this.init();
  }
  init() {
    this.canvas  = document.getElementById("board");
    this.context = this.canvas.getContext("2d");

    let wall = document.getElementById("wall");
    let dot  = document.getElementById("dot");
    let snk  = document.getElementById("snake");

    this.assets.set("#",  wall);
    this.assets.set("o",   dot);
    this.assets.set("*", snk);

  }
  update() {
    this.cummulatedTime += UPDATE;

    if (this.cummulatedTime > REFRESH) {
      this.draw();
      this.cummulatedTime = 0;
    }
  }
  clearDisplay() {
    this.context.fillStyle = "#f0fff0";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  draw() {
    this.clearDisplay();

    var actors = this.level.actors;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];

      if (!actor)
        continue;

      let asset = this.assets.get(actor.type);
        
      let x = (Math.round(actor.x) * this.tileWidth)  + actor.offsetX;
      let y = (Math.round(actor.y) * this.tileHeight) + actor.offsetY;

      this.context.drawImage(asset, x, y);
    }
  }
};
//------------------------------------------------------------------------------


// Collision -------------------------------------------------------------------
class Collission {
  constructor(snake, level) {
    this.snake = snake;
    this.level = level;
  }
  update(elapsedTime) {
    let sx = Math.round(snake.x);
    let sy = Math.round(snake.y);
    let i  = (sy * this.level.width ) + sx
    let a  = this.level.actors[i];

    if (a instanceof Wall) {
      this.snake = null;
      this.level.actors[i] = null;
    } else if (a instanceof Dot) {
      this.level.actors[i] = null;
    }
    
  }
}
//------------------------------------------------------------------------------


// Game Logic ------------------------------------------------------------------
class Logic {
  constructor() { 
    this.state = "INIT";
    this.levelDefinitions = [ level1 ];
    this.actorFactory = new ActorFactory();
    this.currentLevel = null;
    this.renderer     = new Renderer(TILE_WIDTH, TILE_HEIGHT, null);
    this.collision    = new Collission(null, null);
  }

  loadLevel(levelDefinition) {
    const w   = levelDefinition[0].length;
    const h   = levelDefinition.length;
    let level = new Level(w, h);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const type  = levelDefinition[i][j];
        const actor = this.actorFactory.createActor(type, j, i);

        if (actor instanceof Snake)
          this.collision.snake = actor;

        level.addActor(actor); 
      }
    }

    return level;
  }

  run() {
    switch(this.state) {
      case "INIT":
        this.state = "LOAD_LEVEL";
        break;
      case "LOAD_LEVEL":
        this.currentLevel    = this.loadLevel(this.levelDefinitions[0]);
        this.renderer.level  = this.currentLevel;
        this.collision.level = this.currentLevel;
        this.state = "RUNNING";
        break;
      case "RUNNING":
        
        this.currentLevel.update(UPDATE);
        this.collision.update(UPDATE);
        this.renderer.update(UPDATE);

        break;
    }
  }
};

function initGame() {
  let l = new Logic();
  setInterval(l.run.bind(l), UPDATE);
}
//------------------------------------------------------------------------------