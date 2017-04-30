import 'dart:math';
import 'dart:html';
import 'dart:async';

double agm(double a, double g) {
  const TOLERANCE = 1e-14;
  double an = a;
  double gn = g;
  while ((an - gn).abs() > TOLERANCE) {
    double an1 = (an + gn) / 2;
    double gn1 = sqrt(an * gn);
    an = an1;
    gn = gn1;
  }
  return an;
}
double sn(double u, double k) {
  double fn(double theta) {
    double s = sin(theta);
    return 1 / sqrt(1 - k * k * s * s);
  }

  double simpson(double a, double b, Function f, [int n = 200]) {
    double sum = 0.0;
    double h = (b - a) / n;
    for (int j = 1; j * 2 <= n; j++) {
      sum += f(a + (2 * j - 1) * h);
    }
    sum *= 2;
    for (int j = 1; (j + 1) * 2 <= n; j++) {
      sum += f(a + 2 * j * h);
    }
    sum *= 2;
    sum += f(a) + f(b);
    sum *= h / 3;
    return sum;
  }
  double newton(double x0, Function f, Function fp) {
    const double TOLERANCE = 1e-10;
    const int N = 20;
    int i = 0;
    double x = x0;
    double y;
    y = f(x);
    while (y.abs() > TOLERANCE && i < N) {
      double yp = fp(x);
      x -= y / yp;
      y = f(x);
      i++;
    }
    return x;
  }

  double bisect(double a, double b, Function f) {
    const int N = 30;

    for (int i = 0; i < N; i++) {
      double m = (b + a) / 2.0;
      if (f(a) * f(m) > 0) {
        a = m;
      } else {
        b = m;
      }
    }
    return (b + a) / 2.0;
  }

  //double phi = bisect(0.0,PI/2.0,(double phi) => simpson(0.0,phi, (double theta) => fn(theta))-u);

  double phi = newton(u / 2.0,
      (double phi) => simpson(0.0, phi, (double theta) => fn(theta)) - u,
      (double theta) => fn(theta));
  return sin(phi);
}
double K(double k) {
  return PI * 0.5 / agm(1 - k, 1 + k);
}

class Renderer {
  static const PENDULUM_SPAN = 0.65;
  static const TICS_PER_SECOND = 30;
  static const PENDULUMS = 15;
  static const GRAVITY = 9.80665;
  CanvasElement _canvas;
  CanvasRenderingContext2D _context;
  CanvasElement _vcanvas;
  CanvasRenderingContext2D _vcontext;

  static const START_LENGTH = 0.5;
  static const END_LENGTH = 1.0;
  List<double> _pendulumLengths;
  double _currentTime;

  double _startLength;
  double _endLength;

  set startLength(double val) {
    setLengths(val, _endLength);
  }
  get startLength => _startLength;

  set endLength(double val) {
    setLengths(_startLength, val);
  }
  get endLength => _endLength;

  void setLengths(double start, double end) {
    double frequency(double l) {
      return 1 / (2 * PI * sqrt(l / GRAVITY));
    }
    double length(double f) {
      double s = f * 2 * PI;
      return GRAVITY / (s * s);
    }

    for (int i = 0; i < _pendulumLengths.length; i++) {
      double t = i / (_pendulumLengths.length - 1.0);
      /* T0 = 2*pi*sqrt(l/g) 
       * 
       * 1/(i+60) = T0
       * (1/((i+60)*2*pi))^2*g
       *
       */
      double f = (1 - t) * frequency(start) + t * frequency(end);
      _pendulumLengths[i] = length(f);
    }
    _startLength = start;
    _endLength = end;
  }
  Renderer(CanvasElement canvas, CanvasElement vcanvas) {
    _canvas = canvas;
    _context = _canvas.context2D;

    _vcanvas = vcanvas;
    _vcontext = _vcanvas.context2D;

    _pendulumLengths = new List<double>(PENDULUMS);

    setLengths(0.5, 1.0);
    _currentTime = 0.0;
  }
  static double _pendulumAngle(double t, double l, double theta_0) {
    double omega_0 = sqrt(GRAVITY / l);
    return theta_0 * sin(omega_0 * t);
    /*double sine_theta0 = sin(theta_0 / 2);
    return 2.0 *
        asin(sine_theta0 * sn(K(sine_theta0) - omega_0 * t, sine_theta0));*/
  }

  void reset() {
    _currentTime = 0.0;
  }
  void render() {
    double radius = 1.0 / (4.0 * _pendulumLengths.length);
    _context.save();
    _context.scale(_canvas.width, _canvas.height);
    _context.clearRect(0, 0, 1, 1);

    _vcontext.save();
    _vcontext.scale(_vcanvas.width, _vcanvas.height);
    _vcontext.clearRect(0, 0, 1, 1);

    _context.lineWidth = 2 / _canvas.width;
    _context.beginPath();
    _context.moveTo(0.5, 0.0);
    _context.lineTo(0.5, 1.0);
    _context.stroke();

    double maxLength = max(_pendulumLengths.first, _pendulumLengths.last);
    for (int i = 0; i < _pendulumLengths.length; i++) {
      double y = (1 + i) / (_pendulumLengths.length + 2);
      double pendulumLength = _pendulumLengths[i];
      double theta = _pendulumAngle(_currentTime, pendulumLength, PI / 4);
      double x = PENDULUM_SPAN * sin(theta) * pendulumLength / maxLength + 0.5;
      double vy = PENDULUM_SPAN * cos(theta) * pendulumLength / maxLength;
      _context.lineWidth = 0.03;
      _context.beginPath();
      _context.arc(x, y, radius, 0, 2 * PI);
      _context.stroke();
      _context.lineWidth = 1 / _canvas.width;
      _context.beginPath();
      _context.moveTo(0.5, y + radius / 2);
      _context.lineTo(x, y);
      _context.stroke();
      _context.beginPath();
      _context.moveTo(0.5, y - radius / 2);
      _context.lineTo(x, y);
      _context.stroke();

      _vcontext.lineWidth = 2 / _canvas.width;

      _vcontext.beginPath();
      _vcontext.moveTo(0.5, 0);
      _vcontext.lineTo(x, vy);
      _vcontext.stroke();

      _vcontext.lineWidth = 0.03;

      _vcontext.beginPath();
      _vcontext.arc(x, vy, radius, 0, 2 * PI);
      _vcontext.stroke();
    }
    _vcontext.restore();
    _context.restore();
  }
  void loop(Timer timer) {
    if (_currentTime != null) {
      render();
      _currentTime += 1.0 / TICS_PER_SECOND;
    }
  }
  Timer startTimer() {
    const duration = const Duration(milliseconds: 1000 ~/ TICS_PER_SECOND);

    return new Timer.periodic(duration, loop);
  }
}
void main() {
  Renderer renderer =
      new Renderer(querySelector("#screen"), querySelector("#vscreen"));
  {
    void changeValue(String elementName, Function valueChanger,
        Function getValue, double defaultValue) {
      InputElement valueElement = querySelector(elementName) as InputElement;
      valueElement.onChange.listen((Event onData) {
        try {
          valueChanger(renderer, double.parse(valueElement.value));
          renderer.reset();
        } catch (e) {}
      });
      valueElement.onMouseWheel.listen((WheelEvent e) {
        const increment = 1.1;
        const scale = 200.0;
        double v = getValue(renderer);
        v *= pow(increment, -e.deltaY / scale);
        valueChanger(renderer, v);
        renderer.reset();
        valueElement.value = v.toString();
      });

      valueElement.value = defaultValue.toString();
      valueChanger(renderer, defaultValue);
    }

    changeValue("#startLength", (r, v) => r.startLength = v,
        (r) => r.startLength, 0.21862);
    changeValue(
        "#endLength", (r, v) => r.endLength = v, (r) => r.endLength, 0.34427);
  }
  querySelector('#resetButton').onClick.listen((MouseEvent e) {
    renderer.reset();
  });

  renderer.startTimer();
}
