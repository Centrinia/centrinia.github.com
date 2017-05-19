/* mandelgl.js */

"use strict";

function getShader(gl, id, str2) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = '';
    var k = shaderScript.firstChild;
    if(str2) {
        str += str2;
    }
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

window.onload = function () {
    var canvas = document.getElementById('canvas');
    var gl = canvas.getContext('webgl');
	var extents = {'left':-2.0,'right':1.0,'top':-1,'bottom':1};

    var init_gl = function () {
        var fs_prologue = 'precision mediump float;\n';
        var fragmentShader = getShader(gl, 'shader-fragment', fs_prologue);
        var vertexShader = getShader(gl, 'shader-vertex');
        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);


        /* Draw a screen-filling rectangle. */
        var positionArray = [
            /* Upper right triangle */
            -1,-1,
            1,-1,
            1,1,
            /* Lower left triangle */
            -1,-1,
            1,1,
            -1,1
            ];
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionArray), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(shaderProgram.a_position);
        gl.vertexAttribPointer(shaderProgram.a_position, 2, gl.FLOAT, false, 0, 0);


        return shaderProgram;
    };

    var shaderProgram = init_gl();
    var t = 0;

	var pending = null;
	canvas.onmousedown = function(event) {
		var x = event.pageX - this.offsetLeft;
		var y = event.pageY - this.offsetTop;

		var cx = (x / canvas.width)*(extents['right']-extents['left']) + extents['left'];
		var cy = (y / canvas.height)*(extents['bottom']-extents['top']) + extents['top'];

		pending = {'x':cx,'y':cy,'ox':x,'oy':y};
	};
	canvas.onmouseup = function(event) {
		if(pending) {
            var x = event.pageX - this.offsetLeft;
            var y = event.pageY - this.offsetTop;

            var cx = (x / canvas.width)*(extents['right']-extents['left']) + extents['left'];
            var cy = (y / canvas.height)*(extents['bottom']-extents['top']) + extents['top'];
			extents = {'left':pending['x'],'top':pending['y'],'right':cx,'bottom':cy};
			pending = null;
            redraw();
		}
	};
    var reset_button = document.getElementById('reset_button');
    reset_button.onclick = function(event) {
		extents = {'left':-2.0,'right':1.0,'top':-1,'bottom':1};

        redraw();
		event.preventDefault();
	};

    var redraw = function () {
        gl.uniform2f(gl.getUniformLocation(shaderProgram,'corner0'),  extents['left'], extents['bottom'])
        gl.uniform2f(gl.getUniformLocation(shaderProgram,'corner1'),  extents['right'], extents['top'])

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    redraw();
};

