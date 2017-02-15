/* player.js */

'use strict';

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

if(!Array.prototype.fill) {
Array.prototype.fill = function(x) {
    for(var i=0;i<this.length;i++) {
        this[i] = x;
    }
    return this;
}
}

function ceil_div(a, b) {
    return ~~((a+b-1) / b);
}


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
    var via = Vector.add(from.normalized(), to.normalized());
    via = via.normalized()
    return this.reflect(Vector.subtract(via, from.normalized())).reflect(Vector.subtract(to.normalized(), via));
}

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


Matrix.prototype.map_columns = function(func) {
    var c = Matrix.copy(this);
    for(var i=0;i<this.columns;i++) {
        c.set_column(i, func(c.get_column(i)));
    }
    return c;
};

var Camera = function (position, forward, up) {
    this.position = position.copy();
    this.up = up.copy();
    this.forward = forward.copy();
};

Camera.prototype.move_forward = function (amount) {
    var position = Vector.add(this.position, Vector.scale(amount, this.forward));
};
Camera.prototype.move_up = function (amount) {
    var position = Vector.add(this.position, Vector.scale(amount, this.up));
};


Camera.prototype.move_left = function (amount) {
    var left = Vector.cross(this.up, this.forward);
    var position = Vector.add(this.position, Vector.scale(amount, left));
};
Camera.prototype.look_left = function (angle) {
    var cs = Math.cos(angle);
    var sn = Math.sin(angle);
    var left = Vector.cross(this.up, this.forward);
    var forward = Vector.add(Vector.scale(cs, this.forward), Vector.scale(sn, left));

    this.forward = forward;
};

Camera.prototype.roll_left = function (angle) {
    var cs = Math.cos(angle);
    var sn = Math.sin(angle);
    var left = Vector.cross(this.up, this.forward);
    var up = Vector.add(Vector.scale(cs, this.up), Vector.scale(sn, left));

    this.up = up;
};

Camera.prototype.look_up = function (angle) {
    var cs = Math.cos(angle);
    var sn = Math.sin(angle);
    var forward = Vector.add(Vector.scale(cs, this.forward), Vector.scale(sn, this.up));
    var up = Vector.add(Vector.scale(cs, this.up), Vector.scale(-sn, this.forward));

    this.forward = forward;
    this.up = up;
};

Camera.prototype.modelview = function () {
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
    var MODELVIEW_LEFT = new Vector([-1,0,0,0]);

    var modelview = Matrix.eye(this.position.dimension()+1);
    for(var i=0;i<this.position.dimension();i++) {
        modelview.set(i, this.position.dimension(), -this.position.get(i));
    }

    //var up = this.up.rotate_to(this.forward, MODELVIEW_FORWARD.set_dimension(3));
    var up = this.up.reflect(Vector.subtract(MODELVIEW_FORWARD.set_dimension(3), this.forward));

    var forward = this.forward;
    modelview = modelview.map_columns(function (column) {
        return column.reflect(Vector.subtract(MODELVIEW_FORWARD, forward.set_dimension(4)));
    });
    if(Vector.dot(up, MODELVIEW_UP.set_dimension(3)) == 1) {
        var left = Vector.cross(this.up, this.forward);
        left = left.reflect(Vector.subtract(MODELVIEW_FORWARD.set_dimension(3), this.forward));
        modelview = modelview.map_columns(function (column) {
            return column.reflect(Vector.subtract(MODELVIEW_LEFT, left.set_dimension(4)));
        });
    } else {
        modelview = modelview.map_columns(function (column) {
            return column.reflect(Vector.subtract(MODELVIEW_UP, up.set_dimension(4)));
        });
    }


    return modelview;
};


var Player = function(position, forward, up) {
    this.camera = new Camera(position, forward, up);
    this.momentum = new Vector.zeros(3);
};

Player.prototype.move_forward = function(amount) {
    this.momentum = Vector.add(this.momentum, Vector.scale(amount, this.camera.forward));
};

Player.prototype.move_up = function(amount) {
    this.momentum = Vector.add(this.momentum, Vector.scale(amount, this.camera.up));
};

Player.prototype.move_left = function(amount) {
    var left = Vector.cross(this.camera.up, this.camera.forward);
    this.momentum = Vector.add(this.momentum, Vector.scale(amount, left));
};

Player.prototype.look_up = function(amount) {
    this.camera.look_up(amount);
};

Player.prototype.look_left = function(angle) {
    this.camera.look_left(angle);
};

Player.prototype.roll_left = function(angle) {
    this.camera.roll_left(angle);
};

Player.prototype.advance = function(time) {
    var MOMENTUM_DECAY = config['momentum decay'];
    //console.log(Vector.dot(this.momentum,this.momentum));
    if(Vector.dot(this.momentum,this.momentum) > 1e-3) {
        var new_position = Vector.add(this.camera.position, Vector.scale(time, this.momentum));

        this.camera.position = new_position;
        this.momentum = Vector.scale(Math.pow(MOMENTUM_DECAY,time), this.momentum);
    }
};


var perspective_matrix = function(zN,zF,fov, aspect) {
    /*var r = width / 2;
    var t = height / 2;
    var n = near;
    var f = far;*/
    var f = 1/Math.tan(fov/2.0)
    var r = aspect
    if(zF) {
        return Matrix.from_rows([
            [f/r, 0, 0,               0], 
            [0, f,   0,               0], 
            [0, 0, -(zF+zN)/(zF-zN),  -2*zF*zN/(zF-zN)],
            [0, 0, -1,                0]
        ]);
    } else {
        return Matrix.from_rows([
            [f/r, 0, 0,               0], 
            [0, f,   0,               0], 
            [0, 0, -1,  -2*zN],
            [0, 0, -1,                0]
        ]);
    }
        
};


