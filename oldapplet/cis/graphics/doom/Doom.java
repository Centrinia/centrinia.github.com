/* Doom.java */

package cis.graphics.doom;

public
    class Doom 
    extends 
	java.applet.Applet
    implements
	java.lang.Runnable
{
    protected cis.graphics.doom.Engine engine;
    
    protected java.lang.Thread runner;


    public
	void 
	init()
    {
	this.enableEvents(java.awt.AWTEvent.KEY_EVENT_MASK);
	engine = new cis.graphics.doom.Engine
	    (this,
	     java.lang.Math.PI / 3.0f,
	     null);

	return;
    }

    public void start()
    {
	if(this.runner == null)
	    {
		this.runner =
		    new java.lang.Thread(this);
		this.runner.start();
	    }

	return;
    }
    
    public void stop()
    {
	if(this.runner != null)
	    {
		this.runner.stop();
		this.runner = null;
	    }

	return;
    }

    public void update(java.awt.Graphics graphics)
    {
	graphics.drawImage
	    (this.engine.screen(),
	     0, 0,
	     this);

	return;
    }

    public
	void
	processEvent
	(java.awt.AWTEvent awt_event)
    {
	if(awt_event.getID() == java.awt.event.KeyEvent.KEY_PRESSED)
	    {
		int direction;

		
		switch
		    (((java.awt.event.KeyEvent) awt_event).getKeyCode())
		    {
		    case java.awt.event.KeyEvent.VK_UP:
			direction = cis.graphics.doom.Engine.directionForward;
			
			break;
			
		    case java.awt.event.KeyEvent.VK_DOWN:
			direction = cis.graphics.doom.Engine.directionBackward;
			
			break;
			
		    case java.awt.event.KeyEvent.VK_LEFT:
			direction = cis.graphics.doom.Engine.directionLeft;
			
			break;
			
		    case java.awt.event.KeyEvent.VK_RIGHT:
			direction = cis.graphics.doom.Engine.directionRight;
			
			break;
			
		    default:
			direction = 0;
			
			break;
		    }
		this.engine.move(direction);
	    }
System.out.println("event");
	super.processEvent(awt_event);

	return;
    }

    public void run()
    {
	while(true)
	    {
		this.engine.cast();

		this.repaint();

		try
		    {
			this.runner.sleep(200);
		    }
		catch(java.lang.InterruptedException interruptedException)
		    {
			return;
		    }
	    }
    }

    public
	static
	void
	main
	(java.lang.String argv[])
    {
	cis.graphics.doom.Doom
	    core;


	core = 
	    new
	    cis.graphics.doom.Doom();

	java.awt.Frame 
	    frame;


	frame =
	    new
	    java.awt.Frame();

	frame.add
	    (core);

	frame.resize(400, 400);
	frame.show();

	core.init();

	core.run();

	return;
    }
}
