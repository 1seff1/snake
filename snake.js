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
  "#                             #",
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
  "#*                            #",
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
  constructor(eventManager, width, height) {
    this.width        = width;
    this.height       = height;
    this.actors       = [];
    this.snake        = null;
    this.eventManager = eventManager;

    // register listeners
    this.eventManager.addListener(new Listener("eatDot", this.dotEaten.bind(this)));
    this.eventManager.addListener(new Listener("dead", this.dead.bind(this)));
  }
  addActor(actor) {
    if (!actor) {
      this.actors.push(null);
    } else {  
      this.actors.push(actor);

      if (actor instanceof Snake)
        this.snake = actor;
    }
  }
  update(elapsedTime) {
    for (let i = 0; i < this.actors.length; i++) {
      let actor = this.actors[i];
      
      if (actor) {
        if (actor === this.snake) {
          let index = (Math.round(actor.y) * this.width) + Math.round(actor.x);
          this.actors[index] = null;
        }

        actor.update(elapsedTime);
        this.checkCollision();
        
        if (actor === this.snake) {
          let index = (Math.round(actor.y) * this.width) + Math.round(actor.x);
          this.actors[index] = actor;
        }
      }
    }
  }
  dead(data) {
    alert ("YOU DIIIEEEEED!!!");
  }
  dotEaten(data) {
    let dotIndex   = (Math.round(this.snake.y) * this.width) + Math.round(this.snake.x);
    console.log("removed dot from index " + dotIndex + " -> " + data.points + " points added");
  }
  checkCollision() {
    let x = Math.round(this.snake.x);
    let y = Math.round(this.snake.y);
    let i = (y * this.width) + x;
    let a = this.actors[i];

    if (!a)
      return;
    
    if (a.type === "o") {
      this.eventManager.queueEvent(new Event("eatDot", { "points" : 10 }));
    } else if (a.type === "#") {
      this.eventManager.queueEvent(new Event("dead", {}));
    }
  }
};
//------------------------------------------------------------------------------


// Event Manager ---------------------------------------------------------------
class EventManager {
  constructor() {
    this.queue     = [];
    this.listeners = new Map();
  }
  queueEvent(event) {
    this.queue.push(event);
  }
  getEvent() {
    return this.queue.shift();
  }
  addListener(listener) {
    let list = this.listeners.get(listener.eventType);

    if (!list) {
      list = [ listener.callBack ];
    } else {
      list.push(listener.callBack);
    }

    this.listeners.set(listener.eventType, list);
  }
  update(elapsedTime) {
    while (this.queue.length) {
      let event = this.getEvent();

      let listeners = this.listeners.get(event.type);

      if (!listeners)
        return;

      listeners.forEach(function(callBack) {
        callBack(event.data);
      });
    }
  }
};
class Event {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
};
class Listener {
  constructor(eventType, callBack) {
    this.eventType = eventType;
    this.callBack  = callBack;
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
    this.canvas    = document.getElementById("board");
    this.context   = this.canvas.getContext("2d");
    
    this.buffer        = document.createElement("canvas");
    this.buffer.width  = this.canvas.width;
    this.buffer.height = this.canvas.height;
    this.bufferCtx     = this.buffer.getContext("2d");

    let wall = document.getElementById("wall");
    let dot  = document.getElementById("dot");
    let snk  = document.getElementById("snake");

    this.assets.set("#", wall);
    this.assets.set("o", dot);
    this.assets.set("*", snk);

  }
  update(elapsedTime) {
    this.cummulatedTime += elapsedTime;

    if (this.cummulatedTime > REFRESH) {
      this.draw();
      this.cummulatedTime -= REFRESH;
    }
  }
  clearDisplay() {
    this.bufferCtx.fillStyle = "#f0fff0";
    this.bufferCtx.fillRect(0, 0, this.buffer.width, this.buffer.height);
  }
  draw() {
    this.clearDisplay();

    var actors = this.level.actors;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];

      if (!actor)
        continue;

      let asset = this.assets.get(actor.type);
      let y     = (Math.floor(i / this.level.width)) * this.tileHeight;
      let x     = (i % this.level.width) * this.tileWidth;
        
      y += actor.offsetY;
      x += actor.offsetX;

      this.bufferCtx.drawImage(asset, x, y);
      this.context.drawImage(this.buffer, 0, 0);
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
    this.eventManager = new EventManager();

    // register listeners
    this.eventManager.addListener(new Listener("dead", this.gameOver.bind(this)));
  }

  loadLevel(levelDefinition) {
    const w     = levelDefinition[0].length;
    const h     = levelDefinition.length;
    let   level = new Level(this.eventManager, w, h);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const type  = levelDefinition[i][j];
        const actor = this.actorFactory.createActor(type, j, i);

        level.addActor(actor); 
      }
    }
    return level;
  }

  gameOver(data) {
    this.state = "GAME_OVER";
  }

  run() {
    switch(this.state) {
      case "INIT":
        this.state = "LOAD_LEVEL";
        break;
      case "LOAD_LEVEL":
        this.currentLevel    = this.loadLevel(this.levelDefinitions[0]);
        this.renderer.level  = this.currentLevel;
        this.state = "RUNNING";
        break;
      case "RUNNING":
        this.currentLevel.update(UPDATE);
        this.eventManager.update(UPDATE);
        this.renderer.update(UPDATE);
        break;
      case "GAME_OVER":
        this.currentLevel = null;
        this.eventManager = null;
        this.renderer.clearDisplay();
        clearInterval(handle);
    }
  }
};

let handle = -1;

function initGame() {
  let l  = new Logic();
  handle = setInterval(l.run.bind(l), UPDATE);
}
//------------------------------------------------------------------------------