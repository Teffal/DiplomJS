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
    // скобки можно убрать - убрал
    return new Vector(this.x * multiplierVector, this.y * multiplierVector);
  }
}
//true
class Actor {
  // а зачем у всех аргументов в конце Actor? - чтобы имя переменной было понятней.
  // если использовать pos, size, speed код станет читаемее - сделал.
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!((pos instanceof Vector)&&(size instanceof Vector)&&(speed instanceof Vector))) {
      throw new Error('Передан не вектор.');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
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
    // можно убрать скобки - убрал
    return this.left < moveActor.right && this.top < moveActor.bottom &&
            this.right > moveActor.left && this.bottom > moveActor.top;
  }
}
//true
class Level {
  constructor(grid = [], actors = []) {
    // лучше создать копию массива - создал
    const actorsCopy = actors;
    this.actors = actorsCopy;
    this.status = null;
    this.finishDelay = 1;
    // лучше создать копию массива - создал
    const gridCopy = grid;
    this.grid = gridCopy;
    this.height = this.grid.length;
    // Чтобы передать массив в качестве аргументов функции можно вместо apply использовать возможности ES6 помните как? - исправил.
    this.width = Math.max(0, ...this.grid.map(element=> element.length));
    // если у стрелочной функции один аргумент - скобки не нужны - исправил
    this.player = this.actors.find(actor => actor.type === 'player');
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(moveActor) {
    if (!(moveActor instanceof Actor)) {
      throw new Error("Level: actorAt's argument is wrong");
    }
    // не сообразил про реализацию find. - исправил.
    return this.actors.find(actor => actor.isIntersect(moveActor));
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
        const cell = this.grid[y][x];
        if (cell) {
          return cell;
        }
      }
    }
  }

  removeActor(actor) {
    // что будет, если объекта не окажется в массиве? - исправил.
    const findInd = this.actors.indexOf(actor);
    if (findInd !== -1) {
      this.actors.splice(findInd, 1)
    }
  }

  noMoreActors(typeActor) {
    // форматирование поехало - исправил.
    // здесь лучше подходит другой метод, окторый возвращает true или false - исправил.
    return (!this.actors.some(actor => actor.type === typeActor));
  }

  // уменьшение вложенности - исправил.
  playerTouched(touched, actor) {
    if (this.status !== null) {
      return
    }
    if (['lava', 'fireball'].some(element => element === touched )) {
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
//true ?
class LevelParser {
  // некорректное значение аргумента по-умолчанию, обратите внимание на тип - исправил.
  constructor(charsDict = {}) {
    // это не копия объекта, вы с ней ничего не делаете - исправил.
    const copyDict = charsDict;
    this.actorsLibrary = copyDict;
  }

  actorFromSymbol(char) {
    return this.actorsLibrary[char];
  }

  obstacleFromSymbol(char) {
    // не нужно создавать объект при каждом вызове функции - исправил.
    return {'x': 'wall', '!': 'lava'}[char];
  }

  createGrid(arrayGrid = []) {
    const grid = [];
    for (let line of arrayGrid) {
        const result = [];
        // обычно строки преобразуют в массив с помощью split - исправил.
        line.split('').forEach((char) => result.push(this.obstacleFromSymbol(char)));
        grid.push(result);
    }
    return grid;
  }

  createActors(arrayActors = []) {
    const actors = [];
    arrayActors.forEach((itemY, y) => {
      itemY.split('').forEach((itemX, x) => {
        const constructorActors = this.actorFromSymbol(itemX);
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
  // не экономьте строки - исправил.
  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
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
    const nextPosition = this.getNextPosition(time);
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
    const pos = position.plus(new Vector(0.2, 0.1));
    super(pos, new Vector(0.6, 0.6));
    // pos должно задаваться через конструктор родительского класса - исправил
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
    const pos = position.plus(new Vector(0, -0.5));
    super(pos, new Vector(0.8, 1.5));
    // pos должно задаваться через конструктор родительского класса - исправил.
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
