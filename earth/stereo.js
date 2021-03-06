/* stereo.js */

"use strict";

var FRAME_INTERVAL = 1000.0 / 30;
var MIN_DISPLACEMENT = 1e-2;
var MAX_DISPLACEMENT = 1e2;

function getMousecoord(event) {
    var elem = event.target || event.srcElement;
    var rect = elem.getBoundingClientRect();
    return [2*(event.clientX - rect.left) / elem.width-1,
        1-2*(event.clientY - rect.top) / elem.height];
}

function vectorDivide(a, b) {
    var c = [0,0,0,0];
    c[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    c[1] = a[2] * b[1] - a[1] * b[2];
    c[2] = a[0] * b[2] - a[2] * b[0];
    c[3] = a[1] * b[0] - a[0] * b[1];
    return c;
}

function cross(a, b) {
    var c = [0,0,0];
    c[0] = a[1] * b[2] - a[2] * b[1];
    c[1] = - (a[0] * b[2] - a[2] * b[0]);
    c[2] = a[0] * b[1] - a[1] * b[0];
    
    return c;
}
function quaternionApply(q, v) {
// v +  2.0 * cross(cross(v, q.xyz) + q.w * v, q.xyz);
    return add(v, scale(2, 
        cross(
            add(cross(v, q.slice(1)), scale(q[0], v)),
            q.slice(1)
            )
        ));
}
function norm(a) {
    var n = 0;
    for(var i=0;i<a.length;i++) {
        n += a[i] * a[i];
    }
    return Math.sqrt(n);
}
function quaternionInverse(a) {
    var c = a.slice(0);
    var n = dot(a,a);
    c = scale(-1/(n*n), c);
    c[0] = -c[0];
    return c;
}
/* The basis vectors of quaternions are [1, e3*e2, e1*e3, e2*e1] = [1, -e3*e2,e1*e3, -e2*e1] */
function quaternionMultiply(a, b) {
    var c = [0,0,0,0];

    c[0] = a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3];
    c[1] = a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2];
    c[2] = a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1];
    c[3] = a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0];
    return c;
}

function dot(a,b) {
    var c = 0;
    for(var i = 0; i < a.length; i++) {
        c += a[i] * b[i];
    }
    return c;
}
function scale(a,b) {
    var c = [];
    for(var i = 0; i < b.length; i++) {
        c[i] = a * b[i];
    }
    return c;
}
function add(a,b) {
    var c = [];
    for(var i = 0; i < a.length; i++) {
        c[i] = a[i] + b[i];
    }
    return c;
}
function sub(a,b) {
    var c = [];
    for(var i = 0; i < a.length; i++) {
        c[i] = a[i] - b[i];
    }
    return c;
}
function normalize(v) {
    var n = 0.0;
    var y = v.slice(0);
    for(var i=0;i<v.length;i++) {
        n += v[i] * v[i];
    }
    
    if(n > 0.0) {
        n = Math.sqrt(n);
        for(var i=0;i<v.length;i++) {
            y[i] /= n;
        }
    }
    return y;
}
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

    var ready = false;
    var load_cubemap = function (prefix) {
        var SUFFIX = ".jpg";
        var FACES = [["posx", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            ["negx", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
            ["posy", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            ["negy", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
            ["posz", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            ["negz", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP,texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        var loaded = 0;
        for(var i=0;i<FACES.length;i++) {
            var filename = prefix + FACES[i][0] + SUFFIX;
            var face = FACES[i][1];
            var image = new Image();
            image.onload = function(texture,face,image) {
                return function() {
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    loaded ++;
                    if(loaded == FACES.length) {
                        ready = true;
                    }
                };
            } (texture,face,image);
            image.src = filename;
        }
        return texture;
    }
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

        shaderProgram.u_displacement = gl.getUniformLocation(shaderProgram, 'u_displacement');
        shaderProgram.u_rotation = gl.getUniformLocation(shaderProgram, 'u_rotation');
        shaderProgram.u_radius = gl.getUniformLocation(shaderProgram, 'u_radius');
        shaderProgram.u_center = gl.getUniformLocation(shaderProgram, 'u_center');
        shaderProgram.a_position = gl.getAttribLocation(shaderProgram, 'a_position');
        gl.enableVertexAttribArray(shaderProgram.a_position);
        gl.vertexAttribPointer(shaderProgram.a_position, 2, gl.FLOAT, false, 0, 0);

        shaderProgram.u_cubemap = gl.getUniformLocation(shaderProgram, 'u_cubemap');
        
        gl.uniform1i(shaderProgram.u_cubemap, 0);
        gl.uniform4fv(shaderProgram.u_rotation, rotQuat(rotationQuaternion));
        gl.uniform1f(shaderProgram.u_displacement, u_displacement);
        gl.uniform1f(shaderProgram.u_radius, sphereRadius);
        gl.uniform3fv(shaderProgram.u_center, sphereCenter);

        load_cubemap('textures/');
        //load_cubemap('http://www.humus.name/Textures/Tantolunden4/');

        return shaderProgram;
    };

    var rotQuat = function (q) {
        return [q[1], q[2], q[3], q[0]];
    };
    //var rotationQuaternion = [0,0,0,1];
    var rotationQuaternion = [1,0,0,0];
    var u_displacement = 2.0;

    var sphereCenter = [0,0,0];
    var sphereRadius = 1.0;


    var showQuaternion = function (q) {
        return q;
    };

    var queueRedraw = function () {
        if(!redrawing) {
            redrawing = true;
            window.setTimeout(function () {
                redraw();
                redrawing = false;
            }, FRAME_INTERVAL);
        }
    };

    var shader;
    shader = init_gl();
    var init_draw = function () {
        if(ready) {
            redrawing = false;
            queueRedraw();
        } else {
            window.setTimeout(init_draw,FRAME_INTERVAL);
        }
    };

    init_draw();



    var redrawing = false;
    var redraw = function () {
        if(ready) {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    };
    


    /* Find the intersection between the sphere and the view vector at the given pixel coordinates. */
    var intersectSphere = function (coords) {
        var XY = [coords[0], coords[1]];
        XY = scale(u_displacement/2,XY);
        var p = scale(2,XY);
        p[2] = 1-dot(XY,XY);
        p = scale(1/(1+dot(XY,XY)), p);
        return p;
    };
    var makeVector = function (coords) {
        return intersectSphere(coords);
    }
    var previousVector = null;
    var onmove = function (coords) {
        var p = makeVector(coords);
        if(p) {
            p = sub(p, sphereCenter);

            var p1 = normalize(add(p,previousVector));
            var deltaQuaternion = vectorDivide(p1, previousVector);
            rotationQuaternion = quaternionMultiply(deltaQuaternion, rotationQuaternion);
            rotationQuaternion = normalize(rotationQuaternion);

            gl.uniform4fv(shader.u_rotation, rotQuat(rotationQuaternion));

            queueRedraw();

            previousVector = p;
        } else {
            previousVector = null;
        }
        event.preventDefault();
    }
	canvas.ontouchmove = function (event) {
        if(previousVector) {
            var coords = getMousecoord(event.touches[0]);

            onmove(coords);
        }
        event.preventDefault();
	};
	canvas.onmousemove = function (event) {
        var coords = getMousecoord(event);
        if(previousVector) {
            onmove(coords);
        }
        event.preventDefault();
	};
	canvas.onmousewheel = function (event) {
		if(!event) {
			event = window.event;
		}

		var delta = 0;
		if(event.wheelDelta) {
			delta = event.wheelDelta/120;
		} else if(event.detail) {
			delta = event.detail/(-3);
		} else if(event.deltaY) {
			delta = event.deltaY/(-3);
        }
        console.log(delta);
		var t = u_displacement * Math.pow(1.1,delta);
		if(MIN_DISPLACEMENT < t && t < MAX_DISPLACEMENT) {
			u_displacement = t;
		}

        gl.uniform1f(shader.u_displacement, u_displacement);
        queueRedraw();

		event.preventDefault();
	}
	canvas.DOMMouseScroll = canvas.onmousewheel;
	canvas.onwheel = canvas.onmousewheel;

    canvas.ontouchend = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.onmouseleave = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.ontouchcancel = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.ontouchleave = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.onmouseup = function (event) {
        previousVector = null;
        event.preventDefault();
    };

    var ondown = function (coords) {
        previousVector = makeVector(coords);
        if(previousVector) {
            previousVector = sub(previousVector, sphereCenter);
        }
    };
    canvas.onmousedown = function (event) {
        var coords = getMousecoord(event);
        ondown(coords);
        event.preventDefault();
    };
    canvas.ontouchstart = function (event) {
        var coords = getMousecoord(event.touches[0]);
        ondown(coords);
        event.preventDefault();
    };

    rotationQuaternion = normalize([1,0,0,0]);
    gl.uniform4fv(shader.u_rotation, rotQuat(rotationQuaternion));
    queueRedraw();
};

