/* hypercube.js */

'use strict';

var FRAME_RATE = 30;
function Matrix(rows,columns)
{
	this.rows = rows;
	this.columns = columns;
	this.data = new Array(rows*columns);
	for(var i=0;i<this.data.length;i++) {
		this.data[i] = 0;
	}
	this.multiply = function (mat2) {
		var result = new Matrix(this.rows,mat2.columns);
		for(var i=0;i<this.rows;i++) {
			for(var k=0;k<this.columns;k++) {
				for(var j=0;j<mat2.columns;j++) {
					result.data[i*mat2.columns+j] +=
						this.data[i*this.columns+k] * mat2.data[k*mat2.columns+j];
				}
			}
		}
		return result;
	}
	this.transpose = function ()
	{
		var result = new Matrix(this.columns,this.rows);
		for(var i=0;i<this.rows;i++) {
			for(var j=0;j<this.columns;j++) {
				result.data[j*result.columns+i] = this.data[i*this.columns+j];
			}
		}
		return result;
	}

	this.qr = function () {
		function householder(x) {
			var x_norm2_squared = 0;
			for(var i=1;i<x.length;i++) {
				x_norm2_squared += x[i]*x[i];
			}
			var x_norm = Math.sqrt(x[0]*x[0]+x_norm2_squared);
			var alpha = x[0] + (x[0] > 0 ? x_norm : -x_norm);

			var u_norm_squared = alpha*alpha+x_norm2_squared;

			return {'alpha': alpha, 'norm squared' : u_norm_squared};
		}

		var q = new Matrix(this.rows,this.rows);
		var r = new Matrix(this.rows,this.columns);
		for(var i=0;i<this.rows*this.columns;i++) {
			r.data[i] = this.data[i];
		}
		for(var i=0;i<this.rows;i++) {
			q.data[i*(this.rows+1)] = 1;
		}
		for(var i=0;i<r.columns;i++) {
			var x = new Array(r.rows-i);
			for(var j=i;j<r.rows;j++) {
				x[j-i] = r.data[j*r.columns+i];
			}
			// v = [alpha,x(2:)] / sqrt(u_norm_squared)
			var reflector = householder(x);
			// Q_{k+1} = Q_k*(I-2*v*v')'; compute 2*Q_k*v/||v|| first
			var qv = new Array(q.rows);
			for(var j=0;j<qv.length;j++) {
				qv[j] = q.data[(j)*q.columns+(i)] * reflector['alpha'];
				for(var k=1;k<x.length;k++) {
					qv[j] += q.data[(j)*q.columns+(i+k)] * x[k];
				}
				qv[j] *= 2 / reflector['norm squared'];
			}

			// Update Q_{k+1} = Q_k - (2*Q_k*v)*v'
			for(var j=0;j<qv.length;j++) {
				q.data[(j)*q.columns+(i)] -= qv[j]*reflector['alpha'];
				for(var k=1;k<x.length;k++) {
					q.data[(j)*q.columns+(i+k)] -= qv[j]*x[k];
				}
			}

			// R_{k+1} = (I-2*v*v')*R_k; compute 2*v'*R_k/||v|| first.
			var rv = new Array(r.columns-i);
			for(var j=0;j<rv.length;j++) {
				rv[j] = r.data[(i)*r.columns+(i+j)] * reflector['alpha'];
				for(var k=1;k<x.length;k++) {
					rv[j] += r.data[(i+k)*r.columns+(i+j)] * x[k];
				}
				rv[j] *= 2 / reflector['norm squared'];
			}
			// Update R_{k+1} = R_k - v*(2*v'*R_k)
			for(var j=0;j<rv.length;j++) {
				r.data[(i)*r.columns+(i+j)] -= reflector['alpha']*rv[j];
				for(var k=1;k<x.length;k++) {
					r.data[(i+k)*r.columns+(i+j)] -= x[k]*rv[j];
				}
			}
		}
		return {'Q' : q, 'R' : r};
	}
	this.slice = function (r,c,h,w) {
		var result = new Matrix(h,w);
		for(var i=0;i<h;i++) {
			for(var j=0;j<w;j++) {
				result.data[i*w+j] = this.data[(i+r)*this.columns+(j+c)];
			}
		}
		return result;
	}
}
Matrix.identity = function (size) {
	var result = new Matrix(size,size);
	for(var i=0;i<size;i++) {
		result.data[i*(size+1)] = 1;
	}
	return result;
}
Matrix.rotation = function (spanner, angle) {
	var q = spanner.qr()['Q'];
	var rotator = new Matrix(spanner.rows,spanner.rows);
	var cs = Math.cos(angle);
	var sn = Math.sin(angle);
	var givens = [cs,-sn,sn,cs];
	for(var i=0;i<2;i++) {
		for(var j=0;j<spanner.rows;j++) {
			for(var k=0;k<2;k++) {
				rotator.data[j*spanner.rows+i] += q.data[j*spanner.rows+k]*givens[k*2+i];
			}
		}
	}
	for(var i=2;i<spanner.rows;i++) {
		for(var j=0;j<spanner.rows;j++) {
			rotator.data[j*spanner.rows+i] = q.data[j*spanner.rows+i];
		}
	}
	return rotator.multiply(q.transpose());
}

Math.mod = function (x,y) {
	return x-y*Math.floor(x/y);
}

$(document).ready(function() {
	var canvas_name = 'canvas';
	var canvas = document.getElementById(canvas_name);
	var context = canvas.getContext('2d');

	var width = 4;
	var height = 4;
	var far = 100;
	var near = 0.1;

	var ndmv;
	var ndmv_truncated;
	var spanners;
	var angles;

	var angle_speeds;
	function set_dimension(dimension) {
		initialize_model(dimension);

		spanners = new Array(dimension*(dimension+1));
		angles = new Array(spanners.length);
		angle_speeds = new Array(spanners.length);
		var speed_scale = 1/50000;
		for(var i=0;i<spanners.length;i++) {
			spanners[i] = new Matrix(dimension,2);
			for(var j=0;j<dimension*2;j++) {
				spanners[i].data[j] = Math.random()*2-1;
			}
			angles[i] = Math.random()*Math.PI*2;
			angle_speeds[i] = Math.random()*Math.PI*2*speed_scale;
		}	
		ndmv = Matrix.identity(dimension);
		ndmv_truncated = ndmv.slice(0,0,2,ndmv.rows);
	} 

	var rgb = function(c) {
		return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; 
	}
	var colors;
	var vertices;
	function initialize_model(dimensions) {
		switch(polytope_type) {
		case 'cross':
			colors = new Array(dimensions*2);
			vertices = null;
			break;
		case 'hypercube':
			colors = new Array(1<<dimensions);
			vertices = null;
			break;
		case 'simplex':
			colors = new Array(dimensions+1);
			var m = Matrix.identity(dimensions+1);
			for(var i=0;i<dimensions;i++) {
				m.data[m.data.length-m.columns + i] = -1;
			}
			m.data[m.data.length-1] = -1;
			var q = m.qr()['Q'];
			vertices = q.slice(0,0,dimensions+1,dimensions).transpose();

			break;
		}

		for(var i=0;i<colors.length;i++) {
			colors[i] = new Array(3);
			for(var j=0;j<3;j++) {
				colors[i][j] = Math.floor(Math.random()*256);
			}
		}
	}
	var draw_basis = function() {
		var dimensions = ndmv.rows;
		context.lineWidth = 0.02;
		context.save();
		context.scale(canvas.width, canvas.height);
		context.translate(0.5,0.5);
		context.scale(1/width,1/height);

		context.strokeStyle = rgb([0,0,0]);
		context.beginPath();
		for(var i=0;i<dimensions;i++) {
			context.moveTo(ndmv.data[i], ndmv.data[dimensions+i]);
			context.lineTo(0,0);
			context.stroke();
		}
		context.closePath();
		context.restore();
	}
	var render_hypercube = function() {
		var dimensions = ndmv.rows;
		var vertex_count = 1<<dimensions;
		for(var i=0;i<vertex_count;i++)
		{
			var v0 = new Array(2);
			var v1 = new Array(2);
			for(var l=0;l<2;l++) {
				v0[l] = 0;
				for(var j=0;j<ndmv.columns;j++) {
					var t = ((i >> j) & 1) * 2 - 1;
					v0[l] += t * ndmv.data[j+l*ndmv.columns];
				}
			}
			for(var j=0;j<ndmv.columns;j++) {
				var idx = i ^ (1 << j);
				if(idx >= i) {
					continue;
				}
				
				var c = 1;
				if(((i >> j) & 1) == 0) {
					c = -1;
				}
		
				for(var l=0;l<2;l++) {
					v1[l] = v0[l] - 2*ndmv.data[j+l*ndmv.columns]*c;
				}

				context.beginPath();
				context.strokeStyle = rgb(colors[i]);
				context.moveTo(v0[0], v0[1]);
				context.lineTo(v1[0], v1[1]);
				context.stroke();
				context.closePath();
			}
		}

	}
	var render_cross = function() {
		var sqrt2 = Math.sqrt(2);
		context.scale(sqrt2,sqrt2);
		var dimensions = ndmv.rows;
		/* First vertex dimension. */
		for(var i=1;i<dimensions;i++)
		{
			/* Second vertex dimension. */
			for(var j=0;j<i;j++) {
				/* First vertex sign. */
				for(var k=0;k<2;k++) {
					/* Second vertex sign. */
					for(var l=0;l<2;l++) {
						context.beginPath();
						context.strokeStyle = rgb(colors[i*2+k]);
						context.moveTo(ndmv.data[i]*(k*2-1), ndmv.data[dimensions+i]*(k*2-1));

						context.lineTo(ndmv.data[j]*(l*2-1), ndmv.data[dimensions+j]*(l*2-1));

						context.stroke();
						context.closePath();
					}
				}
			}
		}

	}
	var render_simplex = function () {
		var sqrt2 = Math.sqrt(2);
		context.scale(sqrt2,sqrt2);
		var dimensions = ndmv.rows;
		var v = ndmv_truncated.multiply(vertices);
		for(var i=1;i<=ndmv.rows;i++)
		{
			for(var j=0;j<i;j++) {
				context.beginPath();
				context.strokeStyle = rgb(colors[i]);
				context.moveTo(v.data[i], v.data[dimensions+1+i]);
				context.lineTo(v.data[j], v.data[dimensions+1+j]);
				context.stroke();
				context.closePath();
			}
		}
	}

	var render_model = {
		'cross': render_cross,
		'hypercube': render_hypercube,
		'simplex': render_simplex
	};
	var redraw = function(renderer) {
		// Clear the canvas.
		context.clearRect(0,0,canvas.width,canvas.height);
		context.save();
        // Reposition and scale the screen.
		context.lineWidth = 0.005;
		context.scale(canvas.width, canvas.height);
		context.translate(0.5,0.5);
		context.scale(1/width,1/height);
		renderer()
		context.restore();
		if(basis_vectors) {
			draw_basis();
		}
	};

	var last_time = 0;
	function animate() {
		var time_now = new Date().getTime();
		if (last_time != 0) {
			var elapsed = time_now - last_time;
			for(var i=0;i<angles.length;i++) {
				angles[i] = Math.mod(angles[i]+angle_speeds[i]*elapsed,Math.PI*2);
			}

			ndmv = Matrix.identity(dimension);
			for(var i=0;i<spanners.length;i++) {
				ndmv = Matrix.rotation(spanners[i],angles[i]).multiply(ndmv);
			}
			ndmv_truncated = ndmv.slice(0,0,2,ndmv.rows);
		}
		last_time = time_now;
	}

	var dimension = 2;
	$('#dimension_option').val(dimension);
	var polytope_type = 'hypercube';
	$('#polytope_option').val(polytope_type);
	var basis_vectors = true;
	$('#unit_option').prop('checked',basis_vectors);

	set_dimension(dimension);
	window.setInterval(function () {
		animate();
		redraw(render_model[polytope_type]);
	},1000/FRAME_RATE);

	$('#polytope_option').change(function() {
		polytope_type = $('#polytope_option').val();
		initialize_model(dimension);
	});
	$('#dimension_option').change(function() {
		dimension = parseInt($('#dimension_option').val());
		set_dimension(dimension);
	});
	$('#unit_option').change(function() {
		basis_vectors = $('#unit_option').prop('checked');
	});
});

