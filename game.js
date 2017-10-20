'use strict';
// true
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

  times(multiplierVector = 1) {
    return new Vector((this.x * multiplierVector), (this.y * multiplierVector));
  }
}
//true
class Actor {
  constructor(positionActor = new Vector(0, 0), sizeActor = new Vector(1, 1), speedActor = new Vector(0, 0)) {
    if (!((positionActor instanceof Vector)&&(sizeActor instanceof Vector)&&(speedActor instanceof Vector))) {
      throw new Error('Передан не вектор.');
    }
    this.pos = positionActor;
    this.size = sizeActor;
    this.speed = speedActor;
  }

  act() {}

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(moveActor) {
    if (!(moveActor instanceof Actor)) {
      throw new Error('Передан не актер.');
    }
    if (this === moveActor) {
      return false;
    }
    return (this.left < moveActor.right && this.top < moveActor.bottom &&
            this.right > moveActor.left && this.bottom > moveActor.top);
  }
}
// true ???
class Level {
  constructor(grid = [], actors = []) {
    this.actors = actors;
    this.status = null;
    this.finishDelay = 1;
    this.grid = grid;
    this.height = this.grid.length;

    if (this.height === 0) {
      this.width = 0;
    } else {
      this.width = Math.max.apply(null, (this.grid.map((element)=> element.length)));
    }

    this.player = this.actors.find((actor) => actor.type === 'player');
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(moveActor) {
    if (!(moveActor instanceof Actor)) {
      throw new Error("Level: actorAt's argument is wrong");
    } else if (this.actors == undefined) { // без данной проверки выдает ошибку в тесте.
      return undefined;
    }

    // не сообразил про реализацию find.
    // Пытался избввиться от контрукции for ещё на стадии создания но не получилось.
    for (let actor of this.actors) {
      if (actor.isIntersect(moveActor)) { return actor; }
    }
  }

  obstacleAt(position, size) {
    if (!((position instanceof Vector)&&(size instanceof Vector))) {
      throw new Error("Передан не вектор.");
    }

    const topBorder = Math.floor(position.y);
    const bottomBorder = Math.ceil(position.y + size.y);
    const leftBorder = Math.floor(position.x);
    const rightBorder = Math.ceil(position.x + size.x);

    if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
      return 'wall';
    }
    if (bottomBorder > this.height) {
      return 'lava';
    }

    for (let y = topBorder; y < bottomBorder; y++) {
      for (let x = leftBorder; x < rightBorder; x++) {
        let cell = this.grid[y][x];
        if (cell) {
          return cell;
        }
      }
    }
  }

  removeActor(actor) {
    this.actors.splice(this.actors.indexOf(actor), 1);
  }

  noMoreActors(typeActor) {
      return (!this.actors.find(function(actor) {return actor.type === typeActor}));
  }

  // не предумал преобразования для уменьшения вложенности.
  // Для прохождения теста получилось, но игра была не корректна.
  playerTouched(touched, actor) {
    if (this.status === null) {
      if (['lava', 'fireball'].some((element) => element === touched )) {
        this.status = 'lost';
      }
      if (touched === 'coin' && actor.type === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}
//true ??
class LevelParser {
  constructor(charsDict = []) {
    let copyDict = charsDict;
    this.actorsLibrary = charsDict;
  }

  actorFromSymbol(char) {
    return this.actorsLibrary[char];
  }

  obstacleFromSymbol(char) {
    let carrentlyDict = {'x': 'wall', '!': 'lava'};
    return carrentlyDict[char];
  }

  createGrid(arrayGrid = []) {
    let grid = [];
    for (let line of arrayGrid) {
        let result = [];
        // обычно строки преобразуют в массив с помощью split
        // у меня замена символа, не понял как тут использовать split и для чего?
        [...line].forEach((char) => result.push(this.obstacleFromSymbol(char)));
        grid.push(result);
    }
    return grid;
  }

  createActors(arrayActors = []) {
    let actors = [];
    arrayActors.forEach((itemY, y) => {
      [...itemY].forEach((itemX, x) => {
        let constructorActors = this.actorFromSymbol(itemX);
        let result;
        // можно обратить условие и return, тогда переменную result можно объявить чуть ниже, ближе к использованию
        // эту мысль не понял?
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
//true
class Fireball extends Actor {
  constructor(position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}
//true
class HorizontalFireball extends Fireball {
  constructor(position) {
    super(position, new Vector(2, 0));
  }
}
//true
class VerticalFireball extends Fireball {
  constructor(position) {
    super(position, new Vector(0, 2));
  }
}
//true
class FireRain extends Fireball {
  constructor(position) {
    super(position, new Vector(0, 3));
    this.beginPosition = position;
  }

  handleObstacle() {
    this.pos = this.beginPosition;
  }
}
//true
class Coin extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0.6, 0.6));
    this.pos = position.plus(new Vector(0.2, 0.1));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
    this.startPos = this.pos;
  }

  get type() {
    return 'coin';
  }

  updateSpring(number = 1) {
    this.spring += this.springSpeed * number;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(number = 1) {
    this.updateSpring(number);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}
//true
class Player extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0.8, 1.5));
    this.pos = position.plus(new Vector(0, -0.5));
  }

  get type() {
    return 'player';
  }
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
