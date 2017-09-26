/* projplot.js */

"use strict";

var FRAME_INTERVAL = 1000.0 / 30;
var DECIMAL_PLACES = 3;
var MIN_DISPLACEMENT = 1e-20;
var MAX_DISPLACEMENT = 1e2;

var TOKENS = {
    'MINUS': {
        'regex': '-'
    },
    'PLUS': {
        'regex': '\\+'
    },
    'TIMES': {
        'regex': '\\*'
    },
    'POWER': {
        'regex': '\\^'
    },
    'SYMBOL': {
        'regex': '[x-z]'
    },
    'LPAREN': {
        'regex': '\\('
    },
    'RPAREN': {
        'regex': '\\)'
    },
    'EQUALS': {
        'regex': '='
    },
    'REAL': {
        'regex': '(-)?\\d+(\\.\\d+)(e(\\+|-)?\\d+)?'
    },
    'INTEGER': {
        'regex': '\\d+'
    },
    'SPACES': {
        'regex': '\\s+'
    },
};

var GRAMMAR = {
    'SPACES': {
        'type': 'IGNORE',
    },
    'INTEGER': {
        'type': 'VALUE',
    },
    'REAL': {
        'type': 'VALUE',
    },
    'SYMBOL': {
        'type': 'VALUE',
    },
    'PLUS': {
        'precedence': 1,
        'associativity': 'LEFT',
        'type': 'OPERATOR'
    },
    'MINUS': {
        'precedence': 1,
        'associativity': 'LEFT',
        'type': 'OPERATOR'
    },
    'TIMES': {
        'precedence': 2,
        'associativity': 'LEFT',
        'type': 'OPERATOR'
    },
    'POWER': {
        'precedence': 3,
        'associativity': 'RIGHT',
        'type': 'OPERATOR'
    },
    'LPAREN': {
        'precedence': 4,
        'bracket': 'LEFT',
        'type': 'BRACKET'
    },
    'RPAREN': {
        'precedence': 4,
        'bracket': 'RIGHT',
        'type': 'BRACKET'
    },
    'EQUALS': {
        'precedence': 0,
        'associativity': 'LEFT',
        'type': 'OPERATOR'
    },
};

if(!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    }
};

if(!Array.prototype.group) {
    Array.prototype.group = function (cmp) {
        if(!cmp) {
            cmp = function (a,b) {
                return a == b;
            };
        }
        var out = [];
        var k=0;
        for(var i=0;i<this.length;i++) {
            if(!cmp(this[k], this[i])) {
                out.push(this.slice(k,i));
                k = i;
            }
        }
        out.push(this.slice(k,i));
        return out;
    }
};


var Lexer = function (tokens) {
    this.tokens = tokens;
};

/**
 * Find a token at the start of the string.
 */
Lexer.prototype.find = function (str) {
    for(var token in this.tokens) {
        var re = new RegExp('^' + this.tokens[token]['regex']);
        if(re.test(str)) {
            var result = re.exec(str);
            var m = result[0];
            return {
                'token': token,
                'match': m,
                'remain': str.slice(result.index+m.length)
            };
        }
    }
    return null;
};

/**
 * Construct a list of tokens from the string.
 */
Lexer.prototype.lex = function (str) {
    var result = [ ];
    while(str.length > 0) {
        var m = this.find(str);
        if(m) {
            result.push({
                'token': m['token'],
                'match': m['match']
            });
            str = m['remain'];
        } else {
            return null;
        }
    }
    return result;
};



var PostfixParser = function (grammar) {
    this.grammar = grammar;
};

PostfixParser.prototype.parse = function (tokens) {
    var stack = [];
    var output = [];
    var grammar = this.grammar;
    // The shunting yard algorithm.
    var g = function (token) {
        return grammar[token['token']];
    }
    tokens.forEach(function (token) {
        if(g(token)['type'] == 'VALUE') {
            output.push(token);
        } else if(g(token)['type'] == 'OPERATOR') {
            var o1 = token;
            while(stack.length > 0) {
                var o2 = stack[stack.length - 1];
                if(g(o2)['type'] == 'OPERATOR' && 
                    ((g(o1)['associativity'] == 'LEFT' && g(o1)['precedence'] <= g(o2)['precedence']) ||
                    (g(o1)['associativity'] == 'RIGHT' && g(o1)['precedence'] < g(o2)['precedence']))) {
                    output.push(stack.pop());
                } else {
                    break;
                }
            }
            stack.push(o1);
        } else if(g(token)['type'] == 'BRACKET') {
            if(g(token)['bracket'] == 'LEFT') {
                stack.push(token);
            } else if(g(token)['bracket'] == 'RIGHT') {
                while(stack.length > 0 && 
                    !(g(stack[stack.length-1])['type'] == 'BRACKET' && g(stack[stack.length-1])['bracket'] == 'LEFT')
                ) {
                    output.push(stack.pop());
                }
                if(stack.length > 0) {
                    stack.pop();
                } else {
                    console.log('Mismatched brackets');
                }
            }
        }
    });
    while(stack.length > 0) {
        if(g(stack[stack.length - 1])['type'] == 'BRACKET') {
            console.log('Mismatched brackets');
            return null;
        }
        output.push(stack.pop());
    }
    return output;
};

PostfixParser.prototype.juxtaposeMultiply = function (tokens,multiplyToken) {
    var output = [];
    var grammar = this.grammar;
    var g = function (token) {
        return grammar[token['token']];
    }
    var zero = {
        'token': 'INTEGER',
        'match': '0'
    };
    for(var i=0;i<tokens.length;i++) {
        // Prepend a zero to negative signs.
        if((i == 0 || (0 < i && (g(tokens[i-1])['type'] == 'OPERATOR' || (g(tokens[i-1])['type'] == 'BRACKET' && g(tokens[i-1])['bracket'] == 'LEFT')))) && tokens[i]['token'] == 'MINUS') {
            output.push(zero);
        }
        output.push(tokens[i]);
        if(i < tokens.length-1 && g(tokens[i])['type'] == 'VALUE' && g(tokens[i+1])['type'] == 'VALUE') {
            output.push(multiplyToken);
        }
    }
    return output;
};

PostfixParser.prototype.parseValues = function (tokens) {
    var grammar = this.grammar;
    var g = function (token) {
        return grammar[token['token']];
    }
    for(var i=0;i<tokens.length;i++) {
        var token = tokens[i];
        if(g(token)['type'] == 'VALUE') {
            if(token['token'] == 'INTEGER') {
                token['value'] = parseInt(token['match'])
            } else if(token['token'] == 'REAL') {
                token['value'] = parseFloat(token['match'])
            }
        }
    }
};

PostfixParser.prototype.polynomial = function (tokens) {
    var grammar = this.grammar;
    var g = function (token) {
        return grammar[token['token']];
    }
    var stack = [];
    tokens.forEach(function (token) {
        if(g(token)['type'] == 'VALUE') {
            stack.push(Polynomial.fromMonomial(Monomial.fromToken(token)));
        } else if(g(token)['type'] == 'OPERATOR') {
            var o2 = stack.pop();
            var o1 = stack.pop();
            if(!o1 || !o2) {
                console.log('Parse error');
                return null;
            }
            if(token['token'] == 'TIMES') {
                stack.push(o1.multiply(o2));
            } else if(token['token'] == 'PLUS') {
                stack.push(o1.add(o2));
            } else if(token['token'] == 'MINUS') {
                stack.push(o1.subtract(o2));
            } else if(token['token'] == 'EQUALS') {
                stack.push(o1.subtract(o2));
            } else if(token['token'] == 'POWER') {
                var e = o2.getConstant();
                if(!e || e % 1 !== 0) {
                    console.log('Exponent not an integer.');
                    return null;
                }
                stack.push(o1.power(e));
            }
        }
    });
    return stack[0];
}

/**
 * A monomial is the product of variables to powers. One of these variables may be 1, the constant.
 */
var Monomial = function () {
    this.factors = [];
};

/**
 * Construct a monomial from a scalar value.
 */
Monomial.fromScalar = function (s) {
    var c = new Monomial();

    c.factors = [{
        'variable': '1',
        'value': s,
        'exponent': 1
    }];

    return c;
};

/**
 * Construct a monomial from a coefficient and a list of variables to powers.
 */
Monomial.fromComponents = function (coefficient,variables) {
    var c = new Monomial();
    var m = {
        'exponent': 0,
        'variable': '1',
        'value': coefficient
    };
    c.factors = [m];
    c.factors = c.factors.concat(variables);
    c.canon();
    return c;
};

/**
 * Construct a monomial that is a variable taken to a power.
 */
Monomial.basisPower = function (x,p) {
    var c = new Monomial();
    var o = {
        'exponent': 0,
        'variable': '1',
        'value': 1
    };
    var m = {
        'exponent': p,
        'variable': x,
        'value': 1
    };
    c.factors = [m];

    return c;
};


Monomial.prototype.getCoefficient = function () {
    for(var i=0;i<this.factors.length;i++) {
        var factor = this.factors[i];
        if(factor['variable'] == '1') {
            return factor['value'];
        }
    }
    return 1;
};

Monomial.prototype.equalTo = function(b) {
    if(this.factors.length != b.factors.length) {
        return false;
    }
    for(var i=0;i<this.factors.length;i++) {
        if(this.factors[i]['variable'] != b.factors[i]['variable']) {
            return false;
        } else if(this.factors[i]['exponent'] != b.factors[i]['exponent']) {
            return false;
        }
    }
    return true;
};


Monomial.prototype.lessThan = function(b) {
    for(var i=0;i<this.factors.length;i++) {
        if(i >= b.factors.length) {
            return -1;
        }

        if(this.factors[i]['variable'] != b.factors[i]['variable']) {
            return (this.factors[i]['variable'] < b.factors[i]['variable']) - (this.factors[i]['variable'] > b.factors[i]['variable']);
        } else if(this.factors[i]['exponent'] != b.factors[i]['exponent']) {
            return (this.factors[i]['exponent'] < b.factors[i]['exponent']) - (this.factors[i]['exponent'] > b.factors[i]['exponent']);
        }
    }
    return this.factors.length < b.factors.length ? 1 : 0;
};


Monomial.prototype.getVariables = function () {
    var v = [];
    this.factors.forEach(function (factor) {
        if(factor['variable'] != '1') {
            v.push(factor);
        }
    });
    return v;
};

Monomial.fromToken = function (token) {
    var c = new Monomial();
    var m = {};
    if(token['token'] == 'SYMBOL') {
        m['exponent'] = 1;
        m['value'] = '1';
        m['variable'] = token['match'].slice();
    } else if(token['token'] == 'INTEGER' || token['token'] == 'REAL') {
        m['exponent'] = 0;
        m['variable'] = '1';
        m['value'] = token['value'];
    }
    c.factors = [m];
    return c;
};

Monomial.prototype.canon = function () {
    this.factors = this.factors.sort(function (x,y) {
        return (x['variable'] > y['variable']) - (x['variable'] < y['variable']);
    });
    var groups = this.factors.group(function (x,y) {
        return x['variable'] == y['variable'];
    });
    var f = [];
    groups.forEach(function (group) {
        var exponent = 0;
        var value = 1;
        group.forEach(function (term) {
            exponent += term['exponent'];
            value *= term['value'];
        });
        f.push({
            'variable': group[0]['variable'],
            'value': value,
            'exponent': exponent
        });
    });
    this.factors = f;
};

Monomial.prototype.getConstant = function () {
    this.canon();
    if(this.factors.length > 1) {
        return null;
    } else if(this.factors.length == 1) {
        if(this.factors[0]['variable'] == '1') {
            return this.factors[0]['value'];
        } else {
            return null;
        }
    } else {
        return 1;
    }
}

Monomial.prototype.multiply = function (b) {
    var c = new Monomial();

    c.factors = this.factors.slice().concat(b.factors.slice());
    c.canon();

    return c;
}

Monomial.prototype.degree = function () {
    var degree = 0;
    for(var i=0;i<this.factors.length;i++) {
        degree += this.factors[i]['exponent'];
    }
    return degree;
};

Monomial.prototype.toGLSL = function () {
    var str = '';
    for(var i=0;i<this.factors.length;i++) {
        if(0 < i) {
            str += '*';
        }
        if(this.factors[i]['variable'] == '1') {
            str += this.factors[i]['value'].toFixed(DECIMAL_PLACES);
        } else {
            for(var j=0;j<this.factors[i]['exponent'];j++) {
                if(0 < j) {
                    str += '*';
                }
                str += 'p.' + this.factors[i]['variable'];
            }
        }
    }


    return str;
};

Monomial.prototype.toString = function () {
    var str = '';
    for(var i=0;i<this.factors.length;i++) {
        if(0 < i) {
            str += '*';
        }
        if(this.factors[i]['variable'] == '1') {
            str += this.factors[i]['value'];
        } else {
            str += this.factors[i]['variable'];
            if(this.factors[i]['exponent'] > 1) {
                str += '^' + this.factors[i]['exponent'];
            }
        }
    }
    return str;
};

/**
 * A polynomial is the sum of monomials.
 */
var Polynomial = function () {
    this.monomials = [];
};

Polynomial.fromMonomial = function (m) {
    var c = new Polynomial();
    c.monomials = [m];
    return c;
};

/**
 * Make a polynomial from a value.
 */
Polynomial.fromScalar = function (s) {
    return Polynomial.fromMonomial(Monomial.fromScalar(s));
};

/**
 * Canonicalize the polynomial.
 */
Polynomial.prototype.canon = function () {
    this.monomials.sort(function (x,y) {
        return y.lessThan(x) - x.lessThan(y);
    });
    var groups = this.monomials.group(function (x,y) {
        return x.equalTo(y);
    });
    var m = [];
    groups.forEach(function (group) {
        var value = 0;
        group.forEach(function (monomial) {
            //monomial.canon();
            value += monomial.getCoefficient();
        });
        if(value != 0) {
            var out = Monomial.fromComponents(value, group[0].getVariables());
            m.push(out);
        }
    });
    this.monomials = m;
};

/**
 * Determine if this polynomial is a constant.
 */
Polynomial.prototype.getConstant = function () {
    this.canon();
    if(this.monomials.length > 1) {
        return null;
    } else if(this.monomials.length == 1) {
        return this.monomials[0].getConstant();
    } else {
        return 0;
    }
}

/**
 * Add this polynomial with the argument.
 */
Polynomial.prototype.add = function (b) {
    var c = new Polynomial();
    c.monomials = this.monomials.slice().concat(b.monomials.slice());
    c.canon();
    return c;
};

/**
 * Subtract this polynomial with the argument.
 */
Polynomial.prototype.subtract = function (b) {
    var c = new Polynomial();
    c.monomials = this.monomials.slice().concat(Polynomial.fromScalar(-1).multiply(b).monomials.slice());
    c.canon();

    return c;
};

/**
 * Multiply this polynomial with the argument.
 */
Polynomial.prototype.multiply = function (b) {
    var c = new Polynomial();

    this.monomials.forEach(function (ai) {
        b.monomials.forEach(function (bi) {
            c = c.add(Polynomial.fromMonomial(ai.multiply(bi)));
        });
    });

    return c;
};

/**
 * Take this polynomial to an integer power.
 */
Polynomial.prototype.power = function (b) {
    var c = null;
    var asq = this;
    while(b > 0) {
        if(b&1) {
            if(c == null) {
                c = asq;
            } else {
                c = c.multiply(asq);
            }
        }
        if(b > 1) {
            asq = asq.multiply(asq);
        }
        b >>= 1;
    }
    return c;
};

/**
 * Generate a GLSL function.
 */
Polynomial.prototype.toGLSL = function () {
    var str = '';
    var wasHomogenized = true;
    var degree = this.monomials[0].degree();
    for(var i=1;i<this.monomials.length;i++) {
        if(this.monomials[i].degree() > degree) {
            wasHomogenized = false;
            degree = this.monomials[i].degree();
        }
    }
    
    for(var i=0;i<this.monomials.length;i++) {
        if(this.monomials[i].degree() < degree) {
            this.monomials[i] = this.monomials[i].multiply(Monomial.basisPower('z',degree-this.monomials[i].degree()));
        }
    }

    for(var i=0;i<this.monomials.length;i++) {
        if(0 < i) {
            str+= ' + ';
        }
        str += this.monomials[i].toGLSL();
    }
    var PROLOGUE = 'float f(vec3 p) {\n\treturn ';
    var EPILOGUE = ';\n}\n';
    var glsl = PROLOGUE + str + EPILOGUE;
    return glsl;
};

Polynomial.prototype.toString = function () {
    var str = '';
    for(var i=0;i<this.monomials.length;i++) {
        if(0 < i) {
            str+= ' + ';
        }
        str += this.monomials[i].toString();
    }
    return str;
};

function getMousecoord(event) {
    var elem = event.target || event.srcElement;
    var rect = elem.getBoundingClientRect();
    return [2*(event.clientX - rect.left) / elem.width-1,
        1-2*(event.clientY - rect.top) / elem.height];
}

function vectorDivide(a, b) {
    var c = [0,0,0,0];
    c[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    c[1] = a[2] * b[1] - a[1] * b[2];
    c[2] = a[0] * b[2] - a[2] * b[0];
    c[3] = a[1] * b[0] - a[0] * b[1];
    return c;
}

function cross(a, b) {
    var c = [0,0,0];
    c[0] = a[1] * b[2] - a[2] * b[1];
    c[1] = - (a[0] * b[2] - a[2] * b[0]);
    c[2] = a[0] * b[1] - a[1] * b[0];
    
    return c;
}
function quaternionApply(q, v) {
// v +  2.0 * cross(cross(v, q.xyz) + q.w * v, q.xyz);
    return add(v, scale(2, 
        cross(
            add(cross(v, q.slice(1)), scale(q[0], v)),
            q.slice(1)
            )
        ));
}
function norm(a) {
    var n = 0;
    for(var i=0;i<a.length;i++) {
        n += a[i] * a[i];
    }
    return Math.sqrt(n);
}
function quaternionInverse(a) {
    var c = a.slice(0);
    var n = dot(a,a);
    c = scale(-1/(n*n), c);
    c[0] = -c[0];
    return c;
}
/* The basis vectors of quaternions are [1, e3*e2, e1*e3, e2*e1] = [1, -e3*e2,e1*e3, -e2*e1] */
function quaternionMultiply(a, b) {
    var c = [0,0,0,0];

    c[0] = a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3];
    c[1] = a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2];
    c[2] = a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1];
    c[3] = a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0];
    return c;
}

function dot(a,b) {
    var c = 0;
    for(var i = 0; i < a.length; i++) {
        c += a[i] * b[i];
    }
    return c;
}
function scale(a,b) {
    var c = [];
    for(var i = 0; i < b.length; i++) {
        c[i] = a * b[i];
    }
    return c;
}
function add(a,b) {
    var c = [];
    for(var i = 0; i < a.length; i++) {
        c[i] = a[i] + b[i];
    }
    return c;
}
function sub(a,b) {
    var c = [];
    for(var i = 0; i < a.length; i++) {
        c[i] = a[i] - b[i];
    }
    return c;
}
function normalize(v) {
    var n = 0.0;
    var y = v.slice(0);
    for(var i=0;i<v.length;i++) {
        n += v[i] * v[i];
    }
    
    if(n > 0.0) {
        n = Math.sqrt(n);
        for(var i=0;i<v.length;i++) {
            y[i] /= n;
        }
    }
    return y;
}
function getShader(gl, id, str2) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = '';
    var k = shaderScript.firstChild;
    if(str2) {
        str += str2;
    }
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

window.onload = function () {
    var canvas = document.getElementById('canvas');
    var gl = canvas.getContext('webgl');
    if(!gl) {
        gl = canvas.getContext('experimental-webgl');
    }
    if(!gl) {
        console.log('WebGL not available');
        alert('WebGL not available');
        return;
    }

	//var fragmentShader = getShader(gl, 'shader-fragment');
    var init_gl = function (fs_name, iterations) {
        var fs_prologue = 'precision mediump float;\n';
        fs_prologue += '#define ITERATIONS ' + iterations + '\n';
        var fragmentShader = getShader(gl, fs_name, fs_prologue);
        var vertexShader = getShader(gl, 'shader-vertex');
        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);


        /* Draw a screen-filling rectangle. */
        var positionArray = [
            /* Upper right triangle */
            -1,-1,
            1,-1,
            1,1,
            /* Lower left triangle */
            -1,-1,
            1,1,
            -1,1
            ];
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionArray), gl.STATIC_DRAW);

        shaderProgram.u_displacement = gl.getUniformLocation(shaderProgram, 'u_displacement');
        shaderProgram.u_rotation = gl.getUniformLocation(shaderProgram, 'u_rotation');
        shaderProgram.u_radius = gl.getUniformLocation(shaderProgram, 'u_radius');
        shaderProgram.u_center = gl.getUniformLocation(shaderProgram, 'u_center');
        shaderProgram.a_position = gl.getAttribLocation(shaderProgram, 'a_position');
        gl.enableVertexAttribArray(shaderProgram.a_position);
        gl.vertexAttribPointer(shaderProgram.a_position, 2, gl.FLOAT, false, 0, 0);

        gl.uniform4fv(shaderProgram.u_rotation, rotQuat(rotationQuaternion));
        gl.uniform1f(shaderProgram.u_displacement, u_displacement);
        gl.uniform1f(shaderProgram.u_radius, sphereRadius);
        gl.uniform3fv(shaderProgram.u_center, sphereCenter);

        return shaderProgram;
    };

    var rotQuat = function (q) {
        return [q[1], q[2], q[3], q[0]];
    };
    //var rotationQuaternion = [0,0,0,1];
    var rotationQuaternion = [1,0,0,0];
    var u_displacement = 6.0;

    var sphereCenter = [0,0,0];
    var sphereRadius = 1.0;

    var iterationsElement = document.getElementById('iterations');
    var iterations = parseInt(iterationsElement.value);
    console.log(iterations);

    iterationsElement.onchange = function () {
        iterations = parseInt(iterationsElement.value);
        changeShader(iterations);
    };



    var showQuaternion = function (q) {
        return q;
    };
    var redrawing = false;
    var redraw = function () {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    var queueRedraw = function () {
        if(!redrawing) {
            redrawing = true;
            window.setTimeout(function () {
                redraw();
                redrawing = false;
            }, FRAME_INTERVAL);
        }
    };


    var shader;
    var changeShader = function (iterations) {
        var fs_name;
        fs_name = 'shader-fragment-stereographic';
        shader = init_gl(fs_name,iterations);
        queueRedraw();
    };
    changeShader(iterations);


   

    queueRedraw();


    /* Find the intersection between the sphere and the view vector at the given pixel coordinates. */
    var intersectSphere = function (coords) {
        var p1 = [coords[0], coords[1], 0];
        var p0 = [0,0, u_displacement];
        var d = sub(p1, p0);
        var a = dot(d, d);
        var b = 2*dot(sub(p0, sphereCenter), d);
        var c = dot(sub(p0, sphereCenter), sub(p0, sphereCenter)) - sphereRadius*sphereRadius;
        var disc = b*b-4*a*c;

        if(disc >= 0) {
            var t0 = -b / (2*a);
            var t1 = Math.abs(Math.sqrt(disc) / (2*a));
            var t = t0-t1;
            var p = add(scale(t, d), p0);
            return p;
        } else {
            return null;
        }
    };
    var intersectStereo = function (coords) {
        var XY = [coords[0], coords[1]];
        XY = scale(u_displacement/4,XY);
        var p = scale(2,XY);
        p[2] = 1-dot(XY,XY);
        p = scale(1/(1+dot(XY,XY)), p);
        return p;
    };

    var makeVector = function (coords) {
        return intersectStereo(coords);
    }
    var previousVector = null;
    var onmove = function (coords) {
        var p = makeVector(coords);
        if(p) {
            p = sub(p, sphereCenter);

            var p1 = normalize(add(p,previousVector));
            var deltaQuaternion = vectorDivide(p1, previousVector);
            rotationQuaternion = quaternionMultiply(deltaQuaternion, rotationQuaternion);
            rotationQuaternion = normalize(rotationQuaternion);

            gl.uniform4fv(shader.u_rotation, rotQuat(rotationQuaternion));
            queueRedraw();

            previousVector = p;
        } else {
            previousVector = null;
        }
        event.preventDefault();
    }
	canvas.ontouchmove = function (event) {
        if(previousVector) {
            var coords = getMousecoord(event.touches[0]);

            onmove(coords);
        }
        event.preventDefault();
	};
	canvas.onmousemove = function (event) {
        var coords = getMousecoord(event);
        if(previousVector) {
            onmove(coords);
        }
        event.preventDefault();
	};
	canvas.onmousewheel = function (event) {
		if(!event) {
			event = window.event;
		}

		var delta = 0;
		if(event.wheelDelta) {
			delta = event.wheelDelta/120;
		} else if(event.detail) {
			delta = event.detail/(-3);
		} else if(event.deltaY) {
			delta = event.deltaY/(-3);
        }
		var t = u_displacement * Math.pow(1.1,delta);
		if(MIN_DISPLACEMENT < t && t < MAX_DISPLACEMENT) {
			u_displacement = t;
		}

        gl.uniform1f(shader.u_displacement, u_displacement);
        queueRedraw();

		event.preventDefault();
	}
	canvas.DOMMouseScroll = canvas.onmousewheel;
	canvas.onwheel = canvas.onmousewheel;


    canvas.ontouchend = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.onmouseleave = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.ontouchcancel = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.ontouchleave = function (event) {
        previousVector = null;
        event.preventDefault();
    };
    canvas.onmouseup = function (event) {
        previousVector = null;
        event.preventDefault();
    };

    var ondown = function (coords) {
        previousVector = makeVector(coords);
        if(previousVector) {
            previousVector = sub(previousVector, sphereCenter);
        }
    };
    canvas.onmousedown = function (event) {
        var coords = getMousecoord(event);
        ondown(coords);
        event.preventDefault();
    };
    canvas.ontouchstart = function (event) {
        var coords = getMousecoord(event.touches[0]);
        ondown(coords);
        event.preventDefault();
    };
    var planeQuats = {
        'xy' : [1,0,0,0],
        'xz' : [1,0,1,0],
        'yz' : [1,1,1,1]
    };
    //var MODES = ['Affine','Projective','Stereographic'];
};

