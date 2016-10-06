
'use strict';

function drawPattern(context, orientation, centerColor, count, color, background) {
    context.save();
    if(orientation) {
        context.translate(0.5,0.5);
        context.rotate(Math.PI/2)
        context.translate(-0.5,-0.5);
    }


    var height = 1.0 / (2 * count - 1);
    context.beginPath();
    context.fillStyle = background;
    context.rect(0, 0, 1, 1);
    context.fill();
     
    context.beginPath();
    context.fillStyle = color;
    for(var i = 0; i < count; i++) {
        var y = (2 * i) * height;
        context.rect(0, y, 1, height);
        context.fill();
    }
    if(centerColor) {
        context.beginPath();
        context.fillStyle = centerColor;
        context.arc(0.5,0.5,height/2,0, 2 * Math.PI);
        context.fill();
    }
    context.restore();
}

function drawDefault(context) {
    var COUNT = 10;
    var PADDING = 0.01;
    context.save();

    context.scale(0.5,0.5);

    context.save();
    context.translate(PADDING,PADDING);
    context.scale(1-2*PADDING,1-2*PADDING);
    drawPattern(context, false, null, COUNT, 'black', 'white');
    context.restore();

    context.save();
    context.translate(PADDING,PADDING);
    context.translate(1,1);
    context.scale(1-2*PADDING,1-2*PADDING);
    drawPattern(context, false, null, COUNT, 'black', 'white');
    context.restore();

    context.save();
    context.translate(PADDING,PADDING);
    context.translate(1,0.0);
    context.scale(1-2*PADDING,1-2*PADDING);
    drawPattern(context, true, null, COUNT, 'black', 'white');
    context.restore();

    context.save();
    context.translate(PADDING,PADDING);
    context.translate(0,1);
    context.scale(1-2*PADDING,1-2*PADDING);
    drawPattern(context, true, null, COUNT, 'black', 'white');
    context.restore();

    context.restore();
}

$(document).ready(function() {
    var COUNT = 20;
    var ROTATION_RATE = 15.0;
    var ROTATION_FRAMERATE = 1000.0 / 30.0;
    var INTERVAL_TIME = 2000;
    var TOTAL_TIME = 1000 * 60 * 3;
    var INTERVAL_COUNT = Math.floor(TOTAL_TIME / INTERVAL_TIME);
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	$('#prompt').text('The McCollough Effect');

    canvas.height = Math.floor(window.innerHeight *7/8);
    canvas.width = canvas.height;


    var progress = 'starting';
    var timer = null;
    var intervals = 0;
    function displayInduction() {
        var color;
        if(intervals >= INTERVAL_COUNT || progress != 'inducingAnimation') {
            progress = 'review';
            click();
            return;
        }
        updateAnimationCaption();
        color = (intervals % 2 == 0) ? 'red' : 'lime';
        intervals++;
        if(color == 'red') {
            drawPattern(context, false, 'white', COUNT, color, 'black');
        } else if(color == 'lime') {
            drawPattern(context, true, 'white', COUNT, color, 'black');
        }
    }

    var rotationAngle = 0;
    function displayRotation() {
        context.save();
        context.clearRect(0,0,1,1);
        context.translate(0.5,0.5);
        context.rotate(rotationAngle*2*Math.PI/360);
        context.translate(-0.5,-0.5);
        rotationAngle += ROTATION_RATE * ROTATION_FRAMERATE / 1000.0;
        drawPattern(context, false, null, COUNT, 'black','white');
        context.restore();
    }

    var updateAnimationCaption = function() {
        var t = Math.floor((1 - intervals / INTERVAL_COUNT) * TOTAL_TIME / 1000);
        $('#prompt').text('Look at the center of the patterns for the next ' + ~~(t/60) + ' minutes and ' + (t%60) + ' seconds.');
    }
    var click = function () {
        if(progress == 'starting') {
            $('#prompt').text('Look at the pattern below. Note that the next step may cause long term brain changes.');
            context.clearRect(0,0,1,1);
            drawDefault(context);
            $('#start').text('Next');
            progress = 'inducing';
        } else if(progress == 'inducing') {
            updateAnimationCaption();
            progress = 'inducingAnimation';
            displayInduction();
            timer = window.setInterval(displayInduction, INTERVAL_TIME);
        } else if(progress == 'inducingAnimation' || progress == 'review') {
            window.clearInterval(timer);
            $('#prompt').text('Look at the original pattern again. Notice the apparent color change.');
            context.clearRect(0,0,1,1);
            drawDefault(context);
            progress = 'rotating';
        } else if(progress == 'rotating') {
            $('#prompt').text('Notice the apparent color changes when the pattern rotates.');
            timer = window.setInterval(displayRotation, ROTATION_FRAMERATE);
            progress = 'ending';
            $('#start').text('End');
        } else if(progress == 'ending') {
            $('#prompt').text('The McCollough Effect');
            window.clearInterval(timer);
            context.clearRect(0,0,1,1);
            progress = 'starting';
            $('#start').text('Start');
        }
    }

    context.scale(canvas.width,canvas.height);
	$('#start').click(function(event) {
        event.preventDefault();
        click();
	});
});
