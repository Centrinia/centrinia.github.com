
'use strict';

function mandelbrot(cx,cy) {
	var x,y;
	var tx,ty;
	var xsq,ysq;
	var iterations = 0;
	x=0;
	y=0;
	xsq = 0;
	ysq = 0;
	while((xsq+ysq<=4.0) && (iterations < 1000)) {
		y = 2*x*y+cy;
		x = xsq-ysq+cx;
		xsq = x*x;
		ysq = y*y;
		iterations++;
	}
	return iterations;
}

function draw(canvas,context,extents) {
	context.clearRect(0,0,canvas.width,canvas.height);
	var img = context.createImageData(canvas.width,canvas.height);
	for(var i=0;i<canvas.width;i++) {
		var x = (i/canvas.width)*(extents['right']-extents['left'])+extents['left'];
		for(var j=0;j<canvas.height;j++) {
			var y = (j/canvas.height)*(extents['bottom']-extents['top'])+extents['top'];
			var iterations = mandelbrot(x,y);
			img.data[(j*canvas.width+i)*4] = iterations & 0xff;
			img.data[(j*canvas.width+i)*4+1] = (iterations >> 8) & 0xff;
			img.data[(j*canvas.width+i)*4+2] = (iterations >> 16) & 0xff;
			img.data[(j*canvas.width+i)*4+3] = 255;
		}
	}
	context.putImageData(img,0,0);
	return img;
}

$(document).ready(function() {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var extents = {'left':-2.0,'right':1.0,'top':-1,'bottom':1};
	var img = draw(canvas,context,extents);

	var pending = null;
	$('#canvas').mousedown(function(event) {
		var x = event.pageX - this.offsetLeft;
		var y = event.pageY - this.offsetTop;

		var cx = (x / canvas.width)*(extents['right']-extents['left']) + extents['left'];
		var cy = (y / canvas.height)*(extents['bottom']-extents['top']) + extents['top'];

		pending = {'x':cx,'y':cy,'ox':x,'oy':y};
	});
	$('#canvas').mousemove(function(event) {
		if(pending) {
			var ox = pending['ox'];
			var oy = pending['oy'];
			var x = event.pageX - this.offsetLeft;
			var y = event.pageY - this.offsetTop;
			var cx = (x / canvas.width)*(extents['right']-extents['left']) + extents['left'];
			var cy = (y / canvas.height)*(extents['bottom']-extents['top']) + extents['top'];

			context.strokeStyle = 'white';
			var left = ox < x ? ox : x;
			var top = oy < y ? oy : y;
			var width = Math.abs(ox-x);
			var height = Math.abs(oy-y);
			context.putImageData(img,0,0);
			context.strokeRect(left,top,width,height);
	}
	});
	$('#canvas').mouseup(function(event) {
		var x = event.pageX - this.offsetLeft;
		var y = event.pageY - this.offsetTop;

		var cx = (x / canvas.width)*(extents['right']-extents['left']) + extents['left'];
		var cy = (y / canvas.height)*(extents['bottom']-extents['top']) + extents['top'];
		if(pending) {
			extents = {'left':pending['x'],'top':pending['y'],'right':cx,'bottom':cy};
			pending = null;
			img = draw(canvas,context,extents);
		}
	});
	$('#reset_button').click(function(event) {
		extents = {'left':-2.0,'right':1.0,'top':-1,'bottom':1};
		img = draw(canvas,context,extents);
		event.preventDefault();
	});
});

