package cis.graphics.doom.level;

public final class InterceptionData
{
    private double distance;

    private cis.graphics.doom.level.Linedef targetLine;
    private cis.graphics.doom.level.Point interceptionPoint;
    private cis.graphics.doom.level.Sector targetSector;
    
    public 
	InterceptionData(cis.graphics.doom.level.Linedef targetLine,
			 double distance, 
			 cis.graphics.doom.level.Point interceptionPoint, 
			 cis.graphics.doom.level.Sector targetSector)
    {
	this.targetLine = targetLine;
	this.distance = distance;
	this.interceptionPoint = interceptionPoint;
	this.targetSector = targetSector;
    }

    public final cis.graphics.doom.level.Linedef 
	targetLine()
    {
	return this.targetLine;
    }

    public final double
	distance()
    {
	return this.distance;
    }

    public final cis.graphics.doom.level.Point
	interceptionPoint()
    {
	return this.interceptionPoint;
    }
	
    public final cis.graphics.doom.level.Sector 
	targetSector()
    {
	return this.targetSector;
    }
}
