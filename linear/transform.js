
'use strict';


$(document).ready(function() {
    var mat = [1,0,0,1,0,0];
    var coeffNames = ["a11","a12","a21","a22","b1","b2"];

    var gridSize = 0.1;
    var canvasElement = $('#canvas')[0];
    var context = canvasElement.getContext('2d');

    var extent = 1.5;
    var width;
    var height;
    var norm = function(x,y) {
        return Math.sqrt(x*x+y*y);
    };
    var preimage = function(m, p) {
        var det = m[0] * m[3] - m[1] * m[2];
        var xt = p[0]-m[4];
        var yt = p[1]-m[5];
        return [(xt*m[3]-yt*m[1])/det,(-xt*m[2]+yt*m[0])/det];
    }
    var redraw = function() {
        var img = $('#image')[0];
        context.clearRect(0,0,canvasElement.width,canvasElement.height);
        context.save();

        // Transform the coordinate space to the page space.
        context.translate(width*extent,height*extent);
        context.scale(width,height);
        context.scale(1,-1);

        // Apply the transformation.
        context.transform(mat[0],mat[2],mat[1],mat[3],mat[4],mat[5]);

        // Map the image coordinate space to the working coordinate space. 
        // Specifically, the image origin has coordinates (0,1) in the working coordinate space.
        context.transform(1,0,0,-1,0,1);

        // Draw the image with dimensions 1 and 1.
        context.drawImage(img,0,0,1,1);

        context.restore();
        context.save();

        // Transform the coordinate space to the page space.
        context.translate(width*extent,height*extent);
        context.scale(width,height);
        context.scale(1,-1);

        context.transform(mat[0],mat[2],mat[1],mat[3],mat[4],mat[5]);

        context.lineWidth=1/width;
        // Draw the vertical grid lines.
        context.beginPath();
        for(var i=-extent;i<=extent;i += gridSize) {
            context.moveTo(i,-extent);
            context.lineTo(i,extent);
            context.stroke();
        }

        // Draw the horizontal grid lines.
        context.beginPath();
        for(var i=-extent;i<=extent;i += gridSize) {
            context.moveTo(-extent,i);
            context.lineTo(extent,i);
            context.stroke();
        }

        // Draw the basis vectors.
        context.lineWidth=20/width;
        context.beginPath();
        context.moveTo(0,0);
        context.lineTo(0,1);
        context.stroke();

        context.beginPath();
        context.moveTo(0,0);
        context.lineTo(1,0);
        context.stroke();
        context.restore();
        redrawing = false;
    };

    for(var i=0;i<6;i++) {
        $('#' + coeffNames[i]).val(mat[i]);
    }

    var getValue = function(inputName,original) {
        var x = parseFloat($('#' + inputName).val());
        if(!isNaN(x)) {
            return x;
        } else {
            return original;
        }
    };
	function getMousecoord(event) {
		var elem = event.target || event.srcElement;
		var rect = elem.getBoundingClientRect();
		return [event.clientX - rect.left,
			event.clientY - rect.top];
	}
    var pageSpace;
    var tolerance = 0.3;
    var moving = null;
    var oldmat = null;;
    $('#canvas').mousedown(function(event) {
        var coord = preimage(mat,preimage(pageSpace,getMousecoord(event)));
        //var coord = preimage(pageSpace,getMousecoord(event));
            //coord[0] += mat[4];
            //coord[1] += mat[5];
        if(norm(coord[0],coord[1]) < tolerance) {
            oldmat = mat.slice(0);
            moving = 'origin';
        } else if(norm(coord[0]-1,coord[1]) < tolerance) {
            oldmat = mat.slice(0);
            moving = 'x';
        } else if(norm(coord[0],coord[1]-1) < tolerance) {
            oldmat = mat.slice(0);
            moving = 'y';
        }

		event.preventDefault();
    });
    $('#canvas').mouseup(function(event) {
        if(moving != null) {
            moving = null;
            oldmat = null;
	    	event.preventDefault();
        }
    });
   $('#canvas').mousemove(function(event) {
        if(moving != null) {
            //var coord = preimage(mat,preimage(pageSpace,getMousecoord(event)));
            var coord = preimage(pageSpace,getMousecoord(event));
            if(moving == 'origin') {
                mat[4] = coord[0];
                mat[5] = coord[1];
                $('#b1').val(mat[4]);
                $('#b2').val(mat[5]);
            } else if(moving == 'x') {
                coord[0] -= oldmat[4];
                coord[1] -= oldmat[5];
                mat[0] = coord[0];
                mat[2] = coord[1];
                $('#a11').val(mat[0]);
                $('#a21').val(mat[2]);
            } else if(moving == 'y') {
                coord[0] -= oldmat[4];
                coord[1] -= oldmat[5];
                mat[1] = coord[0];
                mat[3] = coord[1];
                $('#a12').val(mat[1]);
                $('#a22').val(mat[3]);
            }
            redrawing = true;
		    event.preventDefault();
        }
    });


    $('#invert').click(function () {
        var det = mat[0] * mat[3] - mat[1] * mat[2];
        var newmat = [
            mat[3] / det, -mat[1] / det,
            -mat[2] / det, mat[0] / det,
            -mat[4],-mat[5]
        ];
        mat = newmat;
        $('#a11').val(mat[0]);
        $('#a21').val(mat[2]);
        $('#a12').val(mat[1]);
        $('#a22').val(mat[3]);
        $('#b1').val(mat[4]);
        $('#b2').val(mat[5]);
        redrawing = true;
    });
    $('.matrix').change(function () {
        for(var i = 0; i < 6; i++) {
            mat[i] = getValue(coeffNames[i],mat[i]);
        }
        redrawing = true;
    });
    var redrawing;
    var framerate = 1000/8;

    $('#image').load(function () {
        width = $(this)[0].width;
        height = $(this)[0].height;
        canvasElement.width = width*2*extent;
        canvasElement.height = height*2*extent;
        pageSpace = [width,0,0,-height,width*extent,height*extent];
        redrawing = true;
        redraw();
        window.setInterval(function () {
            if(redrawing) {
                redraw();
            }
        },framerate);
    });
 
});


