const level1 = [ 
  "###############################",
  "#              #              #",
  "#          #      #  #   #    #",
  "#  # #  #           #         #",
  "#       o                     #",
  "#       *                     #",
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
  "#                             #",
  "#        ***********          #",
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
    this.animX   = 1 / 16;
    this.animY   = 1 / 16;
  }
  update(elapsedTime) {
    this.offsetX += this.animX;
    if (this.offsetX === TILE_WIDTH || this.offsetX === 0)
      this.animX *= -1;

    this.offsetY += this.animY;
    if (this.offsetY === TILE_HEIGHT || this.offsetY === 0)
      this.animY *= -1;
  }
};
class Snake extends Actor {
  constructor(type, x, y) {
    super(type, x, y);
    this.width   = 12;
    this.height  = 14;
    this.offsetX = (TILE_WIDTH  - this.width)  / 2;
    this.offsetY = (TILE_HEIGHT - this.height) / 2;
  }
  update(elapsedTime) {

  }
}
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
    this.actors.forEach(function(actor) {
      if (actor)
        actor.update(elapsedTime);
    });
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
      let x     = (actor.x * this.tileWidth)  + actor.offsetX;
      let y     = (actor.y * this.tileHeight) + actor.offsetY;

      this.context.drawImage(asset, x, y);
    }
  }
};
//------------------------------------------------------------------------------

// Game Logic ------------------------------------------------------------------
class Logic {
  constructor() { 
    this.state = "INIT";
    this.levelDefinitions = [ level1 ];
    this.actorFactory = new ActorFactory();
    this.currentLevel = null;
    this.renderer     = new Renderer(TILE_WIDTH, TILE_HEIGHT, null);
  }

  loadLevel(levelDefinition) {
    const w   = levelDefinition[0].length;
    const h   = levelDefinition.length;
    let level = new Level(w, h);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const type  = levelDefinition[i][j];
        const actor = this.actorFactory.createActor(type, j, i);
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
        this.currentLevel   = this.loadLevel(this.levelDefinitions[0]);
        this.renderer.level = this.currentLevel;
        
        this.state = "RUNNING";
        break;
      case "RUNNING":
        
        this.currentLevel.update();
        this.renderer.update();

        break;
    }
  }
};

function initGame() {
  let l = new Logic();
  setInterval(l.run.bind(l), UPDATE);
}
//------------------------------------------------------------------------------