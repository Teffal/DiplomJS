'use strict';

class Vector {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }

  plus(plusVector) {
    if (!(plusVector instanceof Vector)) {
        throw new Error('Передан не вектор, сложение не выполнено.');
    }
    return new Vector(this.x + plusVector.x, this.y + plusVector.y);
  }

  times(multiplierVector) {
    return new Vector((this.x * multiplierVector), (this.y * multiplierVector));
  }
}

class Actor {
  constructor(positionActor = new Vector(), sizeActor = new Vector(1, 1), speedActor = new Vector()) {
    if (!(positionActor instanceof Vector)||
        !(sizeActor instanceof Vector)||
        !(speedActor instanceof Vector)) {
      throw new Error('Передан не вектор.');
    }
    this.pos = positionActor;
    this.size = sizeActor;
    this.speed = speedActor;
  }

  act() {}

  get left() { return this.pos.x; }
  get top() { return this.pos.y; }
  get right() { return this.pos.x + this.size.x; }
  get bottom() { return this.pos.y + this.size.y; }
  get type() { return 'actor'; }

  isIntersect(moveActor) {
    if (!(moveActor instanceof Actor)) {
      throw new Error('Передан не актер.');
    } else if (this === moveActor) {
      return false;
    } else if (this.left < moveActor.right &&
      this.top < moveActor.bottom &&
      this.right > moveActor.left &&
      this.bottom > moveActor.top) {
      return true;
    }
    return false;
  }
}

class Level {
  constructor(grid, actors) {
    this.actors = actors;
    this.status = null;
    this.finishDelay = 1;

    if (Array.isArray(grid)) {
      this.grid = grid;
      this.height = this.grid.length;

      if (this.grid.some(function(element){ return Array.isArray(element)})) {
        this.width = this.grid[0].length;
      } else {
        this.width = 1;
      }
    } else {
      this.height = 0;
      this.width = 0;
    }

    if (this.actors) {
      this.player = this.actors.find(function(actor) { return actor.type === 'player'; });
    }
  }

  isFinished() { return this.status !== null && this.finishDelay < 0; }

  actorAt(moveActor) {
    if (!(moveActor instanceof Actor)) {
      throw new Error("Level: actorAt's argument is wrong");
    } else if (this.actors == undefined) {
      return undefined;
    }

    for (let actor of this.actors) {
      if (actor.isIntersect(moveActor)) { return actor; }
    }
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector)||!(size instanceof Vector)) {
      throw new Error("Передан не вектор.");
    }

    const topBorder = Math.floor(position.y);
    const bottomBorder = Math.ceil(position.y + size.y);
    const leftBorder = Math.floor(position.x);
    const rightBorder = Math.ceil(position.x + size.x);

    if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
      return 'wall';
    } else if (bottomBorder > this.height) {
      return 'lava';
    }

    for (let y = topBorder; y < bottomBorder; y++) {
      for (let x = leftBorder; x < rightBorder; x++) {
        if (this.grid[y][x]) {
          return this.grid[y][x];
        }
      }
    }
  }

  removeActor(actor) { this.actors.splice(this.actors.indexOf(actor), 1); }

  noMoreActors(typeActor) {
    if (Array.isArray(this.actors)) {
      return (!this.actors.find(function(actor) {return actor.type === typeActor}));
    }
    return true;
  }

  playerTouched(touched, actor) {
    if (this.status === null) {
      if (['lava', 'fireball'].some(function(element) { return element === touched })) {
        this.status = 'lost';
      } else if (touched === 'coin' && actor.type === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}

class LevelParser {
  constructor(charsDict) {
    this.actorsLibrary = charsDict;
  }

  actorFromSymbol(char) {
    if (typeof char !== 'string' || !this.actorsLibrary) { return ; }
    return this.actorsLibrary[char];
  }

  obstacleFromSymbol(char) { return {'x': 'wall', '!': 'lava'}[char]; }

  createGrid(arrayGrid) {
      if (arrayGrid instanceof Actor) { return; }
      let grid = [];
      for (let line of arrayGrid) {
          let result = [];
          [...line].forEach((char) => result.push(this.obstacleFromSymbol(char)));
          grid.push(result);
      }
      return grid;
  }

  createActors(arrayActors) {
    if (!Array.isArray(arrayActors)) { return; }
    let actors = [];
    arrayActors.forEach((itemY, y) => {
      [...itemY].forEach((itemX, x) => {
        let constructorActors = this.actorFromSymbol(itemX);
        let result;
        if (typeof constructorActors === 'function') {
          result = new constructorActors(new Vector(x, y));
        }
        if (result instanceof Actor) {
          actors.push(result);
        }
      });
    });
    return actors;
  }

  parse(plan) { return new Level(this.createGrid(plan), this.createActors(plan)); }
}

class Fireball extends Actor {
    constructor(position=new Vector(0, 0), speed=new Vector(0, 0)) {
      super(position, undefined, speed);
    }

    get type() { return 'fireball'; }
    getNextPosition(time = 1) { return this.pos.plus(this.speed.times(time)); }
    handleObstacle() { this.speed = this.speed.times(-1); }

    act(time, level) {
      let nextPosition = this.getNextPosition(time);
      if (level.obstacleAt(nextPosition, this.size)) {
        this.handleObstacle();
      } else {
        this.pos = nextPosition;
      }
    }
}

class HorizontalFireball extends Fireball {
  constructor(position) { super(position, new Vector(2, 0)); }
}

class VerticalFireball extends Fireball {
  constructor(position) { super(position, new Vector(0, 2)); }
}

class FireRain extends Fireball {
  constructor(position) {
    super(position, new Vector(0, 3));
    this.beginPosition = position;
  }

  handleObstacle() { this.pos = this.beginPosition; }
}

class Coin extends Actor {
  constructor(position) {
    super(position, new Vector(0.6, 0.6));
    this.pos = this.pos.plus(new Vector(0.2, 0.1));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random(0, 2 * Math.PI);
    this.startPos = Object.assign(this.pos);
  }

  get type() { return 'coin'; }
  updateSpring(number=1) { this.spring += this.springSpeed * number; }
  getSpringVector() { return new Vector(0, Math.sin(this.spring) * this.springDist); }

  getNextPosition(number=1) {
    this.updateSpring(number);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time) { this.pos = this.getNextPosition(time); }
}

class Player extends Actor {
  constructor(position) {
    super(position, new Vector(0.8, 1.5));
    this.pos = this.pos.plus(new Vector(0, -0.5));
  }

  get type() { return 'player'; }
}

const actorDict = {
    '@': Player,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball,
    'v': FireRain
};

const parser = new LevelParser(actorDict);

loadLevels()
    .then((res) => {runGame(JSON.parse(res), parser, DOMDisplay)
    .then(() => alert('Вы выиграли!'))});
