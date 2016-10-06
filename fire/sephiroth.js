'use strict';

//var DIEOFF =0.99;
var DIEOFF = 1-1e-2;
var FPS = 60.0;
var CANDLES = 1;
var FLAME_WIDTH = 1;

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
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('webgl');
    var flameImage = new Array(canvas.width*canvas.height);



	// Set up the shaders.
	var fragmentShader = getShader(context, 'shader-fragment');
	var vertexShader = getShader(context, 'shader-vertex');
	var shaderProgram = context.createProgram();

	context.attachShader(shaderProgram, vertexShader);
	context.attachShader(shaderProgram, fragmentShader);
	context.linkProgram(shaderProgram);
	context.useProgram(shaderProgram);


    var color0 = [2.7,0.5,0.3,-0.1];
    //var color1 = [3,1.2,0.7,3];
    var color1 = [3,1.2,0.7,5];

    var lineData = new Uint8Array(new Array(canvas.width));
    var lineImage = context.createTexture();
    context.activeTexture(context.TEXTURE1);
    context.bindTexture(context.TEXTURE_2D,lineImage);
    context.texImage2D(context.TEXTURE_2D, 0, context.LUMINANCE, canvas.width, 1, 0, context.LUMINANCE, context.UNSIGNED_BYTE, lineData);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.REPEAT);
    context.uniform1i(context.getUniformLocation(shaderProgram,"line"), 1);

    var flameImage = context.createTexture();
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D,flameImage);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    var flameData = new Uint8Array(new Array(canvas.width*canvas.height*4));
    for(var i=0;i<flameData.length;i++) {
        flameData[i] = 0;
    }
    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, canvas.width, canvas.height, 0, context.RGBA, context.UNSIGNED_BYTE,flameData);



    context.uniform1i(context.getUniformLocation(shaderProgram,"sampler"), 0);
    context.uniform2f(context.getUniformLocation(shaderProgram,"dims"), canvas.width, canvas.height);
    context.uniform4fv(context.getUniformLocation(shaderProgram,"color0"), color0);
    context.uniform4fv(context.getUniformLocation(shaderProgram,"color1"), color1);
    context.uniform1f(context.getUniformLocation(shaderProgram,"dieoff"), DIEOFF);


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

	context.bindBuffer(context.ARRAY_BUFFER, vertexPositionBuffer);
	context.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, context.FLOAT, false, 0, 0);

    /*context.enable(context.BLEND);
    context.blendFunc(context.SRC_COLOR, context.ZERO);
    context.blendEquation(context.FUNC_ADD);*/

    
    var candle_width = canvas.width / CANDLES;
    var candle_offset = candle_width * (FLAME_WIDTH) / 2;
    function redraw() {
    context.uniform1f(context.getUniformLocation(shaderProgram,"dieoff"), 1 - Math.random() * (1 - DIEOFF));
        context.clear(context.COLOR_BUFFER_BIT);
        for(var i=0;i<canvas.width;i++) {
            if((candle_width/2 + i) % candle_width < FLAME_WIDTH*candle_width) {
            lineData[i] = Math.random()*255;
            } else {
                lineData[i] = 0;
            }
        }
        context.activeTexture(context.TEXTURE1);
        context.texImage2D(context.TEXTURE_2D, 0, context.LUMINANCE, canvas.width, 1, 0, context.LUMINANCE, context.UNSIGNED_BYTE, lineData);

        context.drawArrays(context.TRIANGLE_STRIP, 0, vertexPositionBuffer.itemCount);
        context.activeTexture(context.TEXTURE0);
        context.copyTexImage2D(context.TEXTURE_2D, 0, context.RGBA, 0, 0, canvas.width, canvas.height, 0);
    }

    window.setInterval(redraw, 1000 / FPS);
});


