function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

class Board {
	constructor(width, height, num_bombs) {
		this.width = width;
		this.height = height;
		this.num_bombs = num_bombs;
		this.tiles = [];
		this.status = "start";
		this.bombs_left = this.num_bombs;
		this.tiles_left = this.width * this.height - this.num_bombs;
		this.init_tiles();
	}

	init_tiles() {
		for (var i = 0; i < this.width * this.height; i++) {
			this.tiles.push(new Tile(i));
		}
	}

	radius(index) {
		var col = index % this.width;
		var row = Math.floor(index / this.width);

		var first_row = Math.max(0, row - 1);
		var last_row = Math.min(this.height - 1, row + 1);

		var first_col = Math.max(0, col - 1);
		var last_col = Math.min(this.width - 1, col + 1);

		var result = []

		for (var r = first_row; r <= last_row; r++) {
			for (var c = first_col; c <= last_col; c++) {
				var i = this.width * r + c;
				if (i != index) {
					result.push(this.tiles[i]);
				}
			}
		}

		return result;
	}

	assign_bombs() {
		var indices = [];
		for (var i = 0; i < this.width * this.height; i++) {
			indices.push(i);
		}
		shuffle(indices);
		for (var i = 0; i < this.num_bombs; i++) {
			var index = indices[i];
			var tile = this.tiles[index];
			tile.make_bomb();
			for (var tile of this.radius(index)) {
				tile.number += 1;
			}
		}
	}

	assign_bombs_with_zero(index) {
		var indices = [];
		var to_exclude = {};
		to_exclude[index] = true;
		for (var tile of this.radius(index)) {
			to_exclude[tile.index] = true;
		}
		for (var i = 0; i < this.width * this.height; i++) {
			if (!to_exclude[i]) {
				indices.push(i);
			}
		}
		shuffle(indices);
		for (var i = 0; i < this.num_bombs; i++) {
			var index = indices[i];
			var tile = this.tiles[index];
			tile.make_bomb();
			for (var tile of this.radius(index)) {
				tile.number += 1;
			}
		}
	}
	

	covered_radius(index) {
		var col = index % this.width;
		var row = Math.floor(index / this.width);

		var first_row = Math.max(0, row - 1);
		var last_row = Math.min(this.height - 1, row + 1);

		var first_col = Math.max(0, col - 1);
		var last_col = Math.min(this.width - 1, col + 1);

		var result = []

		for (var r = first_row; r <= last_row; r++) {
			for (var c = first_col; c <= last_col; c++) {
				var i = this.width * r + c;
				var tile = this.tiles[i];
				if (i != index && tile.is_covered) {
					result.push(tile);
				}
			}
		}

		return result;
	}

	reveal(index) {
		var revealed_tile = this.tiles[index];
		if (!revealed_tile.is_covered || revealed_tile.is_flagged) {
			return;
		}
		revealed_tile.reveal();
		if (revealed_tile.is_bomb) {
			this.status = "lose";
			this.bombs_left -= 1;
			return;
		}
		else {
			this.tiles_left -= 1;
		}
		if (revealed_tile.number == 0) {
			var to_reveal = [revealed_tile]
			while(to_reveal.length > 0) {
				// I rewrote radius here because SPEED IS EVERYTHING, COPYPASTA IS EVERYTHING
				var next = to_reveal.pop();
				var next_index = next.index;
				var col = next_index % this.width;
				var row = Math.floor(next_index / this.width);
				var first_row = Math.max(0, row - 1);
				var last_row = Math.min(this.height - 1, row + 1);		
				var first_col = Math.max(0, col - 1);
				var last_col = Math.min(this.width - 1, col + 1);
				for (var r = first_row; r <= last_row; r++) {
					for (var c = first_col; c <= last_col; c++) {
						var i = this.width * r + c;
						var tile = this.tiles[i]
						if (tile.is_covered && !tile.is_flagged) {
							if (tile.number == 0) {
								to_reveal.push(tile);
							}
							tile.reveal();
							this.tiles_left -= 1;
						}
					}
				} 
			}
		}
	}

	reveal_and_draw(index, ctx, tile_size, colors) {
		var revealed_tile = this.tiles[index];
		if (!revealed_tile.is_covered || revealed_tile.is_flagged) {
			return;
		}
		revealed_tile.reveal();
		if (revealed_tile.is_bomb) {
			this.status = "lose";
			this.bombs_left -= 1;
			var x = (index % this.width) * tile_size;
			var y = Math.floor(index / this.width) * tile_size;
			this.draw_tile(revealed_tile, ctx, tile_size, x, y, colors)
			return;
		}
		else {
			var x = (index % this.width) * tile_size;
			var y = Math.floor(index / this.width) * tile_size;
			this.tiles_left -= 1;
			this.draw_number(revealed_tile, ctx, tile_size, x, y, colors)
		}
		if (revealed_tile.number == 0) {
			var to_reveal = [revealed_tile]
			while(to_reveal.length > 0) {
				// I rewrote radius here because SPEED IS EVERYTHING, COPYPASTA IS EVERYTHING
				var next = to_reveal.pop();
				var next_index = next.index;
				var col = next_index % this.width;
				var row = Math.floor(next_index / this.width);
				var first_row = Math.max(0, row - 1);
				var last_row = Math.min(this.height - 1, row + 1);		
				var first_col = Math.max(0, col - 1);
				var last_col = Math.min(this.width - 1, col + 1);
				for (var r = first_row; r <= last_row; r++) {
					for (var c = first_col; c <= last_col; c++) {
						var i = this.width * r + c;
						var tile = this.tiles[i]
						if (tile.is_covered && !tile.is_flagged) {
							if (tile.number == 0) {
								to_reveal.push(tile);
							}
							tile.reveal();
							this.draw_number(tile, ctx, tile_size, c * tile_size, r * tile_size, colors)
							this.tiles_left -= 1;
						}
					}
				} 
			}
		}
	}

	chord_and_draw(index, ctx, tile_size, colors) {
		var chord_tile = this.tiles[index];
		if (chord_tile.is_covered || chord_tile.is_bomb) {
			return;
		}
		var col = index % this.width;
		var row = Math.floor(index / this.width);

		var first_row = Math.max(0, row - 1);
		var last_row = Math.min(this.height - 1, row + 1);

		var first_col = Math.max(0, col - 1);
		var last_col = Math.min(this.width - 1, col + 1);

		var to_reveal = []
		var num_flagged = 0;

		for (var r = first_row; r <= last_row; r++) {
			for (var c = first_col; c <= last_col; c++) {
				var i = this.width * r + c;
				if (i != index) {
					var tile = this.tiles[i];
					if (tile.is_flagged || (tile.is_bomb && !tile.is_covered)) {
						num_flagged += 1;
					}
					else if (tile.is_covered) {
						to_reveal.push(tile);
					}
				}
			}
		}
		if (num_flagged == chord_tile.number) {
			for (var tile of to_reveal) {
				this.reveal_and_draw(tile.index, ctx, tile_size, colors);
			}
		}
	}

	flag(index) {
		var tile = this.tiles[index];
		if (!tile.is_covered) {
			return;
		}
		if (tile.is_flagged) {
			tile.unflag();
			this.bombs_left += 1;
		}
		else {
			tile.flag();
			this.bombs_left -= 1;
		}
	}

	flag_and_draw(index, ctx, tile_size, colors) {
		var tile = this.tiles[index];
		if (!tile.is_covered) {
			return;
		}
		if (tile.is_flagged) {
			tile.unflag();
			this.bombs_left += 1;
		}
		else {
			tile.flag();
			this.bombs_left -= 1;
		}
		var x = tile_size * (index % this.width);
		var y = tile_size * Math.floor(index / this.width);
		this.draw_tile(this.tiles[index], ctx, tile_size, x, y, colors)
	}

	toString() {
		var result = "";
		for (var r = 0; r < this.height; r++) {
			for (var c = 0; c < this.width; c++) {
				var i = this.width * r + c;
				var tile = this.tiles[i];
				if (tile.is_covered) {
					result += " ";
				}
				else {
					result += tile.number.toString();
				}
			}
			result += "\n";
		}
		return result;
	}

	render(ctx, tile_size, colors) {
		for (var r = 0; r < this.height; r++) {
			for (var c = 0; c < this.width; c++) {
				var x = tile_size * c;
				var y = tile_size * r;
				var index = this.width * r + c;
				var tile = this.tiles[index];
				this.draw_tile(tile, ctx, tile_size, x, y, colors);
			}
		}
	}

	draw_number(tile, ctx, tile_size, x, y, colors) {
		//ctx.strokeStyle = "#000000";
		//ctx.strokeRect(x, y, tile_size - 1, tile_size - 1);
		ctx.fillStyle = "#ffffff"
		ctx.fillRect(x, y, tile_size - 1, tile_size - 1);
		ctx.fillStyle = colors[tile.number];
		ctx.fillText(tile.number.toString(), x + tile_size/2, y + tile_size / 1.8);
	}

	draw_tile(tile, ctx, tile_size, x, y, colors) {
		ctx.strokeStyle = "#000000";
		ctx.strokeRect(x, y, tile_size - 1, tile_size - 1);
		if (tile.is_covered) {
			if (tile.is_flagged) {
				ctx.fillStyle = "#00ff00"
				ctx.fillRect(x, y, tile_size - 1, tile_size - 1);
			}
			else {
				ctx.fillStyle = "#afafaf"
				ctx.fillRect(x, y, tile_size - 1, tile_size - 1);
			}		
		}
		else if (tile.is_bomb) {
			ctx.fillStyle = "#ff0000"
			ctx.fillRect(x, y, tile_size - 1, tile_size - 1);
		}
		else {
			ctx.fillStyle = "#ffffff"
			ctx.fillRect(x, y, tile_size - 1, tile_size - 1);
			ctx.fillStyle = colors[tile.number];
			ctx.fillText(tile.number.toString(), x + tile_size/2, y + tile_size / 1.8);
		}
	}



}

class Tile {
	constructor(index) {
		this.is_bomb = false;
		this.index = index;
		this.is_covered = true;
		this.number = 0;
		this.is_flagged = false;
	}

	reveal() {
		this.is_covered = false;
	}

	make_bomb() {
		this.is_bomb = true;
	}

	assign_number(number) {
		this.number = number;
	}

	flag() {
		this.is_flagged = true;
	}

	unflag() {
		this.is_flagged = false;
	}

	toString() {
		return this.index.toString();
	}
}

class Gui {
	constructor() {
		this.canvas = document.getElementById("myCanvas");
		this.board = new Board(10, 10, 10);
		this.tile_size = 60;
		this.resize();
		this.colors = ["White", "Blue", "Green", "Red", "DarkBlue", "Brown", "DarkCyan", "Black", "Gray"];
		this.first_click = true;
	}

	resize() {
		this.canvas.width = this.board.width * this.tile_size;
		this.canvas.height = this.board.height * this.tile_size;
	}

	render() {
		var ctx = this.canvas.getContext("2d");
		ctx.font = (this.tile_size - 5).toString() + "px Helvetica"
		this.board.render(ctx, this.tile_size, this.colors);
	}

	on_click(event) {
		var rect = this.canvas.getBoundingClientRect();
    	var x = event.clientX - rect.left;
    	var y = event.clientY - rect.top;
		var row = Math.floor(y / this.tile_size);
		var col = Math.floor(x / this.tile_size);
		if (row >= this.board.height || col >= this.board.width) {
			return;
		}
		else {
			var ctx = this.canvas.getContext("2d");
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle'
			ctx.font = (Math.floor(this.tile_size * 0.8485)).toString() + "px Helvetica"
			var button = event.which
			var index = row * this.board.width + col
			if (this.first_click) {
				this.board.assign_bombs_with_zero(index);
				this.start = new Date();
				this.first_click = false;
			}
			if (button == 1) {
				var clicked_tile = this.board.tiles[index];
				if (clicked_tile.is_covered) {
					this.board.reveal_and_draw(index,  ctx, this.tile_size, this.colors);
				}
				else {
					this.board.chord_and_draw(index, ctx, this.tile_size, this.colors);
				}
				if (this.board.tiles_left == 0) {
					var now = new Date();
					var time = (now - this.start) / 1000;
					alert("Time: " + time.toString());
				}
			}
			else if (button == 3) {
				this.board.flag_and_draw(index, ctx, this.tile_size, this.colors);
			}
		}
	}
}

var gui = new Gui();
gui.render();
document.addEventListener("mousedown", (event) => gui.on_click(event));