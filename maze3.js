/* maze3.js */

'use strict';

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

NDBoolArray.prototype.get = function (idx) {
    var index = this.linear_index(idx);
    var word_index = ~~(index / this.WORD_SIZE);
    return (this.data[word_index] >> (index % this.WORD_SIZE)) & 1;
};

NDBoolArray.prototype.set = function(idx, bit) {
    var index = this.linear_index(idx);
    var word_index = ~~(index / this.WORD_SIZE);
    var bit_index = index % this.WORD_SIZE;
    var word = this.data[word_index];
    var mask = ~(1 << bit_index);
    //console.log(word_index, bit_index, bit);
    this.data[word_index] = (word & mask) | ((bit ? 1 : 0) << bit_index);
};


NDBoolArray.prototype.set_range = function(start, size, value) {
    var array = this;
    var rec = function(index, start, size, value) {
        if(size.length == 0) {
            //console.log(index);
            array.set(index, value);
        } else {
            for(var i=0;i<size[0]; i++) {
                rec(index.concat([i+start[0]]), start.slice(1), size.slice(1), value);
            }
        }
    };

    rec([], start, size, value);
};

var make_maze = function(dimensions) {
    var maze = new NDBoolArray(dimensions);

    var subdivide = function(maze, start, size,level) {
        var MIN_SIZE = 3;
        //console.log(start, size);
        /*if(level > 3) {
            return;
        }*/

        var dimension = size.indexOf(Math.max.apply(null, size));

        if(size[dimension] < MIN_SIZE) {
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

        //console.log(dimension, divider_coord);
        
        recursive_size[dimension] = divider_coord;
        subdivide(maze, recursive_start, recursive_size,level+1);


        recursive_start[dimension] += divider_coord + 1;
        recursive_size[dimension] = size[dimension] - divider_coord - 1;
        subdivide(maze, recursive_start, recursive_size,level+1);


        var make_window = function(maze, dimension, coordinate, start, size) {
            if(!(0 <= coordinate && coordinate < maze.dimensions[dimension])) {
                return;
            }
            
            var range_start = new Array(start.length);
            var range_size = new Array(start.length);

            for(var j=0;j<start.length;j++) {
                if(j != dimension) {
                    range_size[j] = Math.floor(Math.random()*(size[j]/4-1));
                    range_start[j] = Math.floor(Math.random()*(size[j] - range_size[j]-1)) + start[j];
                }
            }
            range_size[dimension] = 1;
            range_start[dimension] = coordinate;
            maze.set_range(range_start, range_size, 0);
        };

        for(var i=0;i<start.length;i++) {
            make_window(maze, i, start[i]-1, start, size)
            make_window(maze, i, size[i] + start[i], start, size)
        }
    };

    var start = Array.apply(null, new Array(dimensions.length)).map(Number.prototype.valueOf,0);
    subdivide(maze, start, dimensions, 0);

    return maze;
}

window.onload = function () {
    /*var canvas = document.getElementById('canvas');
    var gl = canvas.getContext('webgl');*/
    //console.log(make_maze([32,32,1]))
    //console.log(make_maze([1024,1024,1]));
    var size = [128,128,128];
    var maze = make_maze(size);
    var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
    context['imageSmoothingEnabled'] = false;       /* standard */
    context['mozImageSmoothingEnabled'] = false;    /* Firefox */
    context['oImageSmoothingEnabled'] = false;      /* Opera */
    context['webkitImageSmoothingEnabled'] = false; /* Safari */
    context['msImageSmoothingEnabled'] = false;     /* IE */
    var k = 0;
    window.setInterval(function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    for(var i=0;i<size[0];i++) {
        for(var j=0;j<size[0];j++) {
            //if(maze.get([i,j,k])) {
            if(maze.get([i,j,k])) {
                context.fillRect(i,j,1,1);
            }
        }
    }
    k = (k+1)%size[2];
    }, 1000/3.0);

};

