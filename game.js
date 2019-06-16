/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Player {
  constructor(name) {
    this.name = name;
    this.tiles = [];
    this.isActive = true;
  }

  addTile(tile) {
    if (tile.isDisaster()) {
      // TODO: deal with disaster tiles...;
    }
    this.tiles.push(tile);
    // Makes it easier to see the same tiles.
    this.tiles.sort((a,b) => a.name < b.name);
  }

  getTiles() {
    return this.tiles;
  }

  getName() {
    return this.name;
  }

  endRound() {
    this.isActive = true;
    this.tiles = this.tiles.filter(tile => tile.isPermanent())
  }

  markInactive() {
    this.isActive = false;
  }
}

class Tile {
  // Corresponds to a tile.
  constructor(name) {
    this.name = name;
  }

  image() {
    return "images/" + this.name + ".png";
  }

  isRaTile() {
    return this.name === 'Ra';
  }

  isMonument() {
    return this.name in ['Fortress', 'Obelisk', 'Palace', 'Pyramid', 'Temple', 'Statue', 'StepPyramid', 'Sphinx'];
  }
  isEarthquake() {
    return this.name == 'Earthquake';
  }

  isNile() {
    return this.name == 'Nile';
  }
  isFlood() {
    return this.name == 'Flood';
  }
  isDrought() {
    return this.name == 'Drought';
  }

  isPharaoh() {
    return this.name == 'Pharaoh';
  }
  isFuneral() {
    return this.name == 'Funeral';
  }

  isCiv() {
    return this.name in ['Astronomy', 'Agriculture', 'Writing', 'Religion', 'Art'];
  }
  isWar() {
    return this.name == 'War';
  } 

  isPermanent() {
    return this.isMonument() || this.isPharaoh() || this.isNile();
  }
  isDisaster() {
    return this.isEarthquake() || this.isDrought() || this.isFuneral() || this.isWar();
  }
}

class Bag {
  // Holds the tiles, shuffles on constructions, allows drawing from the bag.
  constructor() {
    const TILE_COUNTS = {
      'Ra': 30,
      'GoldenGod': 8,
      'Astronomy': 5,
      'Agriculture': 5,
      'Writing': 5,
      'Religion': 5,
      'Art': 5,
      'War': 4,
      'Fortress': 5,
      'Obelisk': 5,
      'Palace': 5,
      'Pyramid': 5,
      'Earthquake': 2,
      'Gold': 5,
      'Temple': 5,
      'Statue': 5,
      'StepPyramid': 5,
      'Sphinx': 5,
      'Pharaoh': 25,
      'Funeral': 2,
      'Nile': 25,
      'Flood': 12,
      'Drought': 2,
    }

    let tiles = [];
    for (const [tileName, count] of Object.entries(TILE_COUNTS)) {
      for (let i = 0; i < count; i++) {
        tiles.push(new Tile(tileName));
      }
    }

    // Shuffle the bag.
    shuffle(tiles);
    this.tiles = tiles;
  }

  draw() {
    return this.tiles.pop();
  }
}

getStartInfo = function() {
  let numPlayers = null;
  while (numPlayers == null) {
    numPlayers = prompt("Please enter the number of players", "3")
    if (numPlayers == null) continue;
    numPlayers = parseInt(numPlayers, 10);
    if (isNaN(numPlayers)) {
      numPlayers = null;
      continue;
    }
    if (numPlayers < 2 || numPlayers > 5) {
      numPlayers = null;
      continue;
    }
  }

  let players = []
  for (let i = 0; i < numPlayers; i++) {
    const playerName = prompt("Player " + (i + 1) + " Name: ", "Player " + (i + 1));
    if (playerName == null) {
      return getStartInfo()
    }
    players.push(new Player(playerName));
  }

  return {
    'players': players,
    'bag': new Bag(),
  }
}

function getMaxRa(numPlayers) {
  const offset = (numPlayers == 2 ? 4 : 5)
  return numPlayers + offset;
}

class Game {
  constructor(gameInfo) {
    this.players = gameInfo.players;
    this.bag = gameInfo.bag;

    this.maxRa = getMaxRa(this.players.length);

    // Start empty.
    this.chestTrack = [];
    this.raTrack = [];

    this.currPlayerIdx = 0;
  }

  _renderRaTrack() {
    const raTrack = document.getElementById("raTrack")
    if (raTrack == null) {
      return alert("Error! Failed to find the raTrack on the page. Calling render() before html load?");
    }
    raTrack.innerHTML = "";
    const trackHeader = document.createElement('h1');
    trackHeader.innerText = 'Ra Tiles';
    raTrack.appendChild(trackHeader);
    for (const tile of this.raTrack) {
      const image = document.createElement('img');
      image.src = tile.image();
      raTrack.appendChild(image);
    }
    for (let i = this.raTrack.length; i < this.maxRa; i++) {
      const image = document.createElement('img');
      image.src = 'images/RaPlaceholder.png';
      raTrack.appendChild(image);
    }
  }

  _renderChestTrack() {
    const chestTrack = document.getElementById("chestTrack");
    if (chestTrack == null) {
      return alert("Error! Failed to find the chestTrack on the page. Calling render() before html load?");
    }
    chestTrack.innerHTML = "";
    const trackHeader = document.createElement('h1');
    trackHeader.innerText = 'Chest Tiles';
    chestTrack.appendChild(trackHeader);
    for (const tile of this.chestTrack) {
      const image = document.createElement('img');
      image.src = tile.image();
      chestTrack.appendChild(image);
    }
    for (let i = this.chestTrack.length; i < 8; i++) {
      const image = document.createElement('img');
      image.src = 'images/Placeholder.png';
      chestTrack.appendChild(image);
    }
  }

  _renderPlayers() {
    const allPlayers = document.getElementById("allPlayers");
    if (allPlayers == null) {
      return alert("Error! Failed to find the allPlayers on the page. Calling render() before html load?");
    }
    allPlayers.innerHTML = "";
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const playerDiv = document.createElement('div');
      playerDiv.className = 'playerHand';
      const playerHeader = document.createElement('h1');
      playerHeader.innerText = "Player: " + player.getName();
      playerDiv.appendChild(playerHeader);
      for (const tile of player.tiles) {
        const image = document.createElement("img");
        image.src = tile.image();
        playerDiv.appendChild(image);
      }
      const button = document.createElement('button');
      const game = this;
      button.addEventListener('click', function() {
        game.playerTakes(i);
        game.render();
      });
      button.innerText = "Take by " + player.getName();
      playerDiv.appendChild(button);
      allPlayers.appendChild(playerDiv);
    }
  }

  // Renders the game on the page.
  render() {
    this._renderRaTrack();
    this._renderChestTrack();
    this._renderPlayers();
  }

  playerTakes(playerIdx) {
    // Can only take 
    if (!this.players[playerIdx].isActive) { return; }
    for (const tile of this.chestTrack) {
      this.players[playerIdx].addTile(tile);
    }
    this.chestTrack = [];
  }

  _getNextPlayerIdx() {
    for (let i = this.currPlayerIdx + 1; i < this.players.length; i++) {
      if (this.players[i].isActive) {
        return i;
      }
    }
    // If we get here, start the loop again.
    for (let i = 0; i < this.currPlayerIdx; i++) {
      if (this.players[i].isActive) {
        return i;
      }
    }
    return null;
  }

  _reset() {
    this.raTrack = [];
    this.chestTrack = [];
    for (const player of this.players) {
      player.endRound();
    }
  }

  // Draws a tile.
  drawTile() {
    // If the current haul is full, also clear it.
    if (this.chestTrack.length == 8) {
      this.chestTrack = [];
    }
    const tile = this.bag.draw();
    if (tile.isRaTile()) {
      this.raTrack.push(tile);
    } else {
      this.chestTrack.push(tile);
    }
    // If the ra track is full, clear it as well as the tile track.
    if (this.raTrack.length == this.maxRa) {
      this._reset();
    }
  }
}



window.onload = function() {
  // Figure out the game details.
  gameInfo = getStartInfo();

  game = new Game(gameInfo);
  // Render the page.
  game.render();

  // handlers for next button.
  document.getElementById("drawButton").addEventListener("click", function() {
    game.drawTile();
    game.render();
  });
  window.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      document.getElementById("drawButton").click();
    }
  });
};