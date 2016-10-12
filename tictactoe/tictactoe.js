'use strict';

var timeout = 100;
var isComputer = {'X' : false,'O':true};

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
		throw new Error();
	}
	positions[player] |= 1 << index;
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

function selectRandom(x) {
	return x[Math.floor(Math.random() * x.length)];
}

function dontLose(mine,other) {
	function positionFromIndex(x) {
		return { 'row' : Math.floor(x/3),'column': x % 3, 'index' : x};
	}
	function win(mine,other) {
		var outs = [];
		for(var i=0;i<lines.length;i++) {
			var line = lines[i];
			if((popcount(mine & line) == 2) && ((other & line) == 0)) {
				var empty = line ^ (mine & line);
				outs.push(empty);
			}
		}
		if(outs.length > 0) {
			return positionFromIndex(countTrailingZeros(selectRandom(outs)));
		} else {
			throw new Error();
		}
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
	function doFork(mine,other) {
		var outs = [];
		for(var i=0;i<lines.length;i++) {
			for(var j=i+1;j<lines.length;j++) {
				try {
					outs.push( {
						'move': fork(mine,other,lines[i],lines[j]),
						'lines' : [lines[i],lines[j]]
					});
				} catch(e) {}
			}
		}
		if(outs.length > 0) {
			return selectRandom(outs);
		} else {
			throw new Error();
		}
	}
	// Fork
	try {
		return doFork(mine,other)['move'];
	} catch (e) {}

	// Block Fork
	function blockFork(mine,other) {
		var blockedFork = doFork(other,mine);
		
		var intersection = blockedFork['lines'][0] & blockedFork['lines'][1];
		var unionEmpty = (blockedFork['lines'][0] | blockedFork['lines'][1]) & ~(other|mine);
		var outs = [];
		while(unionEmpty) {
			var mask = 1 << countTrailingZeros(unionEmpty);
			for(var k=0;k<lines.length;k++) {
				var line = lines[k];
				// Playing this position will create a two-in-a-row for me
				if((popcount((mask | mine) & line) == 2)) {
					try {
						var t = win(mine|mask,other);
						try {
							var s = win(other | (1 << t['index']),mask|mine);
							var u = win(other | (1 << t['index']),mask|mine|(1<<s['index']));
						} catch(f) {
						outs.push(mask);
						}			
					} catch(e) {
					}
				}
			}

			unionEmpty ^= mask;
		}
		if(outs.length > 0) {
			return positionFromIndex(countTrailingZeros(selectRandom(outs)));
		} else {
			// Occupy the intersection.
			return positionFromIndex(countTrailingZeros(intersection));
		}
	}
	try {
		return blockFork(mine,other);
	} catch(e) {};

	// Center
	if(((mine|other) & 0x10) == 0) {
		return positionFromIndex(4);
	}

	var cornersAndOpposite = [[0x01,0x100],[0x4,0x40],[0x40,0x4],[0x100,0x01]];
	// Opposite Corner.
	function oppositeCorner(mine,other) {
		var outs = [];
		for(var i=0;i<cornersAndOpposite.length;i++) {
			if(((other & cornersAndOpposite[i][0]) != 0) && (((other | mine) & cornersAndOpposite[i][1]) == 0)) {
				outs.push(cornersAndOpposite[i][1]);
			}
		}
		if(outs.length>0) {
			return positionFromIndex(countTrailingZeros(selectRandom(outs)));
		} else {
			throw new Error();
		}
	}
	try {
		return oppositeCorner(mine,other);
	} catch(e) {}

	function emptyCell(mine,other,cells) {
		var outs = [];
		for(var i=0;i<cells.length;i++) {
			if(((other | mine) & cells[i]) == 0) {
				outs.push(cells[i]);
			}
		}
		if(outs.length>0) {
			return positionFromIndex(countTrailingZeros(selectRandom(outs)));
		} else {
			throw new Error();
		}
	}
	// Empty Corner.
	try {
		return emptyCell(mine,other,[0x1,0x100,0x4,0x40]);
	} catch(e) {}
	// Empty Side.
	try {
		return emptyCell(mine,other,[0x2,0x8,0x20,0x80]);
	} catch(e) {}
}

$(document).ready(function() {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	
	var positions;
	var player;
	var moves;

	$('.playerMenu > li').bind('mouseover', openSubMenu);
	$('.playerMenu > li').bind('mouseout', closeSubMenu);
	$('a.menuItem').bind('click', handleMenuClick);

	function displayPlayer(side) {
		var sideSelectorPlayer = '[player=\'' + (isComputer[side] ? 'computer' : 'human') + '\']';
		var sideSelectorSide = '[side=\'' + side + '\']';
		var sideText = $('a.menuItem' + sideSelectorPlayer + sideSelectorSide).text();
		$('#' + side.toLowerCase() + 'playerdisp').text(sideText);
	}

	displayPlayer('X');
	displayPlayer('O');
	function handleMenuClick() {
		var playerComputer;
		switch($(this).attr('player')) {
			case 'human':
				playerComputer = false;
				break
			case 'computer':
				playerComputer = true;
				break;
			default:
				throw new Error();
				break
		}
		var side = $(this).attr('side')
		isComputer[side] = playerComputer;
		displayPlayer(side);
	}
	function openSubMenu() {
		$(this).find('ul').css('visibility', 'visible');	
	}

	function closeSubMenu() {
		$(this).find('ul').css('visibility', 'hidden');	
	}	

	function clearBoard() {
		positions = {'X':0,'O':0};
		player = ['X','O'];
		moves = {'X':null,'O':null};
		drawBoard(canvas,context,positions);
	}
	function handleTurn() {
		if(isComputer[player[0]]) {
			moves[player[0]] = dontLose(positions[player[0]],positions[player[1]]);
		}

		if(moves[player[0]]) {
			try {
				makeMove(moves[player[0]]['row'],moves[player[0]]['column'],positions,player[0]);
				drawBoard(canvas,context,positions);
				if(hasWon(positions[player[0]])) {
					alert(player[0] + ' has won!');
					clearBoard();
				} else if((positions['X'] | positions['O'] & 0x1ff) == 0x1ff) {
					clearBoard();
				} else {
					moves[player[0]] = null;
					player.reverse();
				}
			} catch(e) {}
		}

		setTimeout(handleTurn,timeout);
	}
	clearBoard();
	handleTurn();

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
			if(!isComputer[player[0]]) {
				moves[player[0]] = {'row': cellRow,'column': cellColumn};
			}
		}
		event.preventDefault();
	});
});


