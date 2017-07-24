/* Engine.java */

package cis.graphics.doom;

public class Engine
{
    protected double fieldOfView;

    protected double viewangle;

    protected cis.graphics.doom.level.Sector playerPositionSector;
    protected cis.graphics.doom.level.Linedef randomLine;
    
    protected java.awt.Component targetScreen;
    protected java.awt.Graphics drawScreen;
    protected java.awt.Image screen;
    protected java.awt.Image texture;
    protected java.awt.Dimension screenSize;
    protected java.util.Random random;
    
    protected java.awt.Image[] textureStrips;
    
    public static final int directionBackward = 0x80;
    public static final int directionForward = 0x81;
    public static final int directionLeft = 0x10;
    public static final int directionRight = 0x11;
    public static final double stepLength = 6.0f;
    public static final double turnRate = java.lang.Math.PI * 3.0f / 180.0f;

    public static final double maximum = 1.0e+100;

    protected cis.graphics.doom.level.Point player;
    protected int playerElevation;

    cis.graphics.doom.level.Sector firstSector;
    cis.graphics.doom.level.Sector secondSector;
    cis.graphics.doom.level.NullSector nullSector;


    public Engine(java.awt.Component targetScreen, 
		  double fieldOfView, 
		  java.awt.Image texture)
    {
	int index;
	
	java.awt.Graphics textureGraphics;


	random = new java.util.Random();

	this.targetScreen = targetScreen;
	this.screen = 
	    this.targetScreen.createImage
	    (targetScreen.size().width, 
	     targetScreen.size().height);

	this.screenSize = targetScreen.size();
	this.drawScreen = screen.getGraphics();
	this.fieldOfView = fieldOfView;

	this.player = 
	    new cis.graphics.doom.level.Point
	    (screenSize.width / 2.0f, 
	     screenSize.height / 2.0f);

	this.playerElevation = 10;
	

	/*randomLine = 
	    new cis.graphics.doom.level.Linedef
	    ((int)(random.nextFloat() * screenSize.width), 
	     (int)(random.nextFloat() * screenSize.height), 
	     (int)(random.nextFloat() * screenSize.width), 
	     (int)(random.nextFloat() * screenSize.height), 
	     false);*/

	this.texture = texture;

	{
	    cis.graphics.doom.level.Linedef sectorLine1;
	    cis.graphics.doom.level.Linedef sectorLine2;


	    firstSector = 
		new cis.graphics.doom.level.Sector
		(0, 30);
	    secondSector =
		new cis.graphics.doom.level.Sector
		(5, 25);
	    nullSector =
		new cis.graphics.doom.level.NullSector
		();

	    sectorLine1 =
		new cis.graphics.doom.level.Linedef
		(0, 0, 
		 screenSize.width >> 1,
		 screenSize.height >> 2, 
		 true, 
		 this.nullSector);
		
	    sectorLine2 = 
		new cis.graphics.doom.level.Linedef
		(screenSize.width >> 1, 
		 screenSize.height >> 2,
		 screenSize.width, 
		 0, 
		 true, 
		 this.nullSector);

	    secondSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (0, 
		  0, 
		  screenSize.width >> 1, 
		  - (screenSize.height << 3), 

		  false,
		  this.nullSector));

	    secondSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (screenSize.width >> 1,
		  - (screenSize.height << 3), 
		  screenSize.width, 
		  0,

		  false, 
		  this.nullSector));

	    secondSector.addLinedef
		(sectorLine1);
	    secondSector.addLinedef
		(sectorLine2);

	    firstSector.addLinedef
		(sectorLine1);
	    firstSector.addLinedef
		(sectorLine2);

	    firstSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (screenSize.width, 
		  0, 
		  screenSize.width - (screenSize.width >> 2), 
		  screenSize.height >> 1, 
		  false,
		  this.nullSector));

	    firstSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (screenSize.width - (screenSize.width >> 2), 
		  screenSize.height >> 1, 
		  screenSize.width, 
		  screenSize.height, 
		  false, 
		  this.nullSector));

	    firstSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (screenSize.width, 
		  screenSize.height,
		  screenSize.width >> 1,
		  screenSize.height - (screenSize.height >> 2),
		  false, 
		  this.nullSector));

	    firstSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (screenSize.width >> 1, 
		  screenSize.height - (screenSize.height >> 2), 
		  0, 
		  screenSize.height,
		  false, this.nullSector));

	    firstSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (0, 
		  screenSize.height, 
		  screenSize.width >> 2,
		  screenSize.height >> 1, 
		  false,
		  this.nullSector));

	    firstSector.addLinedef
		(new cis.graphics.doom.level.Linedef
		 (screenSize.width >> 2, 
		  screenSize.height >> 1,
		  0,
		  0, 
		  false, 
		  this.nullSector));
	    
	    playerPositionSector = 
		firstSector.interceptsSector(player);
	}
    }


    public void move(int direction)
    {
	double xDelta;
	double yDelta;

	double previous_viewangle;
	cis.graphics.doom.level.Point previous_position;
	cis.graphics.doom.level.Sector previous_sector;
	double px;
	double py;

	previous_sector = this.playerPositionSector;
	previous_viewangle = this.viewangle;
	px = this.player.x;
	py = this.player.y;
	if((direction & directionForward & directionBackward) != 0)
	    {
		xDelta = 
		    java.lang.Math.cos
		    (this.viewangle);

		yDelta = 
		    java.lang.Math.sin
		    (this.viewangle);

		if(direction == directionBackward)
		    {
			xDelta = - xDelta;
			yDelta = - yDelta;
		    }

		player.x += 
		    xDelta * 
		    this.stepLength;

		player.y += 
		    yDelta *
		    this.stepLength;
	    }
	else
	{
	    if(direction == directionLeft)
		{
		    this.viewangle -= 
			turnRate;
		}
	    else if(direction == directionRight)
		{
		    this.viewangle +=
			turnRate;
		}		
	}

	previous_sector = this.playerPositionSector;
	this.playerPositionSector = 
	  this.playerPositionSector.interceptsSector(player);

	/*if(previous_sector != 
	   this.playerPositionSector)
	    {
		this.player.x = px;
		this.player.y = py;
		this.viewangle = previous_viewangle;
		playerPositionSector = previous_sector;
	    }*/

	if(playerPositionSector == null)
	    {
		playerPositionSector = this.nullSector;
		}

	return;
    }

    public final void clearDrawScreen()
    {
	this.drawScreen.setColor
	    (java.awt.Color.blue);
	this.drawScreen.fillRect
	    (0,
	     0, 
	     screenSize.width,
	     screenSize.height >> 1);
	
	this.drawScreen.setColor
	    (java.awt.Color.green);
	this.drawScreen.fillRect
	    (0, 
	     screenSize.height >> 1, 
	     screenSize.width,
	     screenSize.height);
	
	/*this.drawScreen.setColor
	    (java.awt.Color.black);
	this.drawScreen.fillRect
	    (0, 
	     0,
	     this.targetScreen.size().width, 
	     this.targetScreen.size().height);*/
	
	/*this.drawScreen.drawImage
	    (texture, 
	     0, 0, 
	     this.targetScreen.size().width, 
	     this.targetScreen.size().height >> 1, 
	     this.targetScreen);*/

	return;	
   }
    
    public 
	static 
	final
	double 
	distance(cis.graphics.doom.level.Point origin, 
		 cis.graphics.doom.level.Point interceptionPoint, 
		 double sine, double cosine)
    {
	double destination;


	destination =  
	    cosine * 
	    (interceptionPoint.x - origin.x);
	destination +=
	    sine * 
	    (interceptionPoint.y - origin.y);

	return destination;
    }

    public
	final 
	java.awt.Image 
	screen()
    {
	return screen;
    }

    protected
	final 
	boolean 
	intercepts(cis.graphics.doom.level.Linedef line, 
		   double sine, double cosine)
    {
	double linePointSlopeFraction1;
	double linePointSlopeFraction2;
	double linePointSlopeWhole1;
	double linePointSlopeWhole2;
	

	linePointSlopeWhole1 = 
	    cosine *
	    (line.point1().y - player.y);
	linePointSlopeWhole2 = 
	    cosine * 
	    (line.point2().y - player.y);

	linePointSlopeFraction1 =
	    sine * 
	    (line.point1().x - player.x);
	linePointSlopeFraction2 = 
	    sine * 
	    (line.point2().x - player.x);
	
	if(((linePointSlopeFraction1 >= linePointSlopeWhole1) ^ 
	    (linePointSlopeWhole2 <= linePointSlopeFraction2)) == true)
	    {
		return true;
	    }
	else
	    {
		return false;
	    }
    }

    protected 
	final
	cis.graphics.doom.level.Point 
	intercept(cis.graphics.doom.level.Linedef line, 
		  double sine, double cosine, 
		  double projectionPointIntercept)
    {
	double determinant;
	double xDeterminant;
	double yDeterminant;
	
	cis.graphics.doom.level.Point destination;


	determinant =
	    (line.sine() * cosine) - 
	    (line.cosine() * sine);

	xDeterminant =
	    (projectionPointIntercept * line.cosine()) - 
	    (line.axisIntercept() * cosine);
	yDeterminant = 
	    (projectionPointIntercept * line.sine()) - 
	    (line.axisIntercept() * sine);
	
	if(determinant == 0.0f)
	    {
	    return line.point1();
	}

	destination = 
	    new cis.graphics.doom.level.Point
	    (xDeterminant / determinant,
	     yDeterminant / determinant);

	return destination;
    }

    protected
	final
	cis.graphics.doom.level.InterceptionData 
	interceptSector
	(cis.graphics.doom.level.Sector sector, 
	 double sine, double cosine, 
	 double projectionPointIntercept, 
	 double absoluteMinimalDistance)
    {
	int index;
	
	cis.graphics.doom.level.Interceptions 
	    interceptions;
	cis.graphics.doom.level.InterceptionData
	    currentInterceptionData;
	

	interceptions = 
	    new cis.graphics.doom.level.Interceptions(sector.linedefs());
	
	for(index = 0; index < sector.linedefs(); index++)
	    {
		cis.graphics.doom.level.Point interceptionPoint;
		cis.graphics.doom.level.Linedef targetLine;
				

		targetLine = sector.linedef(index);
		if(this.intercepts(targetLine, sine, cosine))
		    {
			double distance;
			
			
			interceptionPoint = 
			    this.intercept
			    (targetLine, 
			     sine, cosine,
			     projectionPointIntercept);
			distance = 
			    cis.graphics.doom.Engine.distance
			    (player,
			     interceptionPoint,
			     sine, cosine);
			
			if(distance > 0)
			    {			       
				cis.graphics.doom.level.InterceptionData
				    newInterceptionData;


				newInterceptionData = 
				    new 
				    cis.graphics.doom.level.InterceptionData
				    (targetLine, 
				     distance,
				     interceptionPoint,
				     sector);
				
				interceptions.addInterception
				    (newInterceptionData);
			    }
		    }
	    }
	
	return 
	    interceptions.closestInterception
	    (absoluteMinimalDistance);
    }

    public void cast()
    {
	int index;
	int halfScreenHeight;

	double angleDelta;

	double incrementSquare;
	double currentViewangle;
	    
	/*int textureHeight;
	int textureWidth;*/


	cis.graphics.doom.level.Sector currentSector;


	angleDelta = 
	    this.fieldOfView
	    / (double)this.screenSize.width;

	currentViewangle =
	    this.viewangle - 
	    (this.fieldOfView / 2.0f);
	
	halfScreenHeight = this.screenSize.height >> 1;
	
	/*textureWidth = this.texture.getWidth(targetScreen);
	  textureHeight = this.texture.getHeight(targetScreen);*/
	
	this.clearDrawScreen();
	
	/*drawScreen.setColor(java.awt.Color.red);
	  drawScreen.drawLine(randomLine.point1().x, randomLine.point1().y, randomLine.point2().x, randomLine.point2().y);*/
	
	//this.drawScreen.setColor(java.awt.Color.cyan);

	for(index = 0; index < screenSize.width; index++)
	    {
		boolean casting;
	
		int iax;

		double minimalDistance;
		
		double previousTopScale;
		double previousBottomScale;
		    
		double cosine;
		double sine;
		double projectionPointIntercept;

		cis.graphics.doom.level.Interceptions interceptions;


		currentSector = this.playerPositionSector;
				
		incrementSquare =
		    halfScreenHeight /
		    java.lang.Math.cos(currentViewangle -
				       this.viewangle);

		cosine = 
		    java.lang.Math.cos
		    (currentViewangle);
		sine =
		    java.lang.Math.sin
		    (currentViewangle);

		projectionPointIntercept = 
		    (cosine * player.y) - 
		    (sine * player.x);
		
		previousTopScale = this.maximum;
		previousBottomScale = this.maximum;
		
		interceptions = 
		    new 
		    cis.graphics.doom.level.Interceptions
		    (0);
		minimalDistance = 
		    0.0f;

		casting = true;		
	    finishedCasting:
		while(casting)
		    {
			cis.graphics.doom.level.InterceptionData 
			    currentInterception;

			cis.graphics.doom.level.Linedef 
			    testingLinedef;


			currentInterception = 
			    this.interceptSector
			    (currentSector, 
			     sine, cosine, 
			     projectionPointIntercept, 
			     minimalDistance);
			
			if(currentInterception == null)
			    {
				break finishedCasting;
			    }

			testingLinedef = 
			    currentInterception.targetLine();
			minimalDistance =
			    currentInterception.distance();
			
			casting = 
			    testingLinedef.twoSided();
			if(casting)
			    {
				if
				    (testingLinedef.sector1() !=
				     currentSector)
				    {
					currentSector = 
					    testingLinedef.sector1();
				    }
				else if
				    (testingLinedef.sector2() != 
				     currentSector)
				    {
					currentSector = 
					    testingLinedef.sector2();
				    }
			    }
			
			interceptions.append
			    (currentInterception);
		    }
		
		for(iax = interceptions.length() - 1; iax >= 0; iax--)
		    {
			int textureStrip;

			double topScale;
			double bottomScale;
				
			double distance;

			cis.graphics.doom.level.InterceptionData 
			    currentInterceptionData;
			cis.graphics.doom.level.Sector 
			    previousSector;
				

			currentInterceptionData = 
			    interceptions.interception(iax);
			distance = 
			    currentInterceptionData.distance();

			previousSector = 
			    currentInterceptionData.targetSector();

			textureStrip = 
			    (int)currentInterceptionData.targetLine().point2Distance
			    (currentInterceptionData.interceptionPoint());

			topScale = 0.0f;
			bottomScale = 0.0f;

			textureStrip &= 0xffff;

			this.drawScreen.setColor
			    (new java.awt.Color
			     (textureStrip << 8));
			
			if(currentInterceptionData.targetLine().twoSided() &&
			   (iax != (interceptions.length() - 1)))
			    {
				cis.graphics.doom.level.Sector 
				    targetedSector;


				targetedSector = 
				    interceptions.
				    interception(iax + 1).
				    targetSector();

				{
				    boolean renderCeilingOffset;
				    

				    renderCeilingOffset =
					targetedSector.ceilingElevation() <
					previousSector.ceilingElevation();
				    
				    topScale = 
					incrementSquare * 
					(previousSector.ceilingElevation() - 
					 this.playerElevation);
				    topScale /= distance;
				    
				    bottomScale = 
					incrementSquare * 
					(targetedSector.ceilingElevation() - 
					 this.playerElevation);
				    bottomScale /= distance;
				    

				    if(renderCeilingOffset == true)
					{
					    this.drawScreen.setColor
						(new java.awt.Color
						 (textureStrip << 8));
					    
					    this.drawScreen.drawLine
						(index, 
						 halfScreenHeight - 
						 (int)bottomScale, 
						 
						 index, 
						 halfScreenHeight - 
						 (int)topScale);
					    
					    this.drawScreen.setColor
						(java.awt.Color.gray);
				    
					    this.drawScreen.drawLine
						(index, 
						 halfScreenHeight - 
						 (int)previousTopScale, 
					     
						 index, 
						 halfScreenHeight - 
						 (int)bottomScale);

					    previousTopScale = bottomScale;
					}
				    else
					{
					    previousTopScale = topScale;
					}
				}
				
				{
				    boolean renderFloorOffset;
				    
				    
				    topScale = 
					incrementSquare * 
					(this.playerElevation -
					 targetedSector.floorElevation());
				    topScale /= distance;
				    
				    bottomScale = 
					incrementSquare * 
					(this.playerElevation -
					 previousSector.floorElevation());
				    bottomScale /= distance;
				    
				    renderFloorOffset = 
					targetedSector.floorElevation() >
					previousSector.floorElevation();
				    
				    if(renderFloorOffset == true)
					{
					    this.drawScreen.setColor
						(new java.awt.Color
						 (textureStrip << 8));
					    
					    this.drawScreen.drawLine
						(index, 
						 halfScreenHeight + 
						 (int)bottomScale,
						 
						 index, 
						 halfScreenHeight + 
						 (int)topScale);
					    
					    this.drawScreen.setColor
						(java.awt.Color.black);

					    if(previousBottomScale != 
					       this.maximum)
						{
						    this.drawScreen.drawLine
							(index, 
							 halfScreenHeight +
							 (int)topScale, 
							 
							 index, 
							 halfScreenHeight + 
							 (int)previousBottomScale);
						}

					    previousBottomScale = 
						topScale;
					}
				    else
				      {
					  previousBottomScale =
					      bottomScale;
				      }
				}
			    }
			else
			    {
				topScale = 
				    incrementSquare * 
				    (previousSector.ceilingElevation() -
				     this.playerElevation);
				topScale /= distance;
				
				bottomScale = 
				    incrementSquare * 
				    (this.playerElevation - 
				     previousSector.floorElevation());
				bottomScale /= distance;
				
				
				this.drawScreen.drawLine
				    (index, 
				     halfScreenHeight + 
				     (int)bottomScale, 
				     
				     index, 
				     halfScreenHeight - 
				     (int)topScale);
				
				
				/*this.drawScreen.drawLine
				    ((int)this.player.x,
				     (int)this.player.y, 
				     
				     (int)currentInterceptionData.
				     interceptionPoint().x, 
				     
				     (int)currentInterceptionData.
				     interceptionPoint().y);*/    

				previousBottomScale = bottomScale;
				previousTopScale = topScale;
			    }
		    }

		currentViewangle += angleDelta;
	    }
    }
}







