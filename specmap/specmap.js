
'use strict';
function add(x,y) {
	var z = new Array(x.length < y.length ? x.length : y.length);
	for(var i=0;i<z.length;i++) {
		z[i] = x[i] + y[i];
	}
	return z;
}
function normalize(x) {
	var norm = 0;
	for(var i=0;i<x.length;i++) {
		norm += x[i]*x[i];
	}
	norm = Math.sqrt(norm);
	var y = new Array(x.length);
	for(var i=0;i<x.length;i++) {
		y[i] = x[i] / norm;
	}
	return y;
}
function drawLight(context,diffuseImage,normalPixels,specularPixels,lightLocation,eyeDirection,lightColor) {
	var canvas = context.canvas;
	context.drawImage(diffuseImage,0,0,canvas.width,canvas.height);
	var contextData = context.getImageData(0,0,canvas.width,canvas.height);
	var pixels = contextData.data;
	
	var lightDirection = [0,0,lightLocation[2]];
	for(var yi=0,i=0;yi<canvas.height;yi++) {
		var y = yi / (canvas.height-1);
		lightDirection[1] = lightLocation[1] - y;
		var lightNorm12 = lightDirection[1] * lightDirection[1] + lightDirection[2] * lightDirection[2];
		for(var xi=0;xi<canvas.width;xi++,i++) {
			var x = xi / (canvas.width-1);
			lightDirection[0] = lightLocation[0] - x;
			// Compute the diffuse lighting
			var d = 0;
			var lightNorm = Math.sqrt(lightDirection[0] * lightDirection[0] + lightNorm12);
			var lightDirectionNormed = [0,0,0];
			for(var j=0;j<3;j++) {
				lightDirectionNormed[j] = lightDirection[j] / lightNorm;
				d += normalPixels[i*3+j] * lightDirectionNormed[j];
			}			

			// Compute the specular reflection.
			var specular = 0;
			var norm = 0;
			for(var j=0;j<3;j++) {
				var reflect = 2*normalPixels[i*3+j] * d - lightDirectionNormed[j];
				norm += reflect * reflect;
				specular += reflect*lightDirectionNormed[j];
			}
			norm = Math.sqrt(norm);
			specular /= norm;
			specular = specular < 0 ? 0 : specular;
			var diffuse = d < 0 ? 0 : (d > 1 ? 1 : d);
			for(var j=0;j<3;j++) {
				//pixels[i*4+j]=pixels[i*4+j]*diffuse+specularPixels[i*3+j]*specular;
				pixels[i*4+j]=pixels[i*4+j]*diffuse + specularPixels[i*3+j]*lightColor[j]*specular;
				//pixels[i*4+j]*=specular*100;
				//pixels[i*4+j]*=diffuse*3;
			}
		}
	}
	context.putImageData(contextData,0,0);

}

window.onload = (function () {
	var diffuseImage = document.getElementById("diffuse");
	var canvas = document.getElementById('canvas');
	if(canvas.width >= diffuseImage.width && canvas.height >= diffuseImage.height) {
		canvas.width = diffuseImage.width;
		canvas.height = diffuseImage.height;
	} else {
		if(diffuseImage.height > diffuseImage.width) {
			canvas.width = canvas.height * diffuseImage.width / diffuseImage.height;
		} else {
			canvas.height = canvas.width * diffuseImage.height / diffuseImage.width;
		}
	}

	var context = canvas.getContext('2d');
	var normalImage = document.getElementById("normal");
	context.drawImage(normalImage,0,0,canvas.width,canvas.height);
	var contextData = context.getImageData(0,0,canvas.width,canvas.height);
	var normalPixels = new Float32Array(canvas.width*canvas.height*3);
	for(var i=0,j=0;i<canvas.width*canvas.height;i++) {
		var norm = 0;
		var pixel = [0,0,0];
		for(var j=0;j<3;j++) {
			var t = contextData.data[i*4+j] - 127.5;
			norm += t*t;
			pixel[j] = t;
		}

		norm = Math.sqrt(norm);
		for(var j=0;j<3;j++) {
			normalPixels[i*3+j] = pixel[j] / norm;
		}
	}

	var specularImage = document.getElementById("specular");
	context.drawImage(specularImage,0,0,canvas.width,canvas.height);
	contextData = context.getImageData(0,0,canvas.width,canvas.height);
	var specularPixels = new Uint8ClampedArray(canvas.width*canvas.height*3);
	for(var i=0,j=0;i<canvas.width*canvas.height;i++) {
		for(var j=0;j<3;j++) {
			specularPixels[i*3+j] = contextData.data[i*4+j];
		}
	}


	function get_mousecoord(event) {
		var elem = event.target || event.srcElement;
		var rect = elem.getBoundingClientRect();
		return [(event.clientX - rect.left) / elem.width,
			(event.clientY - rect.top) / elem.height];
	}


	var lightColor = [1.7,2,1.5];
	//var lightColor = [10,10,10];
	var cz = 1/10;
	drawLight(context,document.getElementById("diffuse"),normalPixels,specularPixels,[0.5,0.5,cz],normalize([0.5,0.5,cz]),lightColor);
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
		var t = cz * Math.pow(1.2,delta);
		//var t = cz + delta/30;
		if(0 < t && t<10) {
			cz = t;
		}

		var diffuseImage = document.getElementById("diffuse");
		var coords = get_mousecoord(event);
		coords[2] = cz;
		event.preventDefault();

		drawLight(context,diffuseImage,normalPixels,specularPixels,coords,coords,lightColor);
	}
	canvas.onmousemove = function(event) {
		var coords = get_mousecoord(event);
		coords[2] = cz;
		//coords.push(cz);
		var diffuseImage = document.getElementById("diffuse");

		event.preventDefault();

		drawLight(context,diffuseImage,normalPixels,specularPixels,coords,coords,lightColor);
	}
});


