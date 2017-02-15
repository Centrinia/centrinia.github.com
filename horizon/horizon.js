/* maze3.js */

'use strict';

var config = {
	'key bindings' : [
		{
			'binding': 'move forward',
			'key' : 'w key',
			'modifiers' : []
		},
		{
			'binding': 'move left',
			'key' : 'a key',
			'modifiers' : []
		},
		{
			'binding': 'move backward',
			'key' : 's key',
			'modifiers' : []
		},

		{
			'binding': 'move right',
			'key' : 'd key',
			'modifiers' : []
		},
		{
			'binding': 'look up',
			'key' : 'up cursor key',
			'modifiers' : []
		},
		{
			'binding': 'look down',
			'key' : 'down cursor key',
			'modifiers' : []
        },
		{
			'binding': 'turn left',
			'key' : 'left cursor key',
			'modifiers' : []
		},
		{
			'binding': 'turn right',
			'key' : 'right cursor key',
			'modifiers' : []
		},
		{
			'binding': 'roll left',
			'key' : 'q key',
			'modifiers' : []
		},
		{
			'binding': 'roll right',
			'key' : 'e key',
			'modifiers' : []
		}

		/*{
			'binding': 'turn left',
			'key' : 'left cursor key',
			'modifiers' : []
		},
		{
			'binding': 'move forward',
			'key' : 'up cursor key',
			'modifiers' : []
		},
		{
			'binding': 'turn right',
			'key' : 'right cursor key',
			'modifiers' : []
		},
		{
			'binding': 'move backward',
			'key' : 'down cursor key', 
			'modifiers' : []
		},
		{
			'binding': 'move left',
			'key' : 'left cursor key',
			'modifiers' : ['alt key']
		},
		{
			'binding': 'move up',
			'key' : 'up cursor key',
			'modifiers' : ['alt key']
		},
		{
			'binding': 'move right',
			'key' : 'right cursor key',
			'modifiers' : ['alt key']
		},
		{
			'binding': 'move down',
			'key' : 'down cursor key',
			'modifiers' : ['alt key']
		},
		{
			'binding': 'look up',
			'key' : 'up cursor key',
			'modifiers' : ['shift key']
		},
		{
			'binding': 'look down',
			'key' : 'down cursor key',
			'modifiers' : ['shift key']
        }*/
    ],
    'keycodes' : {
        'modifiers' : {
            16 : 'shift key',
            17 : 'ctrl key',
            18 : 'alt key'
        },
        'keys' : {
            87 : 'w key',
            65 : 'a key',
            83 : 's key',
            68 : 'd key',
            81 : 'q key',
            69 : 'e key',
            37 : 'left cursor key',
            38 : 'up cursor key',
            39 : 'right cursor key',
            40 : 'down cursor key'
        }
    },
	'movement' : {
		'strafe distance' : 2.5,
		'forward distance' : 3.5,
		'backward distance' : 2.3,
		'vertical distance' : 1.5,
		'roll angle' : 2, // In degrees.
		'turn angle' : 6, // In degrees.
		'mouse turn angle' : 0.2 // In degrees.
	},
    'momentum decay': 0.7,
    'animation duration': 3,
    'key refresh' : 12,
    'fps': 35
};

var make_polygons = function() {
    var normals = [
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0]
    ];

    var t = 0;
    var positions = [
        [1,0,0,t],
        [0,0,1,t],
        [-1,0,0,t],
        [0,0,-1,t],
        [0,1,0,1]
    ];
    var indices = [
/*        [4,0,1],
        [4,1,2],
        [4,2,3],
        [4,3,0],

        [0,4,1],
        [1,4,2],
        [2,4,3],
        [3,4,0]
*/
        [0,1,4],
        [0,4,1],


        //[0,1,2],
        //[2,1,3]
    ];

    var flatten = function (arr) {
        var out = [];
        for(var i=0;i<arr.length;i++) {
            for(var j=0;j<arr[i].length;j++) {
                out.push(arr[i][j]);
            }
        }
        return out;
    };


    /*vertices = [].concat.apply([], vertices);
    vertices = [].concat.apply([], vertices);*/
    indices = flatten(indices);
    positions = flatten(positions);
    normals = flatten(normals);

    return {
        'vertex count': indices.length,
        'indices': new Uint16Array(indices),
        'positions': new Float32Array(positions),
        'normals': new Float32Array(normals)
    };
};

$(document).ready(function () {
    var canvas = document.getElementById('canvas');
    var gl = canvas.getContext('webgl');
    if(!gl) {
        gl = canvas.getContext('experimental-webgl');
    }
    if(!gl) {
        console.log('WebGL not available');
        alert('WebGL not available');
        return;
    }

    var init_gl = function() {

        $.when.apply(null, [
            $.ajax('shaders/vertex.glsl'),
            $.ajax('shaders/fragment.glsl'),
        ]).then(function (vertex, fragment,image) {
            /* Initialize the shader program. */
            var program = {};
            program['uniform locations'] = {};
            program['attribute locations'] = {};

            var compile_shader = function(type, source) {
                var shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    throw new Error('Compile error: ' + gl.getShaderInfoLog(shader));
                }
                return shader;
            }

            program.id = gl.createProgram();

            /* Compile and attach the vertex shader. */
            var vertex_shader = compile_shader(gl.VERTEX_SHADER, vertex[0]);
            gl.attachShader(program.id, vertex_shader);

            /* Compile and attach the fragment shader. */
            var fragment_shader = compile_shader(gl.FRAGMENT_SHADER, fragment[0]);
            gl.attachShader(program.id, fragment_shader);

            gl.linkProgram(program.id);
            if(!gl.getProgramParameter(program.id, gl.LINK_STATUS)) {
                throw new Error('Link error: ' + gl.getProgramInfoLog(program.id));
            }

            gl.useProgram(program.id);


            var match;
            /* Get the uniform locations. */
            var regex = /uniform (\w+) (\w+)/g;
            var shader_code = vertex[0] + '\n' + fragment[0];
            while((match = regex.exec(shader_code)) != null) {
                var name = match[2];
                program['uniform locations'][name] = gl.getUniformLocation(program.id, name);
            }
            /* Get the attribute locations. */
            var regex = /attribute (\w+) (\w+)/g;
            var shader_code = vertex[0];
            while((match = regex.exec(shader_code)) != null) {
                var name = match[2];
                var loc = gl.getAttribLocation(program.id, name);
                program['attribute locations'][name] = loc;
                if(loc >= 0) {
                    gl.enableVertexAttribArray(loc);
                }
            }
            return program;
        }).then(function (program) {

            /* Fill the vertex buffer. */

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            state['shader program'] = program;
            var polygons = make_polygons();

            state['polygons'] = polygons;

            program['vertex position buffer'] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, program['vertex position buffer']);
            gl.bufferData(gl.ARRAY_BUFFER, polygons['positions'], gl.STATIC_DRAW);
            gl.vertexAttribPointer(program['attribute locations']['a_position'], 4, gl.FLOAT, false, 0, 0);

            program['index buffer'] = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program['index buffer']);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, polygons['indices'], gl.STATIC_DRAW);
        
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


            var image = new Image();
            var texture = gl.createTexture();
            image.onload = function() {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.activeTexture(gl.TEXTURE0);
                gl.uniform1i(program['uniform locations']['u_sampler'], 0);
            };
            image.src = 'textures/birds.png';

            program['texture'] = texture;


            //gl.clearColor(0,0,0,1);
            gl.clearColor(1,1,1,1);
            //gl.clearColor(0,0,0,1);
            setInterval(redraw_loop, 1000/config['fps']);

            resize_window(canvas.width, canvas.height);
            /*var ASPECT = canvas.width/canvas.height;
            gl.uniformMatrix4fv(state['shader program']['uniform locations']['u_projection'], false, new Float32Array(perspective_matrix(0.1, 100, 80*Math.PI/180, ASPECT).transpose().coeffs));*/

            state['tickcount'] = 0;
        }).fail(function () {
            throw new Error('Unable to load shaders.');
        });
    }

    var resize_window = function(width, height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, canvas.width, canvas.height);
        var ASPECT = canvas.width/canvas.height;
        gl.uniformMatrix4fv(state['shader program']['uniform locations']['u_projection'], false, new Float32Array(perspective_matrix(0.1, null, 80*Math.PI/180, ASPECT).transpose().coeffs));
    };

    var redraw_loop = function () {
        var program = state['shader program'];

        var offset = ~~(state['tickcount'] / config['animation duration']) % 4;
        gl.uniform1i(state['shader program']['uniform locations']['u_offset'], offset);
        state['tickcount']++;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, program['vertex position buffer']);
        gl.vertexAttribPointer(program['attribute locations']['a_position'], 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program['index buffer']);

        gl.drawElements(gl.TRIANGLES, state['polygons']['vertex count'], gl.UNSIGNED_SHORT, 0);

        state['player'].advance(1/config['fps']);
    };

    var state = {};
    //state['player'] = new Player(Vector.scale(1/2,new Vector([0,0,0])), new Vector([0,-1,0]), new Vector([0,0,1]));
    state['player'] = new Player(new Vector([0,-5,0]), new Vector([0,0,1]), new Vector([0,-1,0]));
    init_gl();

    (function () {
        canvas.requestPointerLock = canvas.requestPointerLock ||
                                    canvas.mozRequestPointerLock ||
                                    canvas.webkitRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock    ||
                                    document.mozExitPointerLock ||
                                    document.webkitExitPointerLock;

        var oldWidth = canvas.width;
        var oldHeight = canvas.height;
        $(canvas).click(function (event) {
            function launchIntoFullscreen(element) {
                if(element.requestFullscreen) {
                    element.requestFullscreen();
                } else if(element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                } else if(element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen();
                } else if(element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                }
            }
            function exitFullscreen(element) {
                if (element.exitFullscreen) {
                    element.exitFullscreen();
                } else if (element.msExitFullscreen) {
                    element.msExitFullscreen();
                } else if (element.mozCancelFullScreen) {
                    element.mozCancelFullScreen();
                } else if (element.webkitExitFullscreen) {
                    element.webkitExitFullscreen();
                }
            };
            var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
            if(fullscreenElement == null) {
                launchIntoFullscreen(canvas);
            } else {
                exitFullscreen(canvas);
            }

        });

        var handle_fullscreen = function () {
            var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
            if(fullscreenElement != null) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                canvas.requestPointerLock();
            } else {
                console.log(oldWidth, oldHeight);
                canvas.width = oldWidth;
                canvas.height = oldHeight;
                document.exitPointerLock();
            }
            resize_window(canvas.width, canvas.height);
        };

        $(document).on('fullscreenchange',handle_fullscreen);
        $(document).on('mozfullscreenchange',handle_fullscreen);
        $(document).on('webkitfullscreenchange',handle_fullscreen);
        var handle_mousemove = function (event) {
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            var change = new Vector([movementX, movementY]);

            if(change.coords[0] != 0) {
                state['player'].look_left(-change.coords[0] * config['movement']['mouse turn angle'] * 2 * Math.PI / 360);
            }
            if(change.coords[1] != 0) {
                state['player'].look_up(-change.coords[1] * config['movement']['mouse turn angle'] * 2 * Math.PI / 360);
            }
        };

        var handle_pointerlock = function(event) {
            if( document.pointerLockElement === canvas ||
                document.mozPointerLockElement === canvas ||
                document.webkitPointerLockElement === canvas
               ) {
                console.log('enter pointerlock');
                document.addEventListener('mousemove',handle_mousemove, false);
            } else {
                document.removeEventListener('mousemove',handle_mousemove, false);
                console.log('exit pointerlock');
            }
        };
        $(document).on('pointerlockchange',handle_pointerlock);
        $(document).on('mozpointerlockchange',handle_pointerlock);
        $(document).on('webkitpointerlockchange',handle_pointerlock);

        var keycode_queue = [];
        $(window).keyup(function (event) {
            event.preventDefault();
            var index = keycode_queue.indexOf(event.which);
            if(index >= 0) {
                keycode_queue.splice(index, 1);
            }
        });
        $(window).keydown(function (event) {
            event.preventDefault();
            var index = keycode_queue.indexOf(event.which);
            if(index < 0) {
                keycode_queue.push(event.which);
            }
        });

        var handle_input = function() {
            var modifiers = [];
            var keys = [];
            keycode_queue.forEach(function (keycode) {
                var key = config['keycodes']['keys'][keycode];
                if(key) {
                    keys.push(key);
                }
                var modifier = config['keycodes']['modifiers'][keycode];
                if(modifier) {
                    modifiers.push(modifier);
                }
            });
			modifiers = modifiers.sort();
			var bindings = [];
			config['key bindings'].forEach(function  (binding) {
				var key_index = keys.indexOf(binding['key']);
				if(key_index >= 0) {
					if(binding['modifiers'].sort().equals(modifiers)) {
						bindings.push(binding);
					}
				}
			});
			bindings.forEach(function (binding) {
			switch(binding['binding']) {
				case 'move left': {
						state['player'].move_left(config['movement']['strafe distance']);
				}
				break;
				case 'move right': {
						state['player'].move_left(-config['movement']['strafe distance']);
				}
				break;
				case 'move up': {
						state['player'].move_up(config['movement']['vertical distance']);
				}
				break;
				case 'move down': {
						state['player'].move_up(-config['movement']['vertical distance']);
				}
				break;
				case 'move forward': {
						state['player'].move_forward(config['movement']['forward distance']);
				}
				break;
				case 'move backward': {
						state['player'].move_forward(-config['movement']['backward distance']);
				}
				break;
				case 'turn left': {
						state['player'].look_left(config['movement']['turn angle'] * 2 * Math.PI / 360);
				}
				break;
				case 'turn right': {
						state['player'].look_left(-config['movement']['turn angle'] * 2 * Math.PI / 360);
				}
				case 'roll left': {
						state['player'].roll_left(config['movement']['roll angle'] * 2 * Math.PI / 360);
				}
				break;
				case 'roll right': {
						state['player'].roll_left(-config['movement']['roll angle'] * 2 * Math.PI / 360);
				}
				break;
				case 'look up': {
                    state['player'].look_up(config['movement']['turn angle'] * 2 * Math.PI / 360);
				}
				break;
				case 'look down': {
                    state['player'].look_up(-config['movement']['turn angle'] * 2 * Math.PI / 360);
				}
				break;
				}
			});

            gl.uniformMatrix4fv(state['shader program']['uniform locations']['u_modelview'], false, new Float32Array(state['player'].camera.modelview().transpose().coeffs));
        };
        setInterval(handle_input, 1000/config['key refresh']);
    }) ();
});

