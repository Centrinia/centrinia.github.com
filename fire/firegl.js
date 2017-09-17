'use strict';

const DIEOFF = 1-1.5e-2;
const WIND_AVERAGE_UP = 0.75;
const WIND_AVERAGE = 0.05;
const WIND_MAX = 0.5;
const WIND_MAX_UP = 0.1;
const WIND_WALK = 1e-2;
const WIND_WALK_UP = 2e-2;

const FPS = 60.0;
const CANDLES = 24;
const FLAME_WIDTH = 0.8;

function getShader(gl, id) {
    let shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    let str = "";
    let k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    let shader;
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

function randomRayleigh(sigma) {
    return sigma * Math.sqrt(-2 * Math.log(Math.random()));
}

function randomNormal(mu, sigma) {
    randomNormal.generate = !randomNormal.generate;
    if(!randomNormal.generate) {
        return randomNormal.z1 * sigma + mu;
    }
    let u1, u2;
    do {
        u1 = Math.random();
        u2 = Math.random();
    } while(u1 == 0.0);
    let R = Math.sqrt(-2.0 * Math.log(u1));
    let Theta = 2.0 * Math.PI * u2;
    randomNormal.z0 = R * Math.cos(Theta);
    randomNormal.z1 = R * Math.sin(Theta);

    return randomNormal.z0 * sigma + mu;
}



window.onload = (function () {
	let canvas = document.getElementById('canvas');
	let context = canvas.getContext('webgl');
    if(!context) {
        context = canvas.getContext('experimental-webgl');
    }
    if(!context) {
        alert('WebGL unavailable.');
        return;
    }

	// Set up the shaders.
	let fragmentShader = getShader(context, 'shader-fragment');
	let vertexShader = getShader(context, 'shader-vertex');
	let shaderProgram = context.createProgram();

	context.attachShader(shaderProgram, vertexShader);
	context.attachShader(shaderProgram, fragmentShader);
	context.linkProgram(shaderProgram);
	context.useProgram(shaderProgram);


    let color0 = [2.7,0.5,0.3,-0.5];
    let color1 = [3,1.2,0.7,5];
    let wind = [0.8, 0, 0.1, 0.1];

    let lineData = new Uint8Array(new Array(canvas.width));
    let lineImage = context.createTexture();
    context.activeTexture(context.TEXTURE1);
    context.bindTexture(context.TEXTURE_2D,lineImage);
    context.texImage2D(context.TEXTURE_2D, 0, context.LUMINANCE, canvas.width, 1, 0, context.LUMINANCE, context.UNSIGNED_BYTE, lineData);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.REPEAT);
    context.uniform1i(context.getUniformLocation(shaderProgram,"line"), 1);

    let flameImage = context.createTexture();
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D,flameImage);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    let flameData = new Uint8Array(new Array(canvas.width*canvas.height*4));
    for(let i=0;i<flameData.length;i++) {
        flameData[i] = 0;
    }
    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, canvas.width, canvas.height, 0, context.RGBA, context.UNSIGNED_BYTE,flameData);

    context.uniform1i(context.getUniformLocation(shaderProgram,"sampler"), 0);
    context.uniform2f(context.getUniformLocation(shaderProgram,"dims"), canvas.width, canvas.height);
    context.uniform4fv(context.getUniformLocation(shaderProgram,"color0"), color0);
    context.uniform4fv(context.getUniformLocation(shaderProgram,"color1"), color1);
    context.uniform1f(context.getUniformLocation(shaderProgram,"dieoff"), DIEOFF);


	// Bind the rectangle.
	let vertexes = [
		0,0,
		0,1,
		1,0,
		1,1
			];
	let vertexPositionBuffer = context.createBuffer();
	vertexPositionBuffer.itemSize = 2;
	vertexPositionBuffer.itemCount = 4;
	context.bindBuffer(context.ARRAY_BUFFER, vertexPositionBuffer);
	context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexes), context.STATIC_DRAW);


	shaderProgram.vertexPositionAttribute = context.getAttribLocation(shaderProgram, "aVertexPosition");
	context.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	context.bindBuffer(context.ARRAY_BUFFER, vertexPositionBuffer);
	context.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, context.FLOAT, false, 0, 0);

    
    const candle_width = canvas.width / CANDLES;
    const candle_offset = candle_width * (FLAME_WIDTH) / 2;

    let walker = 0.0;
    let walker_up = 0.0;
    function redraw() {
        context.uniform4fv(context.getUniformLocation(shaderProgram,"wind"), wind);
        
        context.clear(context.COLOR_BUFFER_BIT);
        for(var i=0;i<canvas.width;i++) {
            if((candle_width/2 + i) % candle_width < FLAME_WIDTH*candle_width) {
                lineData[i] = randomRayleigh(10)*255;
            } else {
                lineData[i] = 0;
            }
        }
        context.activeTexture(context.TEXTURE1);
        context.texImage2D(context.TEXTURE_2D, 0, context.LUMINANCE, canvas.width, 1, 0, context.LUMINANCE, context.UNSIGNED_BYTE, lineData);

        context.drawArrays(context.TRIANGLE_STRIP, 0, vertexPositionBuffer.itemCount);
        context.activeTexture(context.TEXTURE0);
        context.copyTexImage2D(context.TEXTURE_2D, 0, context.RGBA, 0, 0, canvas.width, canvas.height, 0);


        walker += (Math.random() - 0.5) * WIND_WALK*2;
        walker = Math.min(Math.max(walker, -WIND_MAX_UP), WIND_MAX_UP);

        walker_up += (Math.random() - 0.5) * WIND_WALK_UP*2;
        walker_up = Math.min(Math.max(walker_up, -WIND_MAX_UP), WIND_MAX_UP);

        wind[0] = WIND_AVERAGE_UP + walker_up;
        wind[2] = WIND_AVERAGE + walker;
        wind[3] = WIND_AVERAGE - walker;
        console.log(walker,walker_up);
    }

    window.setInterval(redraw, 1000 / FPS);
});


