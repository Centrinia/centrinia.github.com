package cis.graphics.doom.level;

public final class Linedef implements java.lang.Runnable
{
    protected boolean twoSided;
    
    protected double cosine;
    protected double sine;
    protected double axisIntercept;
    
    protected int offset;
    
    private cis.graphics.doom.level.Sector sector1;
    private cis.graphics.doom.level.Sector sector2;
    private cis.graphics.doom.level.NullSector nullSector;
    
    private cis.graphics.doom.level.Point point1;
    private cis.graphics.doom.level.Point point2;
    
    protected java.lang.Thread runner;
    

    public Linedef(double x1, double y1, 
		   double x2, double y2, 
		   boolean isTwoSided, 
		   cis.graphics.doom.level.NullSector nullSector)
    {
	double distance;
	double xDistance;
	double yDistance;
	
	this.point1 =
	    new 	    
	    cis.graphics.doom.level.Point
	    (x1, y1);
	this.point2 = 
	    new
	    cis.graphics.doom.level.Point
	    (x2, y2);

	xDistance =
	    this.point2().x - this.point1().x;
	yDistance =
	    this.point2().y - this.point1().y;

	distance = java.lang.Math.sqrt
	    ((xDistance * xDistance) + 
	     (yDistance * yDistance));
	
	this.cosine = xDistance / distance;
	this.sine = yDistance / distance;
	this.axisIntercept = 
	    (this.cosine() * this.point2().y) - 
	    (this.sine() * this.point2().x);
	
	this.twoSided = isTwoSided;
	
	if(!this.twoSided())
	    {
		nullSector.addLinedef(this);
	    }

	/*if(runner == null)
	  {
	  runner = new java.lang.Thread(this);
	  runner.setPriority(1);
	  runner.start();
	  }*/

	return;
    }
    
    public 
	final
	cis.graphics.doom.level.Point
	point1()
    {
	return this.point1;
    }
    
    public 
	final 
	cis.graphics.doom.level.Point 
	point2()
    {
	return this.point2;
    }
    
    public 
	final
	cis.graphics.doom.level.Sector 
	sector1()
    {
	return this.sector1;
    }
    
    public
	final 
	cis.graphics.doom.level.Sector 
	sector2()
    {
	return this.sector2;
    }

    public
	final 
	cis.graphics.doom.level.NullSector
	nullSector()
    {
	return this.nullSector;
    }
    
    public 
	final 
	void
	sector1(cis.graphics.doom.level.Sector newSector)
    {
	if(this.sector1() == null)
	{
	    this.sector1 = newSector;
	}
	
	return;
    }
    
    public final void sector2(cis.graphics.doom.level.Sector newSector)
    {
	if(this.sector2() == null)
	    {
		this.sector2 = newSector;
	    }
	
	return;
    }
    
    public 
	final
	void
	nullSector(cis.graphics.doom.level.NullSector newSector)
    {
	if(this.nullSector() == null)
	    {
		this.nullSector = newSector;
	    }

	return;
    }

    public
	final 
	double
	point1Distance(cis.graphics.doom.level.Point interceptionPoint)
    {
	double destination;


	destination =
	    cis.graphics.doom.Engine.distance(this.point1(), 
					      interceptionPoint, 
					      this.sine, this.cosine);

	return destination;
    }

    public
	final
	double 
	point2Distance(cis.graphics.doom.level.Point
		       interceptionPoint)
    {
	double destination;
	
	
	destination = 
	    cis.graphics.doom.Engine.distance(this.point2(), 
					      interceptionPoint, 
					      this.sine, this.cosine);
	
	return destination;
    }

    public
	final
	double
	cosine()
    {
	return this.cosine;
    }

    public
	final 
	double
	sine()
    {
	return this.sine;
    }

    public 
	final 
	double axisIntercept()
    {
	return this.axisIntercept;
    }
    
    public
	final 
	boolean
	twoSided()
    {
	return this.twoSided;
    }
    
    public void run()
    {
    }
}
