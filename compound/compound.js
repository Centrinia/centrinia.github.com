
'use strict';

window.onload = function () {
    var INDICATOR_RADIUS = 1e-1;
    var SCALE = 1/7;
    var FRAMES_PER_SECOND = 7;
    var MAXIMUM_SUBDIVISIONS = 5000;

    var canvas = document.getElementById('canvas');
    var getMousecoord = function (event) {
        var elem = event.target || event.srcElement;
        var rect = elem.getBoundingClientRect();
        return [(2*(event.clientX - rect.left) / elem.width-1)/SCALE,
            (1-2*(event.clientY - rect.top) / elem.height)/SCALE];
    };



    var context = canvas.getContext('2d');
    context.save();

    context.scale(canvas.width,canvas.height);
    context.scale(1/2,1/2);
    context.translate(1,1);
    context.scale(SCALE,-SCALE);

    var arg = [0,0];
    var subdivisions = 1;

    var redraw = function () {
        context.clearRect(-1/SCALE,-1/SCALE, 2/SCALE,2/SCALE);
        context.lineWidth = 1e-1;
        context.beginPath();
        context.arc(0,0,1,0,Math.PI*2);
        context.stroke();


        context.lineWidth = 5e-2;
        context.beginPath();
        context.arc(arg[0],arg[1],INDICATOR_RADIUS,0,Math.PI*2);
        context.fill();

        context.lineWidth = 5e-3;
        var n = subdivisions;
        var base = [1+arg[0]/n, arg[1]/n];
        var previous = [1,0];
        context.beginPath();
        context.moveTo(0,0);
        context.lineTo(previous[0],previous[1]);
        context.stroke();

        for(var i = 0;i<subdivisions;i++) {
            var current = [
                base[0]*previous[0] - base[1]*previous[1],
                base[0]*previous[1] + base[1]*previous[0]
            ];
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo(current[0],current[1]);
            context.lineTo(previous[0],previous[1]);
            context.stroke();
            previous = current.slice(0);
        };
    };

    var setArg = function(x) {
        arg = x.slice(0);
        var str = '';

        if(arg[1] == 0) {
            str = arg[0].toString();
        } else if(arg[0] == 0) {
            if(arg[1] > 0) {
                str += 'i*' + arg[1].toString();
            } else {
                str += '- i*' + (-arg[1]).toString();
            }
        } else {
            str = arg[0].toString();
            if(arg[1] > 0) {
                str += ' + i*' + arg[1].toString();
            } else {
                str += ' - i*' + (-arg[1]).toString();
            }
        }
        document.getElementById('argSpan').innerHTML = str;
    };
    var setSubdivisions = function (n) {
        subdivisions = n;
        document.getElementById('subdivisionsSpan').innerHTML = subdivisions.toString();
    };
    document.getElementById('snapOption').onchange = function() {
        if(document.getElementById('snapOption').checked) {
            setSubdivisions(1);
            setArg([0,arg[1]]);
        }
    }

    canvas.onclick = function(event) {
        var coords = getMousecoord(event);
        setSubdivisions(1);
        if(document.getElementById('snapOption').checked) {
            setArg([0,coords[1]]);
        } else {
            setArg(coords);
        }
    };

    setArg([0,Math.PI]);
    setSubdivisions(1);
    var animate = function() {

        redraw();

        setSubdivisions(subdivisions + 1);
        if(subdivisions > MAXIMUM_SUBDIVISIONS) {
            setSubdivisions(1);
        }
    };
    window.setInterval(animate, 1000 / FRAMES_PER_SECOND);
};
