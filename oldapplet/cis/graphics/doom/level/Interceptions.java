package cis.graphics.doom.level;

public final class Interceptions
{
    private int length;
    private cis.graphics.doom.level.InterceptionData[] list;
    
    
    public
	Interceptions(int inputSize)
    {
	this.list = new cis.graphics.doom.level.InterceptionData[inputSize];
	this.length = 0;
    }
    
    public final cis.graphics.doom.level.InterceptionData 
	closestInterception(double minimalDistance)
    {
	int index;

	double maximalDistance;

	cis.graphics.doom.level.InterceptionData closestInterception;

	
	maximalDistance = 100000000.0f;
	closestInterception = null;
	
	for(index = 0; index < this.length(); index++)
	{
	    if((this.interception(index).distance() >
		minimalDistance) && 
	       (this.interception(index).distance() <
		maximalDistance))
		{
		    closestInterception = 
			this.interception(index);
		    maximalDistance = 
			this.interception(index).distance();
		}
	}
	return closestInterception;
    }

    public final void 
	append(cis.graphics.doom.level.InterceptionData element)
    {
	cis.graphics.doom.level.InterceptionData[] newInterceptions;
	
	
	newInterceptions = 
	    new cis.graphics.doom.level.InterceptionData[this.length() + 1];
	
	java.lang.System.arraycopy(this.list, 
				   0, 
				   newInterceptions, 
				   0, 
				   this.length());
	
	newInterceptions[this.length()] = 
	    element;
	
	this.list =
	    newInterceptions;
	this.length = 
	    this.list.length;
    }
    
    public final int 
	length()
    {
	return this.length;
    }
    
    public final void 
	addInterception(cis.graphics.doom.level.InterceptionData input)
    {
	this.list[this.length++] = input;
    }

    public final cis.graphics.doom.level.InterceptionData 
	interception(int index)
    {
	return this.list[index];
    }
}




