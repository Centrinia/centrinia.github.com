/* Sector.java */

package cis.graphics.doom.level;

public class Sector
{
    protected double ceilingElevation;
    protected double floorElevation;
    
    protected int length;
    protected cis.graphics.doom.level.Linedef[] linedefs;


    public
	Sector
	(double floorElevation, 
	 double ceilingElevation)
    {
	this.linedefs = new cis.graphics.doom.level.Linedef[1];
	this.floorElevation = floorElevation;
	this.ceilingElevation = ceilingElevation;

	return;
    }

    public 
	final
	cis.graphics.doom.level.Linedef
	linedef
	(int index)
    {
	return this.linedefs[index];
    }
    
    public
	void 
	addLinedef
	(cis.graphics.doom.level.Linedef element)
    {
	cis.graphics.doom.level.Linedef[] 
	    newLinedefs;
	
	
	if(element.sector1() == null)
	    {
		element.sector1(this);
	    }
	else
	    {
		element.sector2(this);
	    }

	newLinedefs = 
	    new cis.graphics.doom.level.Linedef[this.linedefs() + 1];

	java.lang.System.arraycopy(linedefs, 
				   0, 
				   newLinedefs,
				   0,
				   this.linedefs());

	newLinedefs[this.linedefs()] =
	    element;
	
	this.linedefs = 
	    newLinedefs;
	this.length = 
	    this.linedefs.length;
    }
    
    public boolean inside(cis.graphics.doom.level.Point test)
    {
	int hits;
	int index;
	
	hits = 0;
	
	for(index = 0; index < this.linedefs(); index++)
	    {
		double dx;
		double dy;
		double rx;
		double ry;


		dx = linedef(index).point2().x - linedef(index).point1().x;
		dy = linedef(index).point2().y - linedef(index).point1().y;
		
		rx = test.x - linedef(index).point1().x;
		ry = test.y - linedef(index).point1().y;
		
		
		if(linedef(index).point1().y == test.y)
		    {
			ry--;
		    }
		if(linedef(index).point2().y == test.y)
		    {
			dy++;
		    }
		
		if(((ry >= 0) ^ (dy < 0)) && 
		   (java.lang.Math.abs(dy) >= java.lang.Math.abs(ry)))
		{
		    if((ry * dx / dy) > rx)
			{
			    hits++;
			}
		}
		
	    }
	
	return 
	    (hits & 1) != 0;
    }
    
    public 
	final
	cis.graphics.doom.level.Sector 
	interceptsSector
	(cis.graphics.doom.level.Point test)
    {
	int index;
	
	
	if(this.inside(test))
	{
	    return this;
	}
	
	for(index = 0; index < this.linedefs(); index++)
	    {
		cis.graphics.doom.level.Sector otherSector;


		otherSector = this.linedef(index).sector1();

		if(otherSector == this)
		{
		    otherSector = this.linedef(index).sector2();
		}
		if(otherSector.inside(test))
		{
		    return otherSector;
		}
	    }
	return null;
    }
    
    public 
	final
	double
	ceilingElevation()
    {
	return 
	    this.ceilingElevation;
    }

    public 
	final
	double
	floorElevation()
    {
	return
	    this.floorElevation;
    }
    
    public 
	final 
	int
	linedefs()
    {
	return
	    this.length;
    }
}
