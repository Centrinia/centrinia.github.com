/* maze3.js */

'use strict';

var config = {
	'key bindings' : [
		{
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
        }
    ],
    'keycodes' : {
        'modifiers' : {
            16 : 'shift key',
            17 : 'ctrl key',
            18 : 'alt key'
        },
        'keys' : {
            37 : 'left cursor key',
            38 : 'up cursor key',
            39 : 'right cursor key',
            40 : 'down cursor key'
        }
    },
	'movement' : {
		'strafe distance' : 0.15,
		'forward distance' : 0.15,
		'backward distance' : 0.13,
		'vertical distance' : 0.15,
		'turn angle' : 6 // In degrees.
	},

    'key refresh' : 12,
    'fps': 35
};

Array.prototype.equals = function (b) {
	if(this.length != b.length) {
		return false;
	}

	for(var i=0;i<this.length;i++) {
		if(this[i] != b[i]) {
			return false;
		}
	}
	return true;
}
function ceil_div(a, b) {
    return ~~((a+b-1) / b);
}

var NDBoolArray = function (dimensions) {
    this.dimensions = dimensions.slice();
    
    this.size = 1;
    for(var i = 0; i < this.dimensions.length; i++) {
        this.size *= this.dimensions[i];
    }

    this.WORD_SIZE = 32;
    this.data = new Uint32Array(ceil_div(this.size, 32));
};


NDBoolArray.prototype.linear_index = function (idx) {
    var index = idx[this.dimensions.length-1];
    for(var i=this.dimensions.length-2;i>=0;i--) {
        index *= this.dimensions[i];
        index += idx[i];
    }
    return index;
};
NDBoolArray.prototype.tuple_index = function (idx) {
    var index = [];

    var j = idx;
    for(var i=0;i<this.dimensions.length;i++) {
        index.push(j % this.dimensions[i]);
        j = ~~(j / this.dimensions[i]);
    }
    return index;
};

NDBoolArray.prototype.get = function (idx) {
    var index = this.linear_index(idx);
    var word_index = ~~(index / this.WORD_SIZE);
    return (this.data[word_index] >> (index % this.WORD_SIZE)) & 1;
};

NDBoolArray.prototype.map = function(func) {
    for(var i=0;i<this.size;i++) {
        var word_index = ~~(i / this.WORD_SIZE);
        var word = this.data[word_index];
        var bit_index = i % this.WORD_SIZE;
        if(((word >> bit_index) & 1) == 0) {
            var idx = this.tuple_index(i);
            func(idx);
        }
    }
};

NDBoolArray.prototype.set = function(idx, bit) {
    var index = this.linear_index(idx);
    var word_index = ~~(index / this.WORD_SIZE);
    var bit_index = index % this.WORD_SIZE;
    var word = this.data[word_index];
    var mask = ~(1 << bit_index);
    this.data[word_index] = (word & mask) | ((bit ? 1 : 0) << bit_index);
};


NDBoolArray.prototype.set_range = function(start, size, value) {
    var array = this;
    var rec = function(index, start, size, value) {
        if(size.length == 0) {
            array.set(index, value);
        } else {
            for(var i=0;i<size[0]; i++) {
                rec(index.concat([i+start[0]]), start.slice(1), size.slice(1), value);
            }
        }
    };

    rec([], start, size, value);
};

var randint = function(a, b) {
    return ~~(Math.random() * (b-a-1))+a;
};

var make_maze = function(dimensions) {
    var maze = new NDBoolArray(dimensions);

    var subdivide = function(maze, start, size,level) {
        var MIN_SIZE = 5;
        /*if(level > 3) {
            return;
        }*/

        var dimension = size.indexOf(Math.max.apply(null, size));
        var make_window = function(maze, dimension, coordinate, start, size) {
            if(!(0 <= coordinate && coordinate < maze.dimensions[dimension])) {
                return;
            }
            
            var range_start = new Array(start.length);
            var range_size = new Array(start.length);

            for(var j=0;j<start.length;j++) {
                if(j != dimension) {
                    range_size[j] = Math.min(randint(0, ~~(size[j]/2)), size[j])+1;
                    range_start[j] = randint(0, size[j] - range_size[j]) +start[j];
                    //Math.floor(Math.random()*(size[j] - range_size[j]-1)) + start[j];
                }
            }
            range_size[dimension] = 1;
            range_start[dimension] = coordinate;
            maze.set_range(range_start, range_size, 0);
        };

        /*for(var i=0;i<start.length;i++) {
            make_window(maze, i, start[i]-1, start, size);
            make_window(maze, i, size[i] + start[i], start, size);
        }*/

        if(size[dimension] < MIN_SIZE) {
        /*for(var i=0;i<start.length;i++) {
            make_window(maze, i, start[i]-1, start, size);
            make_window(maze, i, size[i] + start[i], start, size);
        }*/
            var i = dimension;
            make_window(maze, i, start[i]-1, start, size);
            make_window(maze, i, size[i] + start[i], start, size);
            return;
        }
        var divider_coord = Math.floor(Math.random()*(size[dimension]-1));
        var divider_start = start.slice();
        divider_start[dimension] += divider_coord;
        var divider_size = size.slice();
        divider_size[dimension] = 1;
        maze.set_range(divider_start, divider_size, 1);

        var recursive_start = start.slice();
        var recursive_size = size.slice();

        
        recursive_size[dimension] = divider_coord;
        subdivide(maze, recursive_start, recursive_size,level+1);


        recursive_start[dimension] += divider_coord + 1;
        recursive_size[dimension] = size[dimension] - divider_coord - 1;
        subdivide(maze, recursive_start, recursive_size,level+1);


    };

    var start = Array.apply(null, new Array(dimensions.length)).map(Number.prototype.valueOf,0);
    subdivide(maze, start, dimensions, 0);

    return maze;
}

var make_polygons = function (maze) {
    var positions = [];
    var normals = [];
    var indices = [];

    maze.map(function (idx) {
        for(var i=0;i<idx.length;i++) {
            var adjacent_index = idx.slice();
            for(var j=0;j<2;j++) {
                var adjacent_coord = (j*2-1) + idx[i];
                var coord = j + idx[i];
                /* The adjacent cell must be inside the maze. */
                if(!(0 <= adjacent_coord && adjacent_coord < maze.dimensions[i])) {
                    continue;
                }

                /* Generate the new index. */
                adjacent_index[i] = adjacent_coord;
                /* Make the face if there is no adjacent cell. */
                if(maze.get(adjacent_index)) {
                    var normal = Array(idx.length).fill(0);

                    normal[i] = j*2-1;


                    var k0 = (i+2)%3;
                    var k1 = (i+1)%3;

                    var start_index = normals.length;

                    normals.push(normal);
                    normals.push(normal);
                    normals.push(normal);
                    normals.push(normal);


                    var position = idx.slice();
                    position[i] = coord;
                    positions.push(position);

                    var position = idx.slice();
                    position[i] = coord;
                    position[k0]++;
                    positions.push(position);

                    var position = idx.slice();
                    position[i] = coord;
                    position[k1]++;
                    positions.push(position);

                    var position = idx.slice();
                    position[i] = coord;
                    position[k0]++;
                    position[k1]++;
                    positions.push(position);

                    var index = [
                        start_index, start_index+1, start_index+2,
                        start_index+1, start_index+3, start_index+2
                    ];
                    if(j == 0) {
                        index.reverse();
                    }
                    indices.push(index);
                }
            }
        }
    });

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

    /*indices = [0,1,2];
    positions = [
        -1,-1,0, 
        1,1,0,
        -1,1,0,
    ];
    normals = [
        1,1,1,
        1,1,1,
        1,1,1
    ];*/
    return {
        'vertex count': indices.length,
        'indices': new Uint16Array(indices),
        //'indices': new Uint32Array(indices),
        'positions': new Float32Array(positions),
        'normals': new Float32Array(normals)
    };
};

var load_ajax = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function (e) {
        if(xhr.readyState == 4) {
            if(xhr.status == 200) {
                callback(xhr.responseText);
            }
        }
    };
    xhr.open("GET", url);
    xhr.send(null);
};

var chain_loads = function(chain, initial) {
    if("url" in chain[0]) {
        var callback = chain[0]["callback"];
        load_ajax(chain[0]["url"], function (text) {
            var next = chain[0]["callback"](text, initial);
            chain_loads(chain.slice(1), next);
        });
    } else {
        chain[0]["callback"](initial);
    }
};

var Vector = function (coords) {
    this.coords = coords.slice();
};

Vector.prototype.copy = function () {
    return new Vector(this.coords);
};

Vector.prototype.dimension = function () {
    return this.coords.length;
};

Vector.prototype.get = function (index) {
    return this.coords[index];
};

Vector.prototype.set = function (index, value) {
    this.coords[index] = value;
};

Vector.prototype.abs = function () {
    var c = this.copy();
    for(var i=0;i< this.coords.length;i++) {
        if(c.coords[i] < 0) {
            c.coords[i] = -c.coords[i];
        }
    }
    return c;
};

Vector.prototype.min_index = function () {
    var index = 0;
    for(var i=1;i< this.coords.length;i++) {
        if(this.coords[i] < this.coords[index]) {
            index = i;
        }
    }
    return index;
};

Vector.prototype.reflect = function (normal) {
    var d = Vector.dot(normal, this) / Vector.dot(normal,normal);
    return Vector.subtract(this, Vector.scale(2*d, normal));
};

Vector.prototype.rotate_to = function (from,to) {
    var via = Vector.zeros(this.coords.length);
    var index = from.abs().min_index();
    via.set(index, 1);

    return this.reflect(Vector.subtract(via, from.normalized())).reflect(Vector.subtract(to.normalized(), via));
    //return this.reflect(from).reflect(Vector.add(from,to).normalized());
};

Vector.prototype.normalized = function () {
    var len = Math.sqrt(Vector.dot(this,this));
    return Vector.scale(1/len, this);
};

Vector.prototype.set_dimension = function(dimension) {
    var c = Vector.zeros(dimension);

    for(var i=0;i<dimension && i<this.coords.length;i++) {
        c.coords[i] = this.coords[i];
    }
    return c;
};
Vector.scale = function (a, b) {
    var c = Vector.copy(b);
    for(var i=0;i<c.coords.length;i++) {
        c.coords[i] *= a;
    }
    return c;
};

Vector.cross = function (a,b) {
    var c = Vector.zeros(3);

    c.coords[0] = (a.coords[1] * b.coords[2] - a.coords[2] * b.coords[1]);
    c.coords[1] = -(a.coords[0] * b.coords[2] - a.coords[2] * b.coords[0]);
    c.coords[2] = (a.coords[0] * b.coords[1] - a.coords[1] * b.coords[0]);

    return c;
};

Vector.zeros = function (dimension) {
    return new Vector(Array(dimension).fill(0));
};

Vector.copy = function (v) {
    return new Vector(v.coords);
};
Vector.add = function (a, b) {
    var c = new Vector(a.coords);
    for(var i=0;i<c.coords.length;i++) {
        c.coords[i] += b.coords[i];
    }
    return c;
};

Vector.dot = function (a,b) {
    var c = 0;
    for(var i=0;i<a.coords.length;i++) {
        c += a.coords[i] * b.coords[i];
    }
    return c;
};

Vector.subtract = function (a, b) {
    var c = new Vector(a.coords);
    for(var i=0;i<c.coords.length;i++) {
        c.coords[i] -= b.coords[i];
    }
    return c;
};

var Matrix = function (rows, columns) {
    this.rows = rows;
    this.columns = columns;
    this.coeffs = new Array(this.rows * this.columns);
};

Matrix.from_rows = function (rows) {
    var c = new Matrix(rows.length, rows[0].length);

    console.log(c);
    for(var i=0;i<c.rows;i++) {
        for(var j=0;j<c.columns;j++) {
            c.coeffs[i * c.columns + j] = rows[i][j];
        }
    }
    return c;
};

Matrix.zeros = function (rows, columns) {
    var c = new Matrix(rows, columns);

    for(var i=0;i<rows*columns;i++) {
        c.coeffs[i] = 0;
    }

    return c;
};

Matrix.copy = function (mat) {
    var c = new Matrix(mat.columns, mat.rows);
    for(var i=0;i<mat.columns*mat.rows;i++) {
        c.coeffs[i] = mat.coeffs[i];
    }
    return c;
};

Matrix.eye = function (dimension) {
    var c = Matrix.zeros(dimension, dimension);
    for(var i=0;i<dimension;i++) {
        c.coeffs[(dimension + 1) * i] = 1;
    }
    return c;
};

Matrix.prototype.get_column = function(index) {
    var c = Vector.zeros(this.rows);
    for(var i=0;i<this.rows;i++) {
        c.set(i, this.get(i, index));
    }
    return c;
};

Matrix.prototype.transpose = function() {
    var c = new Matrix(this.columns, this.rows);
    for(var i=0;i<this.rows;i++) {
        for(var j=0;j<this.columns;j++) {
            c.coeffs[j * this.rows + i] = this.coeffs[i * this.columns + j];
        }
    }
    return c;
};
Matrix.prototype.set_column = function(index, column) {
    for(var i=0;i<this.rows;i++) {
        this.set(i, index, column.get(i));
    }
};

Matrix.prototype.get = function (row, column) {
    return this.coeffs[row * this.columns + column];
};
Matrix.prototype.set = function (row, column, value) {
    this.coeffs[row * this.columns + column] = value;
};
Matrix.prototype.rotate_to = function(a,b) {
    var c = Matrix.copy(this);
    for(var i=0;i<this.columns;i++) {
        var column = c.get_column(i);
        column = column.rotate_to(a,b);
        c.set_column(i, column);
    }
    return c;
};

var Player = function (start_position, forward, up) {
    this.position = start_position.copy();
    this.up = up.copy();
    this.forward = forward.copy();
};

Player.prototype.move_forward = function (amount, test_intersection) {
    var position = Vector.add(this.position, Vector.scale(amount, this.forward));
    if(test_intersection(position)) {
        this.position = position;
    }
};
Player.prototype.move_up = function (amount, test_intersection) {
    var position = Vector.add(this.position, Vector.scale(amount, this.up));
    if(test_intersection(position)) {
        this.position = position;
    }
};


Player.prototype.move_left = function (amount, test_intersection) {
    var left = Vector.cross(this.up, this.forward);
    var position = Vector.add(this.position, Vector.scale(amount, left));
    if(test_intersection(position)) {
        this.position = position;
    }
};

Player.prototype.look_left = function (angle) {
    var cs = Math.cos(angle);
    var sn = Math.sin(angle);
    var left = Vector.cross(this.up, this.forward);
    var forward = Vector.add(Vector.scale(cs, this.forward), Vector.scale(sn, left));

    this.forward = forward;
};

Player.prototype.look_up = function (angle) {
    var cs = Math.cos(angle);
    var sn = Math.sin(angle);
    var forward = Vector.add(Vector.scale(cs, this.forward), Vector.scale(sn, this.up));
    var up = Vector.add(Vector.scale(cs, this.up), Vector.scale(-sn, this.forward));

    this.forward = forward;
    this.up = up;
};

Player.prototype.modelview = function () {
    /*def modelview(self):
        left_vector = -normalize(numpy.cross(self.__direction, self.__up_vector))
        up_vector = normalize(numpy.cross(self.__direction, left_vector))
        m = numpy.eye(4, dtype=numpy.float32)
        m[:3, 3] = -self.__viewpoint


        rotated_up = rotate(self.__direction, OPENGL_FORWARD_VECTOR, up_vector)
        projected_up = normalize(rotated_up - numpy.dot(rotated_up, OPENGL_FORWARD_VECTOR)*OPENGL_FORWARD_VECTOR)
        m[:3, :] = rotate(self.__direction, OPENGL_FORWARD_VECTOR, m[:3,:])
        m[:3, :] = rotate(projected_up, OPENGL_UP_VECTOR, m[:3, :])*/


    var MODELVIEW_FORWARD = new Vector([0,0,-1,0]);
    var MODELVIEW_UP = new Vector([0,1,0,0]);
    var up = this.up.rotate_to(this.forward, MODELVIEW_FORWARD.set_dimension(3));

    console.log(Vector.dot(up, MODELVIEW_FORWARD));
    var modelview = Matrix.eye(this.position.dimension()+1);
    for(var i=0;i<this.position.dimension();i++) {
        modelview.set(i, this.position.dimension(), -this.position.get(i));
    }


    modelview = modelview.rotate_to(this.forward.set_dimension(4), MODELVIEW_FORWARD);
    modelview = modelview.rotate_to(up.set_dimension(4), MODELVIEW_UP);

    return modelview;
};
var perspective_matrix = function(zN,zF,fov, aspect) {
    /*var r = width / 2;
    var t = height / 2;
    var n = near;
    var f = far;*/
    var f = 1/Math.tan(fov/2.0)
    var r = aspect
    return Matrix.from_rows([
        [f/r, 0, 0,               0], 
        [0, f,   0,               0], 
        [0, 0, -(zF+zN)/(zF-zN),  -2*zF*zN/(zF-zN)],
        [0, 0, -1,                0]
    ])
        

    /*return Matrix.from_rows([
        [n/r, 0, 0, 0],
        [0, n/t, 0, 0],
        [0, 0, -(f+n) / (f-n), -2*f*n/(f-n)],
        [0, 0, -1, 0]
    ]);*/
};

$(document).ready(function () {
    var canvas = document.getElementById('canvas');
    var gl = canvas.getContext('webgl');

    var init_gl = function(maze) {

        $.when.apply(null, [
            $.ajax('shaders/vertex.glsl'),
            $.ajax('shaders/fragment.glsl')
        ]).then(function (vertex, fragment) {
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
            var polygons = make_polygons(maze);

            state['polygons'] = polygons;

            console.log(polygons['normals']);
            console.log(polygons['indices']);
            program['vertex position buffer'] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, program['vertex position buffer']);
            gl.bufferData(gl.ARRAY_BUFFER, polygons['positions'], gl.STATIC_DRAW);
            gl.vertexAttribPointer(program['attribute locations']['a_position'], 3, gl.FLOAT, false, 0, 0);

            program['vertex normal buffer'] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, program['vertex normal buffer']);
            gl.bufferData(gl.ARRAY_BUFFER, polygons['normals'], gl.STATIC_DRAW);
            gl.vertexAttribPointer(program['attribute locations']['a_normal'], 3, gl.FLOAT, false, 0, 0);

            program['index buffer'] = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program['index buffer']);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, polygons['indices'], gl.STATIC_DRAW);
        
            gl.clearColor(0,0,0,1);
            setInterval(redraw_loop, 1000/config['fps']);

            var ASPECT = 4/3;
            gl.uniformMatrix4fv(state['shader program']['uniform locations']['u_projection'], false, new Float32Array(perspective_matrix(0.1, 100, 80*Math.PI/180, ASPECT).transpose().coeffs));
        }).fail(function () {
            throw new Error('Unable to load shaders.');
        });
    }

    var redraw_loop = function () {
        var program = state['shader program'];

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, program['vertex position buffer']);
        gl.vertexAttribPointer(program['attribute locations']['a_position'], 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, program['vertex normal buffer']);
        gl.vertexAttribPointer(program['attribute locations']['a_normal'], 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program['index buffer']);

        gl.drawElements(gl.TRIANGLES, state['polygons']['vertex count'], gl.UNSIGNED_SHORT, 0);
        //gl.drawElements(gl.TRIANGLES, state['polygons']['vertex count'], gl.UNSIGNED_INT, 0);
        //gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    //var maze_size = [128,128,128];
    //var maze_size = [64,64,7];
    //var maze_size = [32,32,32];
    var maze_size = [32,32,1];
    //var maze_size = [5,5,5];
    var maze = make_maze(maze_size);
    //var f = new Vector([0,0,1]);
    /*var f = new Vector([0,1,0]);
    var t = new Vector([0,0,-1]);
    var x = new Vector([1,2,3]);
    console.log(x.rotate_to(f, t), x, f, t);*/
    //console.log(x.reflect(t));
    var state = {};
    //state['player'] = new Player(new Vector([0,0,0]), new Vector([0,0,-1]), new Vector([0,1,0]));
    state['player'] = new Player(Vector.scale(1/2,new Vector(maze_size)), new Vector([1,0,0]), new Vector([0,0,1]));
    init_gl(maze);

    (function () {

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
                //console.log(keycode);
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
            var test_intersection = function(position) {
                return true;
            };
			bindings.forEach(function (binding) {
			switch(binding['binding']) {
				case 'move left': {
						state['player'].move_left(config['movement']['strafe distance'], test_intersection);
				}
				break;
				case 'move right': {
						state['player'].move_left(-config['movement']['strafe distance'], test_intersection);
				}
				break;
				case 'move up': {
						state['player'].move_up(config['movement']['vertical distance'], test_intersection);
				}
				break;
				case 'move down': {
						state['player'].move_up(-config['movement']['vertical distance'], test_intersection);
				}
				break;
				case 'move forward': {
						state['player'].move_forward(config['movement']['forward distance'], test_intersection);
				}
				break;
				case 'move backward': {
						state['player'].move_forward(-config['movement']['backward distance'], test_intersection);
				}
				break;
				case 'turn left': {
						state['player'].look_left(config['movement']['turn angle'] * 2 * Math.PI / 360);
				}
				break;
				case 'turn right': {
						state['player'].look_left(-config['movement']['turn angle'] * 2 * Math.PI / 360);
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

            //console.log(state['player'].modelview().coeffs);

            console.log(state['player'].forward.coords, state['player'].up.coords);
            gl.uniformMatrix4fv(state['shader program']['uniform locations']['u_modelview'], false, new Float32Array(state['player'].modelview().transpose().coeffs));
        };
        setInterval(handle_input, 1000/config['key refresh']);
    }) ();
});

