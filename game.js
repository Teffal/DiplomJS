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

  // можно добавить значение аргумента по-умолчанию = 1
  times(multiplierVector) {
    return new Vector((this.x * multiplierVector), (this.y * multiplierVector));
  }
}

class Actor {
  // лучше не использовать конструктор Vector по-умолчанию, а писать (0, 0)
  // кто-нибудь может поменять это поведение и всё сломается
  constructor(positionActor = new Vector(), sizeActor = new Vector(1, 1), speedActor = new Vector()) {
    // здесь можно заменить || на &&, взять всё в скобки и иставить одно отрицание
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

  // лучше не писать в одну строку - это усложняет чтение
  get left() { return this.pos.x; }
  get top() { return this.pos.y; }
  get right() { return this.pos.x + this.size.x; }
  get bottom() { return this.pos.y + this.size.y; }
  get type() { return 'actor'; }

  isIntersect(moveActor) {
    if (!(moveActor instanceof Actor)) {
      throw new Error('Передан не актер.');
    // здесь не нужен else, если выполенине зайдёт в if функция завершит выполнение
    } else if (this === moveActor) {
      return false;
    // здесь тоже else лишний, лучше написать просто return <expr>
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
  // можно добавить значения по-умолчанию (пустые массивы)
  constructor(grid, actors) {
    // тут лучше создать копию массива, чтобы нельзя было изменить поле объекта извне
    this.actors = actors;
    this.status = null;
    this.finishDelay = 1;

    // по-моему это лишняя проверка
    if (Array.isArray(grid)) {
      this.grid = grid;
      this.height = this.grid.length;

      // не совсем понятно, что здесь происходит
      if (this.grid.some(function(element){ return Array.isArray(element)})) {
        this.width = this.grid[0].length;
      } else {
        this.width = 1;
      }
    } else {
      this.height = 0;
      this.width = 0;
    }
    // весь код выше можно записать проще:
    // высота - длина массива grid
    // ширина - длина самой длинной строки из массива грид
    // красивее всего это сделать через Math.max и map

    // я бы это не проверял
    if (this.actors) {
      // почему не стрелочная функция?
      this.player = this.actors.find(function(actor) { return actor.type === 'player'; });
    }
  }

  // не экономьте строки
  isFinished() { return this.status !== null && this.finishDelay < 0; }

  actorAt(moveActor) {
    if (!(moveActor instanceof Actor)) {
      throw new Error("Level: actorAt's argument is wrong");
    // лишняя проверка (undefined instanceof Actor это false)
    } else if (this.actors == undefined) {
      return undefined;
    }

    // тут лучше использовать метод find
    for (let actor of this.actors) {
      if (actor.isIntersect(moveActor)) { return actor; }
    }
  }

  obstacleAt(position, size) {
    // см выше про одно отрцание
    if (!(position instanceof Vector)||!(size instanceof Vector)) {
      throw new Error("Передан не вектор.");
    }

    const topBorder = Math.floor(position.y);
    const bottomBorder = Math.ceil(position.y + size.y);
    const leftBorder = Math.floor(position.x);
    const rightBorder = Math.ceil(position.x + size.x);

    if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
      return 'wall';
    // лишный else
    } else if (bottomBorder > this.height) {
      return 'lava';
    }

    for (let y = topBorder; y < bottomBorder; y++) {
      for (let x = leftBorder; x < rightBorder; x++) {
        // this.grid[y][x] я бы в переменную вынес для красоты
        if (this.grid[y][x]) {
          return this.grid[y][x];
        }
      }
    }
  }

  // не экономьте на строках
  // и что будет, если передать объект, которого нет в массиве?
  removeActor(actor) { this.actors.splice(this.actors.indexOf(actor), 1); }

  noMoreActors(typeActor) {
    // проверка лишняя, о целостности объекта лушче заботится в конструкторе
    // есть метод, который подходят лучше чем find в данном случае (возвращает true/false)
    if (Array.isArray(this.actors)) {
      return (!this.actors.find(function(actor) {return actor.type === typeActor}));
    }
    return true;
  }

  playerTouched(touched, actor) {
    // можно обратить условие, в теле if написать return, тогда вложенность кода уменьшится
    if (this.status === null) {
      // почему не стрелочная функция?
      if (['lava', 'fireball'].some(function(element) { return element === touched })) {
        this.status = 'lost';
        // можно добавить return и убрать else
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
  // можно добавить значение параметра по-умолчанию (пустой объект)
  constructor(charsDict) {
    // лучше создать копию обхекта
    this.actorsLibrary = charsDict;
  }

  actorFromSymbol(char) {
    // лишние проверки
    if (typeof char !== 'string' || !this.actorsLibrary) { return ; }
    return this.actorsLibrary[char];
  }

  // не экономьте на строках
  // словарь с препятствиями лучше объявите переменной, чтобы объект не создавался при каждом вызове функции
  obstacleFromSymbol(char) { return {'x': 'wall', '!': 'lava'}[char]; }

  // можно добавить значение аргумента по-умолчанию
  createGrid(arrayGrid) {
    // форматирование
    // истранная проверка
      if (arrayGrid instanceof Actor) { return; }
      let grid = [];
      for (let line of arrayGrid) {
          let result = [];
          // обычно строки преобразуют в массив с помощью split
          [...line].forEach((char) => result.push(this.obstacleFromSymbol(char)));
          grid.push(result);
      }
      return grid;
  }

  // можно добавить значение по-умолчанию
  createActors(arrayActors) {
    // я бы проверку это убрал
    if (!Array.isArray(arrayActors)) { return; }
    let actors = [];
    arrayActors.forEach((itemY, y) => {
      // обычно строки преобразуют в массив с помощью split
      [...itemY].forEach((itemX, x) => {
        let constructorActors = this.actorFromSymbol(itemX);
        let result;
        // можно обратить условие и return, тогда переменную result можно объявить чуть ниже, ближе к использованию
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

  // не экономьте строки
  parse(plan) { return new Level(this.createGrid(plan), this.createActors(plan)); }
}

class Fireball extends Actor {
  // выше отступ 2 пробела, а тут 4
    constructor(position=new Vector(0, 0), speed=new Vector(0, 0)) {
      // лучше явно задать значение второго параметра
      super(position, undefined, speed);
    }

    // не экономьте строки
    get type() { return 'fireball'; }
    // не экономьте строки
    getNextPosition(time = 1) { return this.pos.plus(this.speed.times(time)); }
    // не экономьте строки
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
  // не экономьте строки
  constructor(position) { super(position, new Vector(2, 0)); }
}

class VerticalFireball extends Fireball {
  // не экономьте строки
  constructor(position) { super(position, new Vector(0, 2)); }
}

class FireRain extends Fireball {
  constructor(position) {
    super(position, new Vector(0, 3));
    this.beginPosition = position;
  }
  // не экономьте строки
  handleObstacle() { this.pos = this.beginPosition; }
}

class Coin extends Actor {
  constructor(position) {
    super(position, new Vector(0.6, 0.6));
    // pos должно задаваться через конструктор базового класса
    this.pos = this.pos.plus(new Vector(0.2, 0.1));
    this.springSpeed = 8;
    this.springDist = 0.07;
    // Math.random не принимает аргументов
    this.spring = Math.random(0, 2 * Math.PI);
    // если вы хотели тут скопировать объект, то допустили ошибку
    this.startPos = Object.assign(this.pos);
  }

  // не экономьте строки
  get type() { return 'coin'; }
  // не экономьте строки
  updateSpring(number=1) { this.spring += this.springSpeed * number; }
  // не экономьте строки
  getSpringVector() { return new Vector(0, Math.sin(this.spring) * this.springDist); }

  // вообще обычно вокруг равно ставят пробелы getNextPosition(number = 1) {
  getNextPosition(number=1) {
    this.updateSpring(number);
    return this.startPos.plus(this.getSpringVector());
  }
  // не экономьте строки
  act(time) { this.pos = this.getNextPosition(time); }
}

class Player extends Actor {
  // можно добавить значение аргумента по-умолчанию (0,0)
  constructor(position) {
    super(position, new Vector(0.8, 1.5));
    // pos должо задаваться через конструктор базового класса
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
