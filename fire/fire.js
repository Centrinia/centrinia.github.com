
'use strict';

var DIEOFF = (1 - 2e-2) / 4.0;
var FPS = 35.0;

function drawFlame(context,flameImage,heatmap) {
	var canvas = context.canvas;
	var contextData = context.getImageData(0,0,canvas.width,canvas.height);
	var pixels = contextData.data;
	
    var offset = flameImage.offset;
	for(var i=0;i<canvas.width;i++) {
        flameImage[offset * canvas.width + i] = Math.random();
    }
	for(var i=canvas.height-1;i>=2;i--) {
        for(var j=0;j<canvas.width;j++) {
            flameImage[((offset+i + 2) % canvas.height)*canvas.width + j] = 
                ((j >= 1 ? flameImage[((offset+i + 1) % canvas.height)*canvas.width + j-1] : 0) +
                 flameImage[((offset+i + 1) % canvas.height)*canvas.width + j] +
                 (j < canvas.width-1 ? flameImage[((offset+i + 1) % canvas.height)*canvas.width + j + 1] : 0) +
                 flameImage[((offset+i) % canvas.height)*canvas.width + j]
                ) * DIEOFF;
        }
	}

    for(var i=0;i<canvas.height;i++) {
        for(var j=0;j<canvas.width;j++) {
            var color = heatmap(flameImage[((offset+i) % canvas.height) * canvas.width + j]);
            for(var k=0;k<4;k++) {
                pixels[((canvas.height - i-1) * canvas.width + j) * 4 + k] = color[k]*255.0;
            }
        }
    }
    flameImage.offset = (canvas.height + offset - 1) % canvas.height;
	context.putImageData(contextData,0,0);
}
var normalPixels;
window.onload = (function () {
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
    var flameImage = new Array(canvas.width*canvas.height);
    for(var i=0;i<flameImage.length;i++) {
        flameImage[i] = 0;
    }
    flameImage.offset = 0;

    var color0 = [0.7,0.5,0.3,0.1];
    var color1 = [3,1.2,0.7,3];
    function heatmap(t) {
        var out = new Array(4);
        for(var i=0;i<4;i++) {
            out[i] = color0[i] * (1-t) + color1[i] * t;
        }
        return out;
    }
    window.setInterval(function () {
    	drawFlame(context,flameImage,heatmap);
    }, 1000 / FPS);
});


