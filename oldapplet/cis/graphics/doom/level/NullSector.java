package cis.graphics.doom.level;

public final class NullSector extends cis.graphics.doom.level.Sector
{
	public NullSector()
	{
		super(0, 0);
	}

	public final void addLinedef(cis.graphics.doom.level.Linedef element)
	{
		super.addLinedef(element);
		element.nullSector(this);
	}
}