// Copyright (c) 2015, Josh. All rights reserved. Use of this source code
// is governed by a BSD-style license that can be found in the LICENSE file.

import 'dart:math';
import 'dart:html';
import 'dart:async';
import 'package:vector_math/vector_math.dart';

double sinh(double x) {
  double y = exp(x);
  return 0.5 * y - 0.5 / y;
}
/**
 * Randomly generate a normally distributed number.
 * 
 * @param mu the mean
 * @param sigma the standard deviation
 * @param rng a random number generator
 * 
 */
double gaussianNoise(Random rng, double mu, double sigma) {
  const EPSILON = 1e-7;
  double u1, u2;

  u2 = rng.nextDouble();

  do {
    u1 = rng.nextDouble();
  } while (u1 <= EPSILON);

  double z0 = sqrt(-2.0 * log(u1)) * cos(2.0 * PI * u2);
  return z0 * sigma + mu;
}
class Body {
  Vector2 _position;
  Vector2 _momentum;
  Vector2 _acceleration;
  double _mass;

  get mass => _mass;
  get position => _position;
  get velocity => _momentum / _mass;
  get momentum => _momentum;

  set position(Vector2 x) => _position = new Vector2.copy(x);
  set momentum(Vector2 p) => _momentum = new Vector2.copy(p);
  set velocity(Vector2 v) => _momentum = v * _mass;
  set mass(double m) => _mass = m;

  set acceleration(Vector2 a) => _acceleration = new Vector2.copy(a);
  set force(Vector2 f) => _acceleration += f / _mass;

  Body(Vector2 position, Vector2 momentum, double mass) {
    _position = new Vector2.copy(position);
    _momentum = new Vector2.copy(momentum);
    _acceleration = new Vector2.zero();
    _mass = mass;
  }

  Body.copy(Body body) {
    _position = new Vector2.copy(body.position);
    _momentum = new Vector2.copy(body.momentum);
    _mass = body.mass;
  }

  /**
   * Do not allow the velocity to exceed a given magnitude.
   */
  void clampVelocity(double v) {
    if (_momentum.length > v * _mass) {
      _momentum *= v * _mass / _momentum.length;
    }
  }
  /**
   * Advance by a time step.
   * @param t the time step in seconds
   */
  void advance(double t) {
    _position += _momentum * (t / _mass);
    _momentum += _acceleration * (t * _mass);

    _acceleration *= 0.0;
  }
  /**
   * Perform an elastic collision with another body.
   * 
   */
  void collide(Body b) {
    Vector2 v1 = momentum - velocity * b.mass + b.momentum * 2.0;
    Vector2 v2 = b.momentum - b.velocity * mass + momentum * 2.0;
    double m = mass + b.mass;
    velocity = v1 / m;
    b.velocity = v2 / m;
  }
}
class Boid {
  static const RADIUS_MINIMUM = 0.25;
  static const RADIUS_STD = 2.0;
  static const RADIUS_MEAN = 5.0;
  static const DENSITY = 2.0;
  Body _body;
  double _radius;
  get body => _body;
  set body(Body body) => _body = body;

  get radius => _radius;
  set radius(double r) {
    _radius = r;
    _body.mass = r * r * PI * DENSITY;
  }
  Boid(Vector2 x, Vector2 p, double radius) {
    _radius = radius;
    _body = new Body(x, p, radius * radius * PI * DENSITY);
  }
  Boid.copy(Boid boid) {
    _body = new Body.copy(boid.body);
  }
}

class Flock {
  static const DAMPENING = 0.3;
  static const ALIGNMENT_ACCELERATION = 12.0;
  static const COHESION_ACCELERATION = 24.0;
  static const ATTRACTION_ACCELERATION = 16.0;
  static const AVOIDANCE_ACCELERATION = 60.0;
  static const FLOCK_AVOIDANCE_ACCELERATION = 15.0;

  static const MINIMUM_DISTANCE = 50.0;

  double _mass;
  Vector2 _target = null;
  set target(Vector2 target) => _target = target;

  List<Flock> _avoidFlocks;

  void avoid(Flock flock) {
    if (!_avoidFlocks.contains(flock)) {
      _avoidFlocks.add(flock);
    }
  }

  List<Boid> _boids;

  get boids => _boids;

  /**
   * Construct a flock with a given number of boids.
   */
  Flock(int count) {
    _boids = new List<Boid>();
    _avoidFlocks = new List<Flock>();

    Random rng = new Random();
    Vector2 c = new Vector2(0.5, 0.5);
    _mass = 0.0;
    for (int i = 0; i < count; i++) {
      double radius;

      do {
        radius = gaussianNoise(rng, Boid.RADIUS_MEAN, Boid.RADIUS_STD);
      } while (radius <= Boid.RADIUS_MINIMUM);

      _boids.add(new Boid(
          (new Vector2(rng.nextDouble(), rng.nextDouble()) - c) *
              (MINIMUM_DISTANCE * _boids.length), new Vector2.zero(), radius));

      _mass += _boids[i].body.mass;
    }
    _computeCenter();
    _computeMomentum();
  }

  Vector2 _center;
  /**
   * The barycenter of the flock.
   */
  get center => _center;

  /**
   * The momentum of the flock.
   */
  Vector2 _momentum;
  get momentum => _momentum;

  void _computeCenter() {
    _center = new Vector2.zero();
    /* Get the center. */
    for (Boid boid in _boids) {
      _center += boid.body.position * boid.body.mass;
    }
    _center /= _mass;
  }
  void _computeMomentum() {
    /* Compute the momentum of the flock. */
    _momentum = new Vector2.zero();
    for (Boid boid in _boids) {
      _momentum += boid.body.momentum;
    }
  }
  void advance(double t) {
    /* Move toward the center of the flock. */
    Vector2 cohere(Boid b) {
      /* The center of the rest of the flock. */
      Vector2 a = center - b.body.position * (1.0 / _mass);
      /* The normalized direction vector to the center of the flock. */
      a -= b.body.position;
      a.normalize();
      a *= COHESION_ACCELERATION;
      return a;
    }

    /* Don't allow boids to fly too close to each other. */
    Vector2 separate(Boid boid) {
      Vector2 a = new Vector2.zero();
      int count = 0;
      for (Boid other in _boids) {
        if (other != boid) {
          Vector2 d = boid.body.position - other.body.position;
          double dist = d.length + other.radius + boid.radius;
          if (dist < MINIMUM_DISTANCE) {
            d /= dist * dist;
            a += d;
            count++;
          }
        }
      }
      if (count > 0) {
        //a /= count.toDouble();
        a.normalize();
        a *= AVOIDANCE_ACCELERATION;
      }

      return a;
    }
    /* Avoid other flocks. */
    Vector2 avoid(Boid boid) {
      Vector2 a = new Vector2.zero();
      for (Flock flock in _avoidFlocks) {
        Vector2 c = boid.body.position - flock.center;
        c.normalize();
        a += c * flock._boids.length.toDouble();
      }
      a.normalize();
      a *= FLOCK_AVOIDANCE_ACCELERATION;

      return a;
    }

    /* Boids try to match their velocity vectors with other boids. */
    Vector2 align(Boid boid) {
      /* The momentum of the rest of the flock. */
      Vector2 c = momentum - boid.body.momentum;

      /* The velocity of the rest of the flock. */
      Vector2 v = c * (1.0 / (_mass - boid.body.mass));

      v -= boid.body.velocity;
      v.normalize();
      v *= ALIGNMENT_ACCELERATION;

      return v;
    }

    Vector2 attractor;

    if (_target != null) {
      attractor = _target;
    } else {
      attractor = new Vector2.zero();
    }
    for (Boid boid in _boids) {
      Vector2 cohesion = cohere(boid);
      Vector2 sep = separate(boid);
      Vector2 alignment = align(boid);
      Vector2 avoidance = avoid(boid);

      Vector2 attraction = attractor - boid.body.position;
      attraction.normalize();
      attraction *= ATTRACTION_ACCELERATION;

      boid.body.acceleration =
          (cohesion + sep + alignment + attraction + avoidance) * (1.0 / t);
    }

    double dampening = pow(DAMPENING, t);
    for (Boid boid in _boids) {
      boid.body.momentum *= dampening;
      //boid.body.clampVelocity(MAXIMUM_VELOCITY);
      boid.body.advance(t);
    }
    _computeCenter();
    _computeMomentum();
  }
}

class Player {
  static const DAMPENING = 0.3;
  static const DENSITY = 1.0;
  static const RADIUS = 10.0;
  static const FLAIL_DENSITY = 50;
  static const FLAIL_RADIUS = 5.0;
  static const SLACK_LENGTH = 70.0;
  static const HOOKE_COEFFICIENT = 1.7;
  static const HOOKE_LENGTH = 400.0;
  static const HOOKE_LIMIT = 1000.0;
  static const ATTRACTION_ACCELERATION = 2600.0;
  static const MINIMUM_DISTANCE = 50.0;
  static const FLAIL_ACCELERATION = 0.1;
  Body _body;
  Body _flail;

  get body => _body;
  get flail => _flail;
  Vector2 _target;

  Player(Vector2 position) {
    _body =
        new Body(position, new Vector2.zero(), RADIUS * RADIUS * PI * DENSITY);
    _flail = new Body(position, new Vector2.zero(),
        FLAIL_RADIUS * FLAIL_RADIUS * PI * FLAIL_DENSITY);
    _target = null;
  }
  void moveToward(Vector2 c) {
    _target = c;
  }

  void advance(double t) {
    double dampening = pow(DAMPENING, t);

    _body.momentum *= dampening;
    _flail.momentum *= dampening;

    const EPSILON = 1e-2;

    if (_target != null) {
      _body.position = _target;
      _body.velocity *= 0.0;
      /*Vector2 a = _target - _body.position;
      a.normalize();
      a *= ATTRACTION_ACCELERATION;
      _body.acceleration = a;*/

    }

    double strainCurve(double x) {
      double t = x/HOOKE_LENGTH+1;
      return (t*t-1) * HOOKE_LENGTH/2;
    }
    Vector2 displacement = _flail.position - _body.position;
    if (displacement.length > SLACK_LENGTH) {
      Vector2 d = -displacement;
      d.normalize();
      double elongation = displacement.length - SLACK_LENGTH;

      if (elongation > HOOKE_LIMIT) {
        elongation = HOOKE_LIMIT;
      }
      d *= strainCurve(elongation) * HOOKE_COEFFICIENT;

      _flail.acceleration = d * (FLAIL_ACCELERATION / t);
    }
    //_body.clampVelocity(MAXIMUM_VELOCITY);
    //_flail.clampVelocity(MAXIMUM_FLAIL_VELOCITY);

    _flail.advance(t);
    _body.advance(t);
  }
}
class Renderer {
  static const DAMAGE_FACTOR = 1.0 - 0.3;
  static const MOVE_MOUSE_BUTTON = 0;
  static const PAN_MOUSE_BUTTON = 2;
  static const FLOCK_COUNT = 7;
  static const BOID_COUNT = 40;
  static const INITIAL_UNITSIZE = 800.0;
  static const WHEEL_SCALE = 1.0 / 200.0;
  static const WHEEL_INCREMENT = 1.1;

  static const TICS_PER_SECOND = 48;
  Vector2 _screenCenter = new Vector2(0.0, 0.0);
  double _unitsize;

  CanvasElement _canvas;
  CanvasRenderingContext2D _context;

  List<Flock> _flocks;
  Player _player;
  Vector2 _dragTarget;
  Vector2 _panTarget;
  Vector2 _initialScreenCenter;

  Vector2 canvasToWorld(Point p) {
    Vector2 x = new Vector2(p.x / _canvas.width, p.y / _canvas.height);
    x -= new Vector2(0.5, 0.5);
    x *= _unitsize;
    if (_initialScreenCenter != null) {
      x += _initialScreenCenter;
    }
    return x;
  }
  Renderer(CanvasElement canvas) {
    _unitsize = INITIAL_UNITSIZE;

    _player = new Player(new Vector2(0.0, 0.0));
    _flocks = new List<Flock>(FLOCK_COUNT);
    for (int i = 0; i < FLOCK_COUNT; i++) {
      _flocks[i] = new Flock(BOID_COUNT);
    }

    for (Flock flock in _flocks) {
      for (Flock other in _flocks) {
        if (other != flock) {
          flock.avoid(other);
        }
      }
    }

    _canvas = canvas;
    _context = _canvas.context2D;

    _dragTarget = null;
    _panTarget = null;
    _initialScreenCenter = null;
    _canvas.onMouseDown.listen((MouseEvent e) {
      _initialScreenCenter = new Vector2.copy(_screenCenter);
      if (e.button == MOVE_MOUSE_BUTTON) {
        _dragTarget = canvasToWorld(e.client);
      } else if (e.button == PAN_MOUSE_BUTTON) {
        _panTarget = canvasToWorld(e.client);
      }
      e.preventDefault();
    });
    _canvas.onContextMenu.listen((MouseEvent e) {
      /*if (e.button == 2)*/ {
        e.preventDefault();
      }
      return false;
    });

    var dragHandler = (MouseEvent e) {
      if (e.button == MOVE_MOUSE_BUTTON) {
        if (_dragTarget != null) {
          _dragTarget = canvasToWorld(e.client);
        }
      } else if (e.button == PAN_MOUSE_BUTTON) {
        if (_panTarget != null) {
          Vector2 target = canvasToWorld(e.client);
          _screenCenter = -(target - _panTarget) + _initialScreenCenter;
        }
      }
      e.preventDefault();
    };
    _canvas.onMouseMove.listen(dragHandler);
    _canvas.onDrag.listen(dragHandler);
    
    _canvas.onMouseUp.listen((MouseEvent e) {
      if (e.button == MOVE_MOUSE_BUTTON) {
        _dragTarget = null;
      } else if (e.button == PAN_MOUSE_BUTTON) {
        _panTarget = null;
      }
      _initialScreenCenter = null;
      e.preventDefault();
    });

    _canvas.onMouseLeave.listen((MouseEvent e) {
      if (e.button == MOVE_MOUSE_BUTTON) {
        _dragTarget = null;
      } else if (e.button == PAN_MOUSE_BUTTON) {
        _panTarget = null;
      }
      _initialScreenCenter = null;
      e.preventDefault();
    });
    _canvas.onMouseWheel.listen((WheelEvent e) {
      _unitsize *= pow(WHEEL_INCREMENT, e.deltaY * WHEEL_SCALE);
    });
    window.onKeyDown.listen((KeyboardEvent e) {
      double val = null;
      if (e.keyCode == 38) {
        val = 100.0;
      } else if (e.keyCode == 40) {
        val = -100.0;
      }
      if (val != null) {
        _unitsize *= pow(WHEEL_INCREMENT, val * WHEEL_SCALE);
        e.preventDefault();
      }
    });
  }

  void _render() {
    _context.save();
    _context.scale(_canvas.width, _canvas.height);
    _context.clearRect(0, 0, 1, 1);

    _context.translate(0.5, 0.5);
    _context.scale(1.0 / _unitsize, 1.0 / _unitsize);
    _context.translate(-_screenCenter.x, -_screenCenter.y);

    _context.lineWidth = _unitsize / _canvas.width;
    /* Render each flock. */
    for (Flock flock in _flocks) {
      /* Render each boid. */
      for (Boid boid in flock.boids) {
        /* Draw the circle. */
        _context.beginPath();
        _context.arc(
            boid.body.position.x, boid.body.position.y, boid.radius, 0, 2 * PI);
        _context.stroke();
        /* Draw the direction line. */
        _context.beginPath();
        Vector2 x = boid.body.position;
        Vector2 p = new Vector2.copy(boid.body.momentum).normalized();
        p *= boid.radius;
        Vector2 y = x + p;
        _context.moveTo(x.x, x.y);
        _context.lineTo(y.x, y.y);
        _context.stroke();
      }
    }

    /* Draw the player. */
    _context.beginPath();
    _context.arc(_player.body.position.x, _player.body.position.y,
        Player.RADIUS, 0, 2 * PI);
    _context.stroke();

    /* Draw the flail. */
    _context.beginPath();
    _context.arc(_player.flail.position.x, _player.flail.position.y,
        Player.FLAIL_RADIUS, 0, 2 * PI);
    _context.stroke();
    /* Draw the string. */
    _context.beginPath();
    _context.moveTo(_player.body.position.x, _player.body.position.y);
    _context.lineTo(_player.flail.position.x, _player.flail.position.y);
    _context.stroke();

    _context.restore();
  }
  void loop(Timer timer) {
    _render();
    if (_dragTarget != null) {
      _player.moveToward(_dragTarget);
      for (Flock flock in _flocks) {
        flock.target = _player.body._position;
      }
    }

    /* Bounce the boids away from the flail. */
    for (Flock flock in _flocks) {
      /*for (Boid boid in flock.boids)*/
      for (int i = 0; i < flock.boids.length; i++) {
        Boid boid = flock.boids[i];
        Vector2 d = boid.body.position - _player.flail.position;
        if (d.length < boid.radius + Player.FLAIL_RADIUS) {
          boid.body.collide(_player.flail);

          /*boid.radius *= DAMAGE_FACTOR;
          if (boid.radius < Boid.RADIUS_MINIMUM) {
            flock.boids.removeAt(i);
          }*/
        }
      }
      flock.advance(1.0 / TICS_PER_SECOND);
    }
    _player.advance(1.0 / TICS_PER_SECOND);
  }
  Timer startTimer() {
    const duration = const Duration(milliseconds: 1000 ~/ TICS_PER_SECOND);

    return new Timer.periodic(duration, loop);
  }
}

void main() {
  Renderer renderer = new Renderer(querySelector("#screen"));
  renderer.startTimer();
}
