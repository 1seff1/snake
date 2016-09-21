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
class Direction extends Actor {
  constructor(type, x, y, direction) {
    super(type, x, y);
    this.directionType = direction;
  }
};
class Snake extends Actor {
  constructor(type, x, y, partType) {
    super(type, x, y);
    this.width     = 12;
    this.height    = 14;
    this.offsetX   = (TILE_WIDTH  - this.width)  / 2;
    this.offsetY   = (TILE_HEIGHT - this.height) / 2;
    this.direction = "u";
    this.partType  = partType;
  }
  
  update(elapsedTime) {
    let move = 0.05;

    switch(this.direction) {
      case "u":
        this.y -= move;
        break;
      case "l":
        this.x -= move;
        break;
      case "r":
        this.x += move;
        break;
      case "d":
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
    this.actorMap.set("dir", Direction);
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
    this.snakeParts   = [];
    this.snake        = null;
    this.eventManager = eventManager;

    // register listeners
    this.eventManager.addListener(new Listener("eatDot", this.dotEaten.bind(this)));
    this.eventManager.addListener(new Listener("dead", this.dead.bind(this)));
  }
  addActor(actor) {
    if (!actor) {
      this.actors.push(null);
      this.snakeParts.push(null);
    } else {
      if (actor.type === "*") {
        this.snake   = actor;
        this.snakeParts.push(actor);
        this.actors.push(null);
      } else {
        this.snakeParts.push(null);
        this.actors.push(actor);
      }
    }
  }
  setActor(actor, index) {
    if (index < 0 || index >= this.actors.length)
      return;

    this.actors[index] = actor;
  }
  getHeadDirection() {
    return this.snake.direction;
  }
  updateHeadDirection(newDir) {
    if (this.snake) {
      this.snake.direction = newDir;
    }

  }
  update(elapsedTime) {
    for (let i = 0; i < this.actors.length; i++) {
      let actor    = this.actors[i];
      let snake    = this.snakeParts[i];
      
      if (actor) {
        actor.update(elapsedTime);
      }

      if (snake) {
        let oldIndex = (Math.round(snake.y) * this.width) + Math.round(snake.x);
        snake.update(elapsedTime);
        let newIndex = (Math.round(snake.y) * this.width) + Math.round(snake.x);

        if (oldIndex !== newIndex) {
          this.snakeParts[oldIndex] = null;
          this.snakeParts[newIndex] = snake;
          this.checkCollision(newIndex);
        }
      }

    }
  }
  dead(data) {
    console.log("DIED!");
    this.snake = null;
    this.snakeParts[data.index] = null;
  }
  dotEaten(data) {
    let dotIndex = data.index;
    this.setActor(null, dotIndex);
  }
  checkCollision(index) {
    let a = this.actors[index];

    if (!a)
      return;
    if (a.type === "o") {
      this.eventManager.queueEvent(new Event("eatDot", { "index" : index, "points" : 10 }));
    } else if (a.type === "#") {
      this.eventManager.queueEvent(new Event("dead", { "index" : index}));
    } else if (a.type === "dir") {
      this.eventManager.queueEvent(new Event("changeDir", { "newDir" : a.directionType }));
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
    let dir  = document.getElementById("dir");
    let dead = document.getElementById("dead");

    this.assets.set("#",   wall);
    this.assets.set("o",   dot);
    this.assets.set("*",   snk);
    this.assets.set("dir", dir);
    this.assets.set("dead", dead);

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

    var actors     = this.level.actors;
    var snakeParts = this.level.snakeParts;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      const snake = snakeParts[i];
      let   asset = null;
      let   y     = (Math.floor(i / this.level.width)) * this.tileHeight;
      let   x     = (i % this.level.width) * this.tileWidth;

      if (actor) {
        asset = this.assets.get(actor.type);
        
        y += actor.offsetY;
        x += actor.offsetX;

        this.bufferCtx.drawImage(asset, x, y);
      }

      if (snake) {
        asset = this.assets.get(snake.type);

        x += snake.offsetX;
        y += snake.offsetY;

        this.bufferCtx.drawImage(asset, x, y);
      }    
    }
    this.context.drawImage(this.buffer, 0, 0);
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
    this.updateHandle = null;

    this.init();
  }

  init() {
    // register listeners
    this.eventManager.addListener(new Listener("dead", this.gameOver.bind(this)));

    this.updateHandle = setInterval(this.run.bind(this), UPDATE);
  }

  controller(event) {
    event.preventDefault();
    let actor = null;
    let x     = Math.round(this.currentLevel.snake.x);
    let y     = Math.round(this.currentLevel.snake.y);
    let d     = "";
    let index = (y * this.currentLevel.width) + x;

    switch(event.keyCode) {
      case 37: // left
        d = "l";
        break;
      case 38: // up
        d = "u";
        break;
      case 39: // right
        d = "r";
        break;
      case 40: // down
        d = "d";
        break;
    }

    if (this.currentLevel.getHeadDirection() !== d) {
      this.currentLevel.updateHeadDirection(d);
      actor = this.actorFactory.createActor("dir", x, y, d);
        if (actor)
          this.currentLevel.setActor(actor, index);
    }
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
    let x = Math.floor(data.index / this.currentLevel.width);
    let y = data.index % this.currentLevel.width;
    this.currentLevel.setActor(new Actor("dead", x, y), data.index);
    this.state = "GAME_OVER";
  }

  run() {
    switch(this.state) {
      case "INIT":
        addEventListener("keypress", this.controller.bind(this));
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
        this.renderer.update(REFRESH);
        clearInterval(this.updateHandle);
        break;
    }
  }
};

function initGame() {
  new Logic();
}
//------------------------------------------------------------------------------