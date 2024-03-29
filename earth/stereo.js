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

function cabs(a) {
	return Math.sqrt(a[0]*a[0]+a[1]*a[1]);
}
function cneg(a) {
	return [-a[0],-a[1]];
}
let cadd = add;
let csub = sub;
function csqr(a) {
	return [a[0]*a[0] - a[1]*a[1], 2*a[0]*a[1]];
}
function cmul(a,b) {
	return [a[0]*b[0] - a[1]*b[1], a[1]*b[0] + a[0]*b[1]];
}
function cdiv(a,b) {
	let t = b[0]*b[0] + b[1]*b[1];
	return [(a[0]*b[0] + a[1]*b[1])/t, (a[1]*b[0] - a[0]*b[1])/t];
}
function cmul_i(z) {
	return [-z[1],z[0]];
}
function cexp(z) {
	return scale(Math.exp(z[0]),[Math.cos(z[1]),Math.sin(z[1])]);
}
function crecip(z) {
	let t = z[0] * z[0] + z[1] * z[1];
	return [z[0]/t,-z[1]/t];
}
function ccos(z) {
	let t = cexp(cmul_i(z));
	return scale(1/2,add(t,crecip(t)));
}
function vartheta2(z,tau) {
	const ITERATIONS=128;
	const TOL_SQ=1e-10;
	let s = [0,0];
	let z2 = scale(Math.PI*2, z);
	let tau2 = scale(Math.PI,cmul_i(tau));
	for(let k=1;k<ITERATIONS;k++) {
		let s_k = cmul(
			cexp(scale(k*k,tau2)),
			ccos(scale(k,z2))
		);
		if(dot(s_k,s_k) <= TOL_SQ) {
			break;
		}
		s = add(s,s_k);
	}
	s = scale(2,s);
	s[0] += 1;
	return s;
}
function vartheta(z,tau) {
	let b = -Math.floor(z[1] / tau[1] + 1/2);
	let z2 = add(z , scale(b,tau));
	let a = -Math.floor(z2[0] +1/2);
	let z3 = z2;
	z3[0] += a;

	return cmul(
		vartheta2(z3,tau),
		cexp(scale(Math.PI * b , cmul_i(add(scale(b, tau) , scale(2, z)))))
	);
}

function vartheta_00(z, tau) {
	return vartheta(z,tau);
}
function vartheta_11(z, tau) {
	let t = add(scale(1/4,tau), z);
	t[0] -= 1/2;
	t = scale(Math.PI,cmul_i(t));
	let B = cexp(t);
	return cmul(
		B,
		vartheta(cadd(z,scale(1/2,[tau[0]+1,tau[1]])),tau)
	);
}
function vartheta_01(z, tau) {
	return vartheta([z[0]+1/2,z[1]],tau);
}
function vartheta_10(z, tau) {
	let t = add(scale(1/4,tau), z);
	t = scale(Math.PI,cmul_i(t));
	let B = cexp(t);
	return cmul(
		B,
		vartheta(cadd(z,scale(1/2,tau)),tau)
	);
}
function sd(z,tau) {
	let v_00_0 = vartheta_00([0,0], tau);
	let v_10_0 = vartheta_10([0,0], tau);
	let v_01_0 = vartheta_01([0,0], tau);

	let v_00_z = vartheta_00(z, tau);
	let v_01_z = vartheta_01(z, tau);
	let v_11_z = vartheta_11(z, tau);

	let sn = cneg(cdiv(cmul(v_00_0 , v_11_z) , cmul(v_10_0 , v_01_z)));
	let dn = cdiv(cmul(v_01_0 , v_00_z) , cmul(v_00_0 , v_01_z));

	return cdiv(sn, dn);
}
function cm_sm(z,tau) {
	const M_CBRT2 = 1.2599210498948731647672106072782283506;
	const theta = [0.3406250193166066401943942440378308889772 , 1.271229878418706239135612991021064976728];
	const pi3 = 5.2999162508563498719410684989453161077;
	//let u = (z + pi3 / 6) / (M_CBRT2 * theta);
	let u = cdiv(cadd(z , [pi3 / 6,0]) , scale(M_CBRT2 , theta));

	let v_00_0 = vartheta_00([0,0], tau);
	let v_10_0 = vartheta_10([0,0], tau);
	let v_01_0 = vartheta_01([0,0], tau);
	let z2 = cdiv(u,scale(Math.PI, csqr(v_00_0)));

	let v_00_z = vartheta_00(z2, tau);
	let v_10_z = vartheta_10(z2, tau);
	let v_01_z = vartheta_01(z2, tau);
	let v_11_z = vartheta_11(z2, tau);

	let sn = cneg(cdiv(cmul(v_00_0 , v_11_z) , cmul(v_10_0 , v_01_z)));
	let cn = cdiv(cmul(v_01_0 , v_10_z) , cmul(v_10_0 , v_01_z));
	let dn = cdiv(cmul(v_01_0 , v_00_z) , cmul(v_00_0 , v_01_z));

	//let xi = (-1 + theta *sn*cn*dn) / (1+theta*sn*cn*dn);
	let tscd = cmul(theta ,cmul(sn,cmul(cn,dn)));
	let xi = cdiv(cadd([-1,0], tscd),cadd([1,0] , tscd));
	let eta = scale(M_CBRT2 , cdiv(csqr(cadd([1,0], csqr(cmul(theta,sn)))),cadd([1,0] , tscd)));

	return scale(2, cmul(xi,eta));
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
    //var rotationQuaternion = [1,0,0,0];
    //var u_displacement = 2.0;

    var sphereCenter = [0,0,0];
    var sphereRadius = 1.0;


    /* Find the intersection between the sphere and the view vector at the given pixel coordinates. */
    let intersectSphere_sinusoidal = function (coords) {
		let R = sphereRadius;
        let XY = [coords[0], coords[1]];
        XY = scale(u_displacement/2,XY);
		/*
				float vartheta = XY.y;
				float lambda = XY.x / cos(vartheta);
		 */
		let vartheta = XY[1];
		let lambda = XY[0] / Math.cos(vartheta);

		if(!(Math.abs(lambda) < Math.PI && Math.abs(vartheta) < Math.PI/2)) {
			return null;
		}
		let p = [Math.cos(lambda) * Math.cos(vartheta),Math.sin(lambda) * Math.cos(vartheta), Math.sin(vartheta)];
        return p;
    };

    let intersectSphere_mercator = function (coords) {
		let R = sphereRadius;
        let XY = [coords[0], coords[1]];
        XY = scale(u_displacement/2,XY);
				
		/*
				float lambda = XY.x / R;
				float theta = 2.0 * atan(exp(XY.y/R)) - M_PI / 2.0;

                vec3 p = vec3(vec2(cos(lambda), sin(lambda))*cos(theta),sin(theta));
		*/

		let lambda = XY[0] / R;
		let vartheta = 2 * Math.atan(Math.exp(XY[1]/R)) - Math.PI / 2;

		let p = [Math.cos(lambda) * Math.cos(vartheta),Math.sin(lambda) * Math.cos(vartheta), Math.sin(vartheta)];
        return p;
    };
    let intersectSphere_quincuncial = function (coords) {
		let R = sphereRadius;
        let XY = [coords[0], coords[1]];
        XY = scale(u_displacement/2,XY);

		XY[0] *= -1;

		/*
				vec2 z = sd(XY * M_SQRT2, vec2(0.0,1.0)) / M_SQRT2;
				float abs_sq =z.x*z.x + z.y*z.y;
				vec3 p = vec3(2.0 * z, abs_sq-1.0) / (1.0 + abs_sq);
		*/
		let t = [0,0];

		for(let k=0;k<t.length;k++) {
			t[k] = ((XY[k]+Math.SQRT2)%(2*Math.SQRT2)) - Math.SQRT2;
		}


		let z = scale(1/Math.SQRT2,sd(scale(Math.SQRT2, t), [0, 1]));
        let p = [z[0]*2,z[1]*2,0];
		let abs_sq = dot(z,z);
        p[2] = abs_sq - 1;

        p = scale(1/(1+abs_sq), p);
		return p;
	};


    let intersectSphere_lee_conformal = function (coords) {
		const tau = [-0.5, 0.8660254037844386467637231707529361834714];
		let R = sphereRadius;
        let XY = [coords[0], coords[1]];
        XY = scale(u_displacement/2,XY);
		//XY[0] *= -1;
		XY = [XY[1],XY[0]];
		/*
			XY.x = -XY.x;
				vec2 tau = vec2(-0.5, 0.8660254037844386467637231707529361834714);
				vec2 z = cm_sm(XY, tau) / 1.781797436280678609480452411181025015974;
		*/
		let z = scale(1/1.781797436280678609480452411181025015974, cm_sm(XY, tau));

		/*
				float lambda = atan(z.y, z.x);
				float vartheta = (M_PI/4.0 - atan(length(z)))*2.0;
		*/
		/*let lambda = Math.atan2(z[1], z[0]);
		let vartheta = (Math.PI / 4 - Math.atan(cabs(z))) * 2;
		let p = [Math.cos(lambda) * Math.cos(vartheta),Math.sin(lambda) * Math.cos(vartheta), Math.sin(vartheta)];
		*/
        let p = [z[0]*2,z[1]*2,0];
		let abs_sq = dot(z,z);
        p[2] = abs_sq - 1;

        p = scale(1/(1+abs_sq), p);
		

		return p;
	};

    let intersectSphere_mollweide = function (coords) {
		let R = sphereRadius;
        let XY = [coords[0], coords[1]];
        XY = scale(u_displacement/2,XY);
		let beta = Math.asin(XY[1] / (R*Math.SQRT2));
		let vartheta = Math.asin((2*beta + Math.sin(2*beta)) / Math.PI);
		let lambda = Math.PI * XY[0] / (2 * R * Math.SQRT2 * Math.cos(beta));
		/*			
					float beta = asin(XY.y / (R * M_SQRT2));
					float vartheta2 = (2.0*beta + sin(2.0*beta)) / M_PI;
					float vartheta = asin(vartheta2);

					float lambda = M_PI * XY.x / (2.0*R*M_SQRT2 * cos(beta));
		
					if(!((-M_PI <= lambda) && (lambda < M_PI))) {
						discard;
					}
					vec3 p = vec3(vec2(cos(lambda), sin(lambda))*cos(vartheta),sin(vartheta));
		*/
		//if(!(Math.abs(lambda) < 2*Math.PI && Number.isFinite(lambda) && Number.isFinite(vartheta))) {
		


		if(!(Number.isFinite(lambda) && Number.isFinite(vartheta))) {
			return null;
		}
		let p = [Math.cos(lambda) * Math.cos(vartheta),Math.sin(lambda) * Math.cos(vartheta), Math.sin(vartheta)];
        return p;
	}
    let intersectSphere_stereographic = function (coords) {
        var XY = [coords[0], coords[1]];
        XY = scale(u_displacement/2,XY);
        var p = scale(2,XY);
        p[2] = 1-dot(XY,XY);
        p = scale(1/(1+dot(XY,XY)), p);

		/*
		 
                vec2 XY = v_position*u_displacement / 2.0;
                vec3 p =  vec3(2.0 * XY, 1.0 - dot(XY,XY));

                p /= 1.0 + dot(XY,XY);
		*/
        return p;
    };
	
	let projections = {
		"mollweide": {
			"intersectSphere": intersectSphere_mollweide,
			"initialDisplacement": 6.0,
			"initialRotation": [1,1,0,0],
		},
		"mercator": {
			"intersectSphere": intersectSphere_mercator,
			"initialDisplacement": 6.0,
			"initialRotation": [1,1,0,0],
		},
		"sinusoidal": {
			"intersectSphere": intersectSphere_sinusoidal,
			"initialDisplacement": 7.0,
			"initialRotation": [1,1,0,0],
		},

		"quincuncial": {
			"intersectSphere": intersectSphere_quincuncial,
			"initialDisplacement": 1.0,
			"initialRotation": [-1,1,1,-1],
		},

		"lee_conformal": {
			"intersectSphere": intersectSphere_lee_conformal,
			"initialDisplacement": 1.0,
			"initialRotation": [0,1,1,0],
		},


		"stereographic": {
			"intersectSphere": intersectSphere_stereographic,
			"initialDisplacement": 2.0,
			"initialRotation": [1,0,0,0],
		}

	};

	let intersectSphere = projections[projectionType]["intersectSphere"];
	let rotationQuaternion = normalize(projections[projectionType]["initialRotation"]);
	let u_displacement = projections[projectionType]["initialDisplacement"];



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

    gl.uniform4fv(shader.u_rotation, rotQuat(rotationQuaternion));
    queueRedraw();
};

