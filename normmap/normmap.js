
'use strict';

function drawLight(context,diffuseImage,normalPixels,cx,cy,cz) {
	var canvas = context.canvas;
	context.drawImage(diffuseImage,0,0,canvas.width,canvas.height);
	var contextData = context.getImageData(0,0,canvas.width,canvas.height);
	var pixels = contextData.data;
	
	var v = [0,0,cz];
	for(var yi=0,i=0;yi<canvas.height;yi++) {
		var y = yi / (canvas.height-1);
		v[1] = cy - y;
		var norm = v[1] * v[1] + v[2] * v[2];
		for(var xi=0;xi<canvas.width;xi++,i++) {
			var x = xi / (canvas.width-1);
			v[0] = cx - x;

			var d = 0;
			for(var j=0;j<3;j++) {
				d += normalPixels[i*3+j] * v[j];
			}			
			d /= Math.sqrt(v[0] * v[0] + norm);
			if(d>1) {
				d = 1;
			} else if(d < 0) {
				d = 0;
			}
			d *= 3;
			for(var j=0;j<3;j++) {
				pixels[i*4+j]*=d;
			}
		}
	}
	context.putImageData(contextData,0,0);

}
var normalPixels;
window.onload = (function () {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var normalImage = document.getElementById("normal");
	context.drawImage(normalImage,0,0,canvas.width,canvas.height);
	var contextData = context.getImageData(0,0,canvas.width,canvas.height);
	normalPixels = new Float32Array(canvas.width*canvas.height*3);
	for(var i=0,j=0;i<canvas.width*canvas.height;i++) {
		var norm = 0;
		var pixel = [0,0,0];
		for(var j=0;j<3;j++) {
			var t = (contextData.data[i*4+j] / 127.5) - 1.0;
			norm += t*t;
			pixel[j] = t;
		}

		norm = Math.sqrt(norm);
		for(var j=0;j<3;j++) {
			normalPixels[i*3+j] = pixel[j] / norm;
		}
	}
	var cz = 1/10;
	drawLight(context,document.getElementById("diffuse"),normalPixels,0.5,0.5,cz);
	canvas.onmousewheel = function(event) {
		if(!event) {
			event = window.event;
		}
		var delta = 0;
		if(event.wheelDelta) {
			delta = event.wheelDelta/120;
		} else if(event.detail) {
			delta = event.detail/-3;
		}
		var t = cz + delta/30;
		if(0 < t && t<10) {
			cz = t;
		}
		var diffuseImage = document.getElementById("diffuse");
		var cx = event.clientX / canvas.width;
		var cy = event.clientY / canvas.height;
		drawLight(context,diffuseImage,normalPixels,cx,cy,cz);
	}
	canvas.onmousemove = function(event) {
		var diffuseImage = document.getElementById("diffuse");
		var cx = event.clientX / canvas.width;
		var cy = event.clientY / canvas.height;
		drawLight(context,diffuseImage,normalPixels,cx,cy,cz);
	}
});


