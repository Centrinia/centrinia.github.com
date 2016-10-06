	function abs(x) {
		return x < 0 ? -x : x;
	}
	function drawScanline(pixels,width,height,depth,color,x0,x1,y) {
		if(x1<x0) {
			var t = x0;
			x0 = x1;
			x1 = t;
		}
		for(var x=x0,index=(y*width+x0)*depth;x<x1;x++,index+=depth) {
			for(var i=0;i<depth;i++) {
				pixels[index+i] = color[i];
			}
		}
	}

	function plot(pixels,width,height,depth,color,x,y) {
		var index = (y*width+x)*depth;
		for(var i=0;i<depth;i++) {
			pixels[index+i] = color[i];
		}
	}
	function drawLine(pixels,width,height,depth,x0,y0,x1,y1,color) {
		var dx = abs(x1-x0);
		var dy = abs(y1-y0);
		var sx = x0<x1 ? 1 : -1;
		var sy = y0<y1 ? 1 : -1;
		var err = dx-dy;

		for(;;) {
			plot(pixels,width,height,depth,color,x0,y0);
			if(x0==x1 && y0==y1) {
				break;
			}
			var e2 = 2*err;
			if(e2>-dy) {
				err -= dy;
				x0 += sx;
			}
			if(x0 == x1 && y0==y1) {
				plot(pixels,width,height,depth,color,x0,y0);
				break;
			}
			if(e2 < dx) {
				err += dx;
				y0 += sy;
			}
		}
	}

 	function drawTriangle(pixels,width,height,depth,x0,y0,x1,y1,x2,y2,color) {
		var endpoints = [[x0,y0],[x1,y1],[x2,y2]];
		for(var i=0;i<3;i++) {
			var index =i;
			for(var j=i+1;j<3;j++) {
				if(endpoints[j][1] < endpoints[index][1]) {
					index = j;
				}
			}
			var t = endpoints[i];
			endpoints[i] = endpoints[index];
			endpoints[index] = t;
		}
		x0 = endpoints[0][0];
		x1 = endpoints[1][0];
		x2 = endpoints[2][0];
		y0 = endpoints[0][1];
		y1 = endpoints[1][1];
		y2 = endpoints[2][1];

		var dx01 = abs(x1-x0);
		var dy01 = abs(y1-y0);
		var sx01 = x0<x1 ? 1 : -1;
		var sy01 = y0<y1 ? 1 : -1;
		var err01 = dx01-dy01;


		var dx02 = abs(x2-x0);
		var dy02 = abs(y2-y0);
		var sx02 = x0<x2 ? 1 : -1;
		var sy02 = y0<y2 ? 1 : -1;
		var err02 = dx02-dy02;

		var x01 = x0;
		var y01 = y0;
		var x02 = x0;
		var y02 = y0;
		for(var y=y0;y<y1;y++) {
			while(y01 < y) {
				var e01 = 2*err01;
				if(e01>-dy01) {
					err01 -= dy01;
					x01 += sx01;
				}
	
				if(e01 < dx01) {
					err01 += dx01;
					y01 += sy01;
				}
			}

			while(y02 < y) {
				var e02 = 2*err02;
				if(e02>-dy02) {
					err02 -= dy02;
					x02 += sx02;
				}
	
				if(e02 < dx02) {
					err02 += dx02;
					y02 += sy02;
				}
			}
			drawScanline(pixels,width,height,depth,color,x01,x02,y);
		}
		var dx12 = abs(x2-x1);
		var dy12 = abs(y2-y1);
		var sx12 = x1<x2 ? 1 : -1;
		var sy12 = y1<y2 ? 1 : -1;
		var err12 = dx12-dy12;


		var x12 = x1;
		var y12 = y1;
		for(var y=y1;y<=y2;y++) {
			while(y12 < y) {
				var e12 = 2*err12;
				if(e12>-dy12) {
					err12 -= dy12;
					x12 += sx12;
				}
	
				if(e12 < dx12) {
					err12 += dx12;
					y12 += sy12;
				}
			}

			while(y02 < y) {
				var e02 = 2*err02;
				if(e02>-dy02) {
					err02 -= dy02;
					x02 += sx02;
				}
	
				if(e02 < dx02) {
					err02 += dx02;
					y02 += sy02;
				}
			}
			drawScanline(pixels,width,height,depth,color,x12,x02,y);
		}
	
	}

            function Example01() 
            {
                // Create and init an instance
                var tinyC5 = new TinyC5();
                var args = {
                    supportMobile: true,
                    width: 1024,
                    height:1024,
                    scale: 1,
                    container: document.getElementById( 'tinyC5_container' ), 
                    title: 'TV Noise - TinyC5 Example #01' 
                };
                tinyC5.init( args );

                // Create larger backBuffer                
                var backBuffer = new Array( tinyC5.WIDTH * 3 * tinyC5.HEIGHT * 4 );
                
                // Precalculate the backBuffer
                for (var i = 0; i < tinyC5.pixels.length; i ++) 
                {
                    tinyC5.pixels[i] = 0;
                }
		var rendered = false;
                // Overwrite update function with our stunning effect
                tinyC5.update = function() 
                {
			for(var j=0;j<100;j++)  {
			var x0 = Math.floor(Math.random() * tinyC5.WIDTH);
			var y0 = Math.floor(Math.random() * tinyC5.HEIGHT);
			var x1 = Math.floor(Math.random() * tinyC5.WIDTH);
			var y1 = Math.floor(Math.random() * tinyC5.HEIGHT);

			var color = [0,0,0,255];
			for(var i=0;i<4;i++) {
				color[i] = Math.floor(Math.random() * 255);
			}
			//drawLine(tinyC5.pixels,tinyC5.WIDTH,tinyC5.HEIGHT,4,x0,y0,x1,y1,color);

			var x2 = Math.floor(Math.random() * tinyC5.WIDTH);
			var y2 = Math.floor(Math.random() * tinyC5.HEIGHT);
			drawTriangle(tinyC5.pixels,tinyC5.WIDTH,tinyC5.HEIGHT,4,x0,y0,x1,y1,x2,y2,color);

			rendered = true;
			}
                };

                
                // Get the canvas object
                var canvas = tinyC5.getCanvas();
                canvas.addEventListener( tinyC5.FAST_CLICK_EVENT, function(e) { 
                    tinyC5.setFullscreen( !tinyC5.isFullscreen() );
                } );

                // Start the show
                tinyC5.start();
            }
     
