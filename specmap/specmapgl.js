
'use strict';

function add(x,y) {
	var z = new Array(x.length < y.length ? x.length : y.length);
	for(var i=0;i<z.length;i++) {
		z[i] = x[i] + y[i];
	}
	return z;
}
function subtract(x,y) {
	var z = new Array(x.length < y.length ? x.length : y.length);
	for(var i=0;i<z.length;i++) {
		z[i] = x[i] - y[i];
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

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
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

	var context = canvas.getContext('experimental-webgl');


	// Set up the shaders.
	var fragmentShader = getShader(context, 'shader-fragment');
	var vertexShader = getShader(context, 'shader-vertex');
	var shaderProgram = context.createProgram();

	context.attachShader(shaderProgram, vertexShader);
	context.attachShader(shaderProgram, fragmentShader);
	context.linkProgram(shaderProgram);
	context.useProgram(shaderProgram);

	shaderProgram.lightPositionUniform = context.getUniformLocation(shaderProgram, "lightPosition");
	shaderProgram.lightColorUniform = context.getUniformLocation(shaderProgram, "lightColor");
	shaderProgram.eyePositionUniform = context.getUniformLocation(shaderProgram, "eyePosition");


	function bind_texture(index,sampler,image) {
		var texture = context.createTexture();
		context.activeTexture(context.TEXTURE0+index);
        context.bindTexture(context.TEXTURE_2D,texture);
        context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
        context.generateMipmap(context.TEXTURE_2D);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
        context.uniform1i(context.getUniformLocation(shaderProgram,sampler), index);
		return texture;
	}

	var normalImage = document.getElementById("normal");
	var specularImage = document.getElementById("specular");

	var diffuseTexture = bind_texture(0,"diffuseSampler",diffuseImage);
	bind_texture(1,"normalSampler",normalImage);
	bind_texture(2,"specularSampler",specularImage);


	// Bind the rectangle.
	var vertexes = [
		0,0,
		0,1,
		1,0,
		1,1
			];
	var vertexPositionBuffer = context.createBuffer();
	vertexPositionBuffer.itemSize = 2;
	vertexPositionBuffer.itemCount = 4;
	context.bindBuffer(context.ARRAY_BUFFER, vertexPositionBuffer);
	context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexes), context.STATIC_DRAW);

	shaderProgram.vertexPositionAttribute = context.getAttribLocation(shaderProgram, "aVertexPosition");
	context.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);



	var lightColor = [1.7,2,1.5,1];
	context.uniform4fv(shaderProgram.lightColorUniform, lightColor);
	var cz = 1/10;


	context.bindBuffer(context.ARRAY_BUFFER, vertexPositionBuffer);
	context.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, context.FLOAT, false, 0, 0);

	function get_mousecoord(event) {
		var elem = event.target || event.srcElement;
		var rect = elem.getBoundingClientRect();
		return [(event.clientX - rect.left) / elem.width,
			(event.clientY - rect.top) / elem.height];
	}

	context.clear(context.COLOR_BUFFER_BIT);
	context.uniform3fv(shaderProgram.lightPositionUniform, [0.5,0.5,cz]);
	context.uniform3fv(shaderProgram.eyePositionUniform, [0.5,0.5,cz]);
	context.drawArrays(context.TRIANGLE_STRIP, 0, vertexPositionBuffer.itemCount);
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
		if(0 < t && t<10) {
			cz = t;
		}

		event.preventDefault();
		var coords = get_mousecoord(event);
		coords[1] *= -1;
		coords[2] = cz;
		context.uniform3fv(shaderProgram.lightPositionUniform, add(coords,[0,1,0]));
		context.uniform3fv(shaderProgram.eyePositionUniform, add(coords,[0,1,0]));
		context.drawArrays(context.TRIANGLE_STRIP, 0, vertexPositionBuffer.itemCount);
	}
	canvas.onmousemove = function(event) {
        var coords = get_mousecoord(event);
		coords[1] *= -1;
		coords[2] = cz;

		event.preventDefault();
		context.clear(context.COLOR_BUFFER_BIT);
		context.uniform3fv(shaderProgram.lightPositionUniform, add(coords,[0,1,0]));
		context.uniform3fv(shaderProgram.eyePositionUniform, add(coords,[0,1,0]));
		context.drawArrays(context.TRIANGLE_STRIP, 0, vertexPositionBuffer.itemCount);
	}
});


