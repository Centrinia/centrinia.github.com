
'use strict';
var autoplay = true;

function drawBoard(canvas,context,players) {
	var cellSize = 200;
	var padding = 0.2;
	var drawX = function (column,row) {
		context.beginPath();
		context.moveTo(column+padding,row+padding);
		context.lineTo(column+1-padding,row+1-padding);
		context.stroke();

		context.beginPath();
		context.moveTo(column+1-padding,row+padding);
		context.lineTo(column+padding,row+1-padding);
		context.stroke();
	};
	var drawO = function (column,row) {
		context.beginPath();
		context.arc(column+0.5,row+0.5,0.5-padding,2*Math.PI,false);
		context.stroke();
	};
	context.clearRect(0,0,canvas.width,canvas.height);
	context.save();
	context.scale(canvas.width/3,canvas.height/3);
	context.lineWidth = 0.1;
	context.strokeStyle = 'black';
	for(var i=1;i<=2;i++) {
		context.beginPath();
		context.moveTo(i,0);
		context.lineTo(i,3);
		context.stroke();

		context.beginPath();
		context.moveTo(0,i);
		context.lineTo(3,i);
		context.stroke();
	}
	for(var i=0;i<9;i++) {
		var column = i%3;
		var row = Math.floor(i/3);
		if((players['X'] >> i) & 1 == 1) {
			drawX(column,row);
		} else if((players['O'] >> i) & 1 == 1) {
			drawO(column,row);
		}
	}
	context.restore();
}

var lines = [0x7,0x38,0x1c0,0x49,0x92,0x124,0x111,0x54];
var notDiagonals = [0x7,0x38,0x1c0,0x49,0x92,0x124];

function hasWon(positions) {
	return lines.some(function (mask) {
		return (positions & mask) == mask;
	});
}
function makeMove(row,column,positions,player) {
	var index = row*3+column;
	if((((positions['X']|positions['O']) >> index) & 1) != 0) {
		return false;
	}
	positions[player] |= 1 << index;
	return true;
}

function popcount(x) {
	var t = x;
	t = (t & 0x55555555) + ((t>>1) & 0x55555555);
	t = (t & 0x33333333) + ((t>>2) & 0x33333333);
	t = (t & 0x0f0f0f0f) + ((t>>4) & 0x0f0f0f0f);
	t = (t & 0x00ff00ff) + ((t>>8) & 0x00ff00ff);
	t = (t & 0x0000ffff) + ((t>>16) & 0x0000ffff);
	return t;
}

function countTrailingZeros(x) {
	if(x == 0) {
		return 0;
	} else {
		return popcount(x ^ (x-1)) - 1;
	}
}

function dontLose(mine,other) {
	function positionFromIndex(x) {
		return { 'row' : Math.floor(x/3),'column': x % 3, 'index' : x};
	}
	function win(mine,other) {
		for(var i=0;i<lines.length;i++) {
			var line = lines[i];
			if((popcount(mine & line) == 2) && ((other & line) == 0)) {
				var empty = line ^ (mine & line);
				return positionFromIndex(countTrailingZeros(empty));
			}
		}
		throw new Error();
	}
	// Win
	try {
		return win(mine,other);
	} catch(e) {}

	// Block
	try {
		return win(other,mine);
	} catch(e) {}

	function fork(mine,other,line1,line2) {
		var intersection = line1 & line2;
		// Lines intersect
		if((intersection != 0) 
		// ... and intersection is empty.
			&& ((intersection & (other|mine)) == 0)
		// ... and contain exactly one of my pieces
			&& (popcount(line1 & mine) == 1) && (popcount(line2 & mine) == 1)
		// ... and two blanks
			&& ((line1 & other) == 0) && ((line2 & other) == 0)) {
			return positionFromIndex(countTrailingZeros(intersection));
		}
		throw new Error();
	}
	// Fork
	for(var i=0;i<lines.length;i++) {
		for(var j=i+1;j<lines.length;j++) {
			try {
				return fork(mine,other,lines[i],lines[j]);
			} catch(e) {}
		}
	}
	// Block Fork
	for(var i=0;i<lines.length;i++) {
		for(var j=i+1;j<lines.length;j++) {
			try {
				fork(other,mine,lines[i],lines[j]);

				var intersection = lines[i] & lines[j];
				var unionEmpty = (lines[i] | lines[j]) & ~(other|mine);
				while(unionEmpty) {
					var mask = 1 << countTrailingZeros(unionEmpty);
					for(var k=0;k<lines.length;k++) {
						var line = lines[k];
						// Playing this position will create a two-in-a-row for me
						if((popcount((mask | mine) & line) == 2)) {

						// ... and my opponent will have to block.
							try {
								var t = win(mine|mask,other);
								try {
									var s = win(other | (1 << t['index']),mask|mine);
									var u = win(other | (1 << t['index']),mask|mine|(1<<s['index']));
									console.log(s);
									console.log(u);
								} catch (f) {
									return positionFromIndex(countTrailingZeros(mask));
								}
							} catch (e ) {
							}
						}
					}

					unionEmpty ^= mask;
				}
				// Occupy the intersection.
				return positionFromIndex(countTrailingZeros(intersection));
			} catch(e) {
			}
		}
	}
	// Center
	if(((mine|other) & 0x10) == 0) {
		return positionFromIndex(4);
	}

	// Opposite Corner.
	var cornersAndOpposite = [[0x01,0x100],[0x4,0x40],[0x40,0x4],[0x100,0x01]];
	for(var i=0;i<cornersAndOpposite.length;i++) {
		if(((other & cornersAndOpposite[i][0]) != 0) && (((other | mine) & cornersAndOpposite[i][1]) == 0)) {
			return positionFromIndex(countTrailingZeros(cornersAndOpposite[i][1]));
		}
	}
	// Empty Corner.
	for(var i=0;i<cornersAndOpposite.length;i++) {
		if(((other | mine) & cornersAndOpposite[i][0]) == 0) {
			return positionFromIndex(countTrailingZeros(cornersAndOpposite[i][0]));
		}
	}
	// Empty Side
	var sides = [0x2,0x8,0x20,0x80];
	for(var i=0;i<sides.length;i++) {
		if(((other | mine) & sides[i]) == 0) {
			return positionFromIndex(countTrailingZeros(sides[i]));
		}
	}
}

$(document).ready(function() {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	
	var positions;
	var player = ['X','O'];
	function clearBoard() {
		positions = {'X':0,'O':0};
		drawBoard(canvas,context,positions);
	}
	function handleMove(cellRow,cellColumn) {
		if(makeMove(cellRow,cellColumn,positions,player[0])) {
			drawBoard(canvas,context,positions);
			if(hasWon(positions[player[0]])) {
				alert(player[0] + ' has won!');
				clearBoard();
				return;
			}
			if((positions['X'] | positions['O'] & 0x1ff) == 0x1ff) {
				alert('Tie!');
				clearBoard();
				return;
			}
			if(autoplay) {
				var move = dontLose(positions[player[1]],positions[player[0]]);
				makeMove(move['row'],move['column'],positions,player[1]);
				drawBoard(canvas,context,positions);
				if(hasWon(positions[player[1]])) {
					alert(player[1] + ' has won!');
					clearBoard();
					return;
				}
			} else {
				player.reverse();
			}
		}
	}
	clearBoard();
	$('#canvas').click(function(event) {
		var rows = 3;
		var columns = 3;
		var x = event.pageX - this.offsetLeft;
		var y = event.pageY - this.offsetTop;
		var cellWidth = Math.floor(canvas.width / columns);
		var cellHeight = Math.floor(canvas.height / rows);
		var cellColumn = Math.floor(x / cellWidth);
		var cellRow = Math.floor(y / cellHeight);
		if(0 <= cellColumn && cellColumn < columns && 0 <= cellRow && cellRow < rows) {
			handleMove(cellRow,cellColumn);
		}
	});
	//drawBoard(canvas,context,players);
});
