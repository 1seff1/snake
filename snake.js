const TILE_WIDTH  = 14;
const TILE_HEIGHT = 14;
const REFRESH     = Math.floor(1000.0 / 60.0);
const UPDATE      = Math.floor(REFRESH / 6.0);

// Actors ----------------------------------------------------------------------
class Actor {
  constructor(type, x, y) {
    this.type = type;
    this.x    = x;
    this.y    = y;
  }
  update(elapsedTime) { }
};
class Door extends Actor {
  constructor(type, x, y) {
    super(type, x, y);
    this.open   = false;
    this.stride = 0;
    this.width   = 14;
    this.height  = this.width;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  update(elapsedTime) {
    if (this.open)
      this.stride = 1;
  }
};
class Wall extends Actor {
  constructor(type, x, y) {
    super(type, x, y);
    this.width   = 14;
    this.height  = this.width;
    this.offsetX = 0;
    this.offsetY = 0;
    this.stride  = 0;
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
    this.stride  = 0;
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
    this.direction = "";
    this.next      = null;
    this.before    = null;
    this.index     = -1;
    this.stride    = 0;
  }
  append(body) {
    let tail = this;
          
    while (tail.before) {
      tail = tail.before;
    }
    
    tail.before = body;
    body.next   = tail;
  }
  grow(tail, body, levelHeight) {
    body.index       = tail.index;
    body.next        = tail.next;
    body.before      = tail;
    tail.next        = body;
    body.next.before = body;
    tail.index       = tail.next.index;

    switch (this.direction) {
      case "u":
        tail.index += levelHeight;
        break;
      case "d":
        tail.index -= levelHeight;
        break;
      case "r":
        tail.index--;
        break;
      case "l":
        tail.index++;
        break;
    }

    return tail;
  }
  update(elapsedTime) {
    let move = 0.03;

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
  updateIndices(tail) {
    while (tail.next) {
      tail.index = tail.next.index;
      tail       = tail.next;
    }
  }
};
class ActorFactory {
  constructor() {
    this.actorMap = new Map();

    // register actors
    this.actorMap.set("#", Wall);
    this.actorMap.set("o", Dot);
    this.actorMap.set("h", Snake);
    this.actorMap.set("t", Snake);
    this.actorMap.set("*", Snake);
    this.actorMap.set("d", Door);
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
    this.head         = null;
    this.tail         = null;
    this.eventManager = eventManager;
    this.numberOfDots = 0;

    // register listeners
    this.eventManager.addListener(new Listener("eatDot", this.dotEaten.bind(this)));
    this.eventManager.addListener(new Listener("dead", this.dead.bind(this)));
  }
  addActor(actor) {
    if (!actor) {
      this.actors.push(null);
    } else {
      if (actor instanceof Snake) {
        this.actors.push(null);
        if (actor.type === "h") {
          this.head = actor;
        } else {
          this.head.append(actor);
          
          if (actor.type === "t")
            this.tail = actor;
        }
        actor.index = this.actors.length - 1;
      } else {
        this.actors.push(actor);

        if (actor.type === "o")
          this.numberOfDots++;
      }
    }
  }
  setActor(actor, index) {
    if (index < 0 || index >= this.actors.length)
      return;

    this.actors[index] = actor;
  }
  update(elapsedTime) {
    for (let i = 0; i < this.actors.length; i++) {
      let actor = this.actors[i];
      
      if (actor) {
        if (this.numberOfDots === 0 && actor.type === "d")
          actor.open = true;

        actor.update(elapsedTime);
      }
    }

    let head = this.head;
    if (head) {
        head.update(elapsedTime);
        let newIndex = (Math.round(head.y) * this.width) + Math.round(head.x);

        if (head.index !== newIndex) {
          head.updateIndices(this.tail);
          head.index = newIndex;
          this.checkCollision(newIndex);
        }
    }
  }
  dead(data) {
    this.head.type = "dead";
  }
  dotEaten(data) {
    this.setActor(null, data.index);
    this.numberOfDots--;
  }
  checkCollision(index) {
    let hasBittenItself = false;
    let before          = this.head.before;
    
    while(before) {
      if (this.head.index === before.index && !hasBittenItself) {
        let data = { index : this.head.index };
        this.eventManager.queueEvent(new Event("dead", data));
        hasBittenItself = true;
      }
      before = before.before;
    }

    if (hasBittenItself)
      return;

    let a = this.actors[index];

    if (!a)
      return;

    let data = null;

    if (a.type === "o") {
      data = { "index" : index, "points" : 10 };
      this.eventManager.queueEvent(new Event("eatDot", data));
    } else if (a.type === "#") {
      data = { "index" : index };
      this.eventManager.queueEvent(new Event("dead", data));
    } else if (a.type === "d") {
      if (!a.open) {
        data = { "index" : index };
        this.eventManager.queueEvent(new Event("dead", data));
      } else {
        this.eventManager.queueEvent(new Event("win", {}));
      }
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
    this.second         = 0;
    this.fps            = 0;
    this.animation      = 0;

    this.isAnimationOn  = true;
    this.drawingTimes   = [];

    this.init();
  }
  init() {
    this.canvas    = document.getElementById("board");
    this.context   = this.canvas.getContext("2d");

    let wall = document.getElementById("wall");
    let dot  = document.getElementById("dot");
    let snk  = document.getElementById("snake");
    let dead = document.getElementById("dead");
    let body = document.getElementById("body");
    let tail = document.getElementById("tail");
    let door = document.getElementById("door");

    this.assets.set("#",    wall);
    this.assets.set("o",    dot);
    this.assets.set("h",    snk);
    this.assets.set("t",    tail);
    this.assets.set("*",    body);
    this.assets.set("dead", dead);
    this.assets.set("d",    door);

  }
  update(elapsedTime) {
    this.cummulatedTime += elapsedTime;
    this.second += elapsedTime;

    if (this.isAnimationOn && (this.fps % 10) === 0)
      this.animation = (this.animation + 1) % 5;

    if (this.cummulatedTime > REFRESH) {
      const startTime = new Date().getTime();
      this.draw();
      const endTime = new Date().getTime();
      this.drawingTimes.push(endTime - startTime);
      this.fps++;
      this.cummulatedTime -= REFRESH;
    }

    if (this.second >= 1000.0) {
      this.second -= 1000.0;
      document.getElementById("fps").innerHTML =
                     "fps: " + this.fps + " (" + this.drawingTimes.join() + ")";
      this.drawingTimes = [];
      this.fps = 0;
    }
  }
  clearDisplay() {
    this.context.fillStyle = "#f0fff0";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  draw() {
    this.clearDisplay();

    let actors = this.level.actors;
    let snake  = this.level.head;
    let asset  = null;
    let x      = -1;
    let y      = -1

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      
      y = (Math.floor(i / this.level.width)) * this.tileHeight;
      x = (i % this.level.width) * this.tileWidth;

      if (actor) {
        asset = this.assets.get(actor.type);
        
        if (actor.type === "d")
        console.log("door: " + actor.stride);
        if (asset) {
          y += actor.offsetY;
          x += actor.offsetX;

          let sx = actor.stride * actor.width;
          this.context.drawImage(asset, 
                                 sx, 0, this.tileWidth, this.tileWidth, // clipping 
                                 x, y, this.tileWidth, this.tileHeight); // size
        }
      }
    }
    do {
      asset     = this.assets.get(snake.type);
      let index = snake.index;

      y = (Math.floor(index / this.level.width)) * this.tileHeight;
      x = (index % this.level.width) * this.tileWidth;
      x += snake.offsetX;
      y += snake.offsetY;

      if (snake.type !== "*")
        this.context.drawImage(asset, x, y);
      else {
        this.context.drawImage(asset, this.animation * snake.width, 0, snake.width, this.tileHeight, x, y, this.tileWidth, this.tileHeight);
      }

      snake = snake.before;
    } while (snake);   
  }
};
//------------------------------------------------------------------------------


// Game Logic ------------------------------------------------------------------
class Logic {
  constructor() { 
    this.state = "INIT";
    this.levelDefinitions = [ level1, level2, level3, level4 ];
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
    this.eventManager.addListener(new Listener("eatDot", this.dotEaten.bind(this)));
    this.eventManager.addListener(new Listener("win", this.win.bind(this)));

    this.updateHandle = setInterval(this.run.bind(this), UPDATE);
  }
  dotEaten(data) {
    let tail = this.currentLevel.tail;
    let body = this.actorFactory.createActor("*", tail.x, tail.y);
    let h    = this.currentLevel.height;

    this.currentLevel.tail = this.currentLevel.head.grow(tail, body, h);
  }
  controller(event) {
    event.preventDefault();
    let actor = null;
    let x     = Math.round(this.currentLevel.head.x);
    let y     = Math.round(this.currentLevel.head.y);
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

    const headDir = this.currentLevel.head.direction;

    if (headDir === d)
      return;
    
    if ((headDir === "r" && d === "l") || (headDir === "l" && d === "r"))
      return;

    if ((headDir === "u" && d === "d") || (headDir === "d" && d === "u"))
      return;

    this.currentLevel.head.direction = d;
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
  win(data) {
    this.state = "LOAD_LEVEL";
  }
  pause() {
    clearInterval(this.updateHandle);
  }
  resume() {
    this.updateHandle = setInterval(this.run.bind(this), UPDATE);
  }
  run() {
    switch(this.state) {
      case "INIT":
        addEventListener("keypress", this.controller.bind(this));
        this.state = "LOAD_LEVEL";
        break;
      case "LOAD_LEVEL":
        if (!this.levelDefinitions.length) {
          this.state = "GAME_OVER";
          break;
        }
        this.currentLevel    = this.loadLevel(this.levelDefinitions.shift());
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
let logic = null;
function initGame() {
  logic = new Logic();
}
function pauseGame() {
  logic.pause();
}
function resume() {
  logic.resume();
}
//------------------------------------------------------------------------------

const level1 = [ 
  "###############d###############",
  "#                             #",
  "#                      o      #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#      o                      #",
  "#              o              #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#         o                   #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                  o          #",
  "#                             #",
  "#    oo                       #",
  "#                             #",
  "#   o                         #",
  "#                             #",
  "#                      o      #",
  "#                             #",
  "#             o               #",
  "#           h                 #",
  "#           t                 #",
  "###############################"
];

const level2 = [ 
  "###############d###############",
  "#                        o    #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#               o             #",
  "#                             #",
  "#                             #",
  "#      o                      #",
  "#                 o           #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#              o              #",
  "#     ###################     #",
  "#                             #",
  "#                             #",
  "#      o                      #",
  "#                             #",
  "#                  o          #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                      o      #",
  "#                             #",
  "#   o          o              #",
  "#           h                 #",
  "#           t                 #",
  "###############################"
];

const level3 = [ 
  "###############d###############",
  "#                             #",
  "#            o                #",
  "#        #           #        #",
  "#        #           #   o    #",
  "#        #           #        #",
  "#  #######           #######  #",
  "#                             #",
  "#      o                      #",
  "#              o              #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                    o        #",
  "#         o                   #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#                  o          #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#   o                         #",
  "#                             #",
  "#                      o      #",
  "#   #############             #",
  "#             o #             #",
  "#               #       h     #",
  "#                       t     #",
  "###############################"
];

const level4 = [ 
  "###############d###############",
  "#                             #",
  "#      o                o     #",
  "#                             #",
  "#    ####################     #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#      o                      #",
  "#        ##       ##          #",
  "#       ####  o  ####         #",
  "#      ######   ######        #",
  "#       ###### ######         #",
  "#        ###########          #",
  "#         #########           #",
  "#          #######            #",
  "#           #####             #",
  "#            ###              #",
  "#             #        o      #",
  "#                             #",
  "#                             #",
  "#                             #",
  "#         o                   #",
  "#                             #",
  "#    ####################     #",
  "#           o #    o          #",
  "#             #               #",
  "#             #               #",
  "#       h     #          o    #",
  "#   o   t     #               #",
  "###############################"
];

