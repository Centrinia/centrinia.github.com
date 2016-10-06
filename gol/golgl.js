'use strict';

var FPS =60.0;

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



	// Set up the shaders.
	var fragmentShader = getShader(context, 'shader-fragment');
	var vertexShader = getShader(context, 'shader-vertex');
	var shaderProgram = context.createProgram();

	context.attachShader(shaderProgram, vertexShader);
	context.attachShader(shaderProgram, fragmentShader);
	context.linkProgram(shaderProgram);
	context.useProgram(shaderProgram);


    var golImage = context.createTexture();
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D,golImage);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.REPEAT);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.REPEAT);
    var golData = new Uint8Array(new Array(canvas.width*canvas.height));
    for(var i=0;i<golData.length;i++) {
        golData[i] = Math.random() < (1/10) ? 255 : 0;
    }
    context.texImage2D(context.TEXTURE_2D, 0, context.LUMINANCE, canvas.width, canvas.height, 0, context.LUMINANCE, context.UNSIGNED_BYTE,golData);



    context.uniform1i(context.getUniformLocation(shaderProgram,"sampler"), 0);
    context.uniform2f(context.getUniformLocation(shaderProgram,"dims"), canvas.width, canvas.height);


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

    function redraw() {
        context.drawArrays(context.TRIANGLE_STRIP, 0, vertexPositionBuffer.itemCount);
        context.copyTexImage2D(context.TEXTURE_2D, 0, context.RGBA, 0, 0, canvas.width, canvas.height, 0);
    }

    window.setInterval(redraw, 1000 / FPS);
});


