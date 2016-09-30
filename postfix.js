/* postfix.js */

"use strict";

var TOKENS = {
    'MINUS': {
        'regex pattern': '-'
    },
    'PLUS': {
        'regex pattern': '\\+'
    },
    'TIMES': {
        'regex pattern': '\\*'
    },
    'POWER': {
        'regex pattern': '\\^'
    },
    'SYMBOL': {
        'regex pattern': '[x-z]'
    },
    'LPAREN': {
        'regex pattern': '\\('
    },
    'RPAREN': {
        'regex pattern': '\\)'
    },
    'DIVIDE': {
        'regex pattern': '/'
    },
    'REAL': {
        'regex pattern': '\\d+(\\.\\d+)(e(\\+|-)?\\d+)?'
    },
    'INTEGER': {
        'regex pattern': '\\d+'
    },
    'SPACES': {
        'regex pattern': '\\s+',
        'ignored': true
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
        'name': 'Plus',
        'precedence': 1,
        'associativity': 'LEFT',
        'symbol': '+',
        'type': 'OPERATOR'
    },
    'MINUS': {
        'name': 'Minus',
        'precedence': 1,
        'associativity': 'LEFT',
        'symbol': '-',
        'type': 'OPERATOR'
    },
    'TIMES': {
        'name': 'Times',
        'precedence': 2,
        'associativity': 'LEFT',
        'symbol': '*',
        'type': 'OPERATOR'
    },
    'JTIMES': {
        'name': 'Juxtapose',
        'precedence': 2,
        'associativity': 'LEFT',
        'symbol': ' ',
        'type': 'OPERATOR'
    },
    'DIVIDE': {
        'name': 'Divide',
        'precedence': 2,
        'associativity': 'LEFT',
        'symbol': '/',
        'type': 'OPERATOR'
    },
    'POWER': {
        'name': 'Power',
        'precedence': 3,
        'associativity': 'RIGHT',
        'symbol': '^',
        'type': 'OPERATOR'
    },
    'LPAREN': {
        'name': 'Left Parenthesis',
        'bracket': 'LEFT',
        'symbol': '(',
        'type': 'BRACKET'
    },
    'RPAREN': {
        'name': 'Right Parenthesis',
        'bracket': 'RIGHT',
        'symbol': ')',
        'type': 'BRACKET'
    },
};

if(!Object.prototype.clone) {
    /* Deep copy an Object and return the copy. */
    Object.prototype.clone = function() {
      if (this === null || typeof(this) !== 'thisect' || 'isActiveClone' in this)
        return this;

      if (this instanceof Date)
        var temp = new this.constructor(); //or new Date(this);
      else
        var temp = this.constructor();

      for (var key in this) {
        if (Object.prototype.hasOwnProperty.call(this, key)) {
          this['isActiveClone'] = null;
          temp[key] = this[key].clone();
          delete this['isActiveClone'];
        }
      }

      return temp;
    }
}

/**
 * A lexical scanner.
 */
var Lexer = function (tokens) {
    this.tokens = tokens.clone();
    /* Construct a regular expression for each token. */
    for(var tokenKey in this.tokens) {
        var re = new RegExp('^' + this.tokens[tokenKey]['regex pattern']);
        this.tokens[tokenKey]['regex instance'] = re;
    }
};

/**
 * Find a token at the start of the string. Return a token corresponding to the
 * first match as well as the remainder of the string; return nothing if there
 * is no match.
 */
Lexer.prototype.find = function (str) {
    for(var token in this.tokens) {
        var re = this.tokens[token]['regex instance'];
        if(re.test(str)) {
            var result = re.exec(str);
            /* Take the first match and construct a token. */
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
            if(!this.tokens[m['token']]['ignored']) {
                /* This is not an ignored token. Append it to the output. */
                result.push({
                    'token': m['token'],
                    'match': m['match']
                });
            }
            str = m['remain'];
        } else {
            /* No match was found. Throw an exception. */
            throw 'Invalid token';
        }
    }
    return result;
};


/**
 * This can construct a postfix list from an infix list of symbols given a list of
 * operators with prescribed associativity and precedence.
 */
var PostfixParser = function (grammar) {
    this.grammar = grammar.clone();
};

/**
 * Convert the list of infix tokens into postfix with the given grammar. 
 * This will also generate a log if requested. The log contains a list
 * of entries in its entries member. Each entry will specify the action taken,
 * the token symbol, the output list, the operator stack, and the number of subsequent
 * entries that are in the group for the head of the group.
 */
PostfixParser.prototype.parse = function (tokens,log) {
    var stack = [];
    var output = [];

    var g = function (token) {
        return this.grammar[token['token']];
    };
    g = g.bind(this);

    if(log) {
        /* Clear the log. */
        log['entries'] = [];
        var previousToken = null;
        var previousEntry = null;
        var appendLog = function(token, action,notes) {
            /* Construct an entry. */
            var entry = {
                'row span': 1,
                'action': action,
                'token': token['match'],
                'output': output.slice(0),
                'stack': stack.slice(0),
            };
            if(notes) {
                entry['notes'] = notes;
            }
            /* Advance the group if the token is new, otherwise update the head 
             * and set the current row span to zero. */
            if(previousToken != token) {
                previousToken = token;
                previousEntry = entry;
            } else {
                entry['row span'] = 0;
                previousEntry['row span']++;
            }
            log['entries'].push(entry);
        };
    } else {
        /* Ignore the log. */
        var appendLog = function(token, action,notes) {};
    }
    /* The shunting yard algorithm. */
    tokens.forEach(function (token) {
        if(g(token)['type'] == 'VALUE') {
            output.push(token);
            appendLog(token, 'Append token to output');
        } else if(g(token)['type'] == 'OPERATOR') {
            var o1 = token;
            while(stack.length > 0) {
                var o2 = stack[stack.length - 1];
                if(g(o2)['type'] == 'OPERATOR' && 
                    ((g(o1)['associativity'] == 'LEFT' && g(o1)['precedence'] <= g(o2)['precedence']) ||
                    (g(o1)['associativity'] == 'RIGHT' && g(o1)['precedence'] < g(o2)['precedence']))) {
                    var o = stack.pop();
                    output.push(o);


                    appendLog(token, 'Pop operator stack into output', 
                        g(o1)['associativity'] == 'LEFT' ?
                            'Current operator is left associative and precedence does not exceed that of top of stack' :
                            'Current operator is right associative and precedence is less than that of top of stack'
                    );
                } else {
                    break;
                }
            }
            stack.push(o1);
            appendLog(token, 'Push token onto operator stack');
        } else if(g(token)['type'] == 'BRACKET') {
            if(g(token)['bracket'] == 'LEFT') {
                stack.push(token);
                appendLog(token, 'Push left bracket onto stack');
            } else if(g(token)['bracket'] == 'RIGHT') {
                while(stack.length > 0 && 
                    !(g(stack[stack.length-1])['type'] == 'BRACKET' && g(stack[stack.length-1])['bracket'] == 'LEFT')
                ) {
                    var o = stack.pop();
                    output.push(o);
                    appendLog(token, 'Pop operator stack into output', 'Popping operators until a matching bracket is found');
                }
                if(stack.length > 0) {
                    var o = stack.pop();
                    appendLog(token, 'Pop opening bracket from stack','This is the opening bracket corresponding to the current token');
                } else {
                    throw 'Mismatched brackets';
                }
            }
        }
    });
    var endToken = {'match': 'end'};
    while(stack.length > 0) {
        if(g(stack[stack.length - 1])['type'] == 'BRACKET') {
            throw 'Mismatched brackets';
        }

        var o = stack.pop();
        output.push(o);
        appendLog(endToken, 'Pop operator stack into output');
    }
    return output;
};

/**
 * Handle cases where there is juxtaposition of tokens. Also handle negative signs. This inserts
 * multiplication tokens as well as bracketing negative expresions and subtracting them from zero.
 */
PostfixParser.prototype.juxtaposeMultiply = function (tokens,multiply_token) {
    var g = function (token) {
        return this.grammar[token['token']];
    };
    g = g.bind(this);

    /* Implicit tokens that are generated for handling negative signs. */
    var right_parenthesis = {
        'token': 'RPAREN',
        'match': ')'
    };
    var left_parenthesis = {
        'token': 'LPAREN',
        'match': '('
    };
    var zero = {
        'token': 'INTEGER',
        'match': '0'
    };
    for(var i=0;i<tokens.length;i++) {
        /* Prepend a zero and bracket negative sign if ... */
        if(
            /* ... the current token is a minus sign ... */
              tokens[i]['token'] == 'MINUS' &&
            /* ... and there was no preceeding token ... */
              (i == 0 || 
            /* ... or if there was a preceeding symbol that ... */
                (0 < i && 
            /* ... was an operator ... */
                     (g(tokens[i-1])['type'] == 'OPERATOR' 
            /* ... or an opening bracket ... */
                  || (g(tokens[i-1])['type'] == 'BRACKET' && g(tokens[i-1])['bracket'] == 'LEFT')))) 
          ) {
            /* ... then prepend an opening bracket and a zero... */
            tokens.splice(i, 0, left_parenthesis);
            tokens.splice(i+1, 0, zero);
            i += 2;
            /* ... and append a closing bracket after the value or bracketed expression. 
             * Start with a current bracket level of zero. Advance forward until the level is zero again. */
            var level = 0;
            for(var k = i+1; k < tokens.length;k++) {
                if(g(tokens[k])['type'] == 'BRACKET') {
                    if(g(tokens[k])['bracket'] == 'LEFT') {
                        /* Note that this could occur immediately after a negative sign. */
                        level ++;
                    } else if(g(tokens[k])['bracket'] == 'RIGHT') {
                        level --;
                    }
                }
                if(level == 0) {
                    /* The level hit zero. Exit the loop. */
                    break;
                } else if(level < 0) {
                    /* The level is somehow negative. That means that the minus sign immediately preceeds a closing bracket. */
                    throw 'Negative sign after expression';
                }
            }
            /* Append the closing bracket. */
            tokens.splice(k+1, 0, right_parenthesis);
        }

        /* There is a juxtaposition if there is at least one more token ahead ... */
        if ((i < tokens.length-1) &&
            (
        /* ... and the current token is a value or the end of a bracketed expression ... */
              (g(tokens[i])['type'] == 'VALUE' || (g(tokens[i])['type'] == 'BRACKET' && g(tokens[i])['bracket'] == 'RIGHT')) &&
        /* ... and the next token is a value or the beginning of a bracketed expression. */
              (g(tokens[i+1])['type'] == 'VALUE' || (g(tokens[i+1])['type'] == 'BRACKET' && g(tokens[i+1])['bracket'] == 'LEFT'))
             )
            ) {
            /* Insert in the juxtaposition multiplication token. */
            tokens.splice(i+1, 0, multiply_token);
            i++;
        }
    }
};

PostfixParser.prototype.parseValues = function (tokens) {
    var g = function (token) {
        return this.grammar[token['token']];
    }
    g = g.bind(this);

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
PostfixParser.prototype.evaluateStack = function(tokens, log) {
    var g = function (token) {
        return this.grammar[token['token']];
    }
    g = g.bind(this);


    var stack = [];
    log['entries'] = [];
    var previousToken = null;
    var previousEntry = null;
    var appendLog = function(token, action) {
        var entry = {
            'row span': 1,
            'action': action,
            'token': token,
            'stack': stack.slice(0)
        };
        if(previousToken == token) {
            entry['row span'] = 0;
            previousEntry['row span']++;
        } else {
            previousToken = token;
            previousEntry = entry;
        }

        log['entries'].push(entry);
    };
    var op = function(o1,o2, o) {
        if(o == 'PLUS') {
            return o1 + o2;
        } else if(o == 'MINUS') {
            return o1 - o2;
        } else if(o == 'TIMES' || o == 'JTIMES') {
            return o1 * o2;
        } else if(o == 'DIVIDE') {
            return o1 / o2;
        } else if(o == 'POWER') {
            return Math.pow(o1,o2);
        }
    };
    tokens.forEach(function (token) {
        if(g(token)['type'] == 'VALUE') {
            var value;
            if(token['token'] == 'INTEGER') {
                token['value'] = parseInt(token['match'])
            } else if(token['token'] == 'REAL') {
                token['value'] = parseFloat(token['match'])
            }

            stack.push(token);
            appendLog(token, 'Push value onto stack');
        } else if(g(token)['type'] == 'OPERATOR') {
            var o2 = stack.pop();
            appendLog(token, 'Pop value from stack');
            var o1 = stack.pop();
            appendLog(token, 'Pop value from stack');
            var d = {
                'value': op(o1['value'], o2['value'], token['token'])
            };
            stack.push(d);
            appendLog(token, 'Push result onto stack');
        }
    });
    if(stack.length != 1) {
        throw 'Invalid input';
    }
    return stack[0]['value'];
};

window.onload = function () {
    var inputField = document.getElementById('inputField');
    var parseButton = document.getElementById('parseButton');
    var outputDiv = document.getElementById('outputDiv');


    var buildOperatorTable = function(grammar) {
        /*for(operatorKey in grammar) {
            grammar[operatorKey]['key'] = operatorKey;
        }*/

        if(document.getElementById('operatorTable') != null) {
            operatorTableDiv.removeChild(document.getElementById('operatorTable'));
        }
        var operatorTable = document.createElement('table');
        operatorTable.setAttribute('id','operatorTable');
        operatorTable.setAttribute('class','wikitable');
        var operatorTableBody = document.createElement('tbody');

        var operatorTableHeader = document.createElement('tr');
        ['Operator','Associativity','Precedence'].forEach (function (header) {
            var cell = document.createElement('th');
            cell.appendChild(document.createTextNode(header));
            operatorTableHeader.appendChild(cell);
        });
        operatorTableBody.appendChild(operatorTableHeader);
 
        for(var operatorKey in grammar) {
            var operator = grammar[operatorKey];

            //if(['OPERATOR','BRACKET'].includes(operator['type'])) {
            if(['OPERATOR'].includes(operator['type'])) {
                var row = document.createElement('tr');

                /* Make the name cell. */
                var nameCell = document.createElement('td');
                nameCell.appendChild(document.createTextNode(operator['name']));
                row.appendChild(nameCell);

                /* Make the associativity option. */
                var associativityCell = document.createElement('td');
                var associativitySelect = document.createElement('select');
                var defaultAssociativity;
                if(operator['type'] == 'OPERATOR') {
                    defaultAssociativity = operator['associativity'];
                } else if(operator['type'] == 'BRACKET') {
                    defaultAssociativity = operator['bracket'];
                }
                associativitySelect['operator-data'] = {
                    'key': operatorKey,
                    'value': operator,
                    //'options': []
                };
                [
                    {'text':'Left','name':'LEFT'},
                    {'text':'Right','name':'RIGHT'}
                ].forEach(function (descriptor) {
                    var option = document.createElement('option');
                    option.setAttribute('value', descriptor['name']);
                    option.appendChild(document.createTextNode(descriptor['text']));

                    if(defaultAssociativity == descriptor['name']) {
                        option.setAttribute('selected','selected');
                    }
                    //associativitySelect['operator-data']['options'].push(option);
                    //associativitySelect.appendChild(option);
                    associativitySelect.add(option);
                });
                var associativityHandler = function() {
                    var operator_data = this['operator-data'];
                    if(operator_data['value']['type'] == 'OPERATOR') {
                        operator_data['value']['associativity'] = this.value.toString();
                    } else if(operator_data['value']['type'] == 'BRACKET') {
                        operator_data['value']['bracket'] = this.value.toString();
                    }
                    if(parsed) {
                        doParse(grammar);
                    }
                };
                associativitySelect.onchange = associativityHandler;

                associativityCell.appendChild(associativitySelect);
                row.appendChild(associativityCell);


                /* Make the precendence selector. */
                var precedenceCell = document.createElement('td');
                var defaultPrecedence = operator['precedence'];
                var numberElement = document.createElement('input');
                numberElement.setAttribute('type','number');
                numberElement.setAttribute('min','0');
                numberElement.setAttribute('max','11');
                numberElement.setAttribute('value',defaultPrecedence.toString());

                var precedenceHandler = function() {
                    var operator_data = this['operator-data'];
                    operator_data['value']['precedence'] = this.value.toString();
                    if(parsed) {
                        doParse(grammar);
                    }
                };
                numberElement.onchange = precedenceHandler;
                numberElement['operator-data'] = {
                    'key': operatorKey,
                    'value': operator
                }

                precedenceCell.appendChild(numberElement);
                row.appendChild(precedenceCell);

                operatorTableBody.appendChild(row);
            }
        }
        operatorTable.appendChild(operatorTableBody);
        operatorTableDiv.appendChild(operatorTable);
    };
    var grammar = GRAMMAR.clone();
    var parsed = false;
    buildOperatorTable(grammar);

    var doParse = function (grammar) {
        ['shuntingTable','rpnDiv','evaluationTable','resultDiv','errorDiv'].forEach(function (id) {
            if(document.getElementById(id) != null) {
                outputDiv.removeChild(document.getElementById(id));
            }
        }); 
        var makeErrorDiv = function (errorText) {
            var errorDiv = document.createElement('div');
            errorDiv.setAttribute('id','errorDiv');
            errorDiv.setAttribute('class','error');
            errorDiv.appendChild(document.createTextNode(errorText));
            outputDiv.appendChild(errorDiv);
        };

        var lex = new Lexer(TOKENS);

        try {
            var lexResult = lex.lex(inputField.value);
        } catch(err) {
            makeErrorDiv('Could not lex: '+ err);
            return;
        }
        //console.log(lexResult);

        var postfix = new PostfixParser(grammar);
        /* Turn juxtapositions into multiplications. */
        postfix.juxtaposeMultiply(lexResult,
            {
                'token': 'JTIMES',
                'match': '.'
            });
        var parseLog = {};
        try {
            var postfixResult = postfix.parse(lexResult, parseLog);
        } catch(err) {
            makeErrorDiv('Could not parse: ' + err);
            return;
        }
        var shuntingTable = document.createElement('table');
        var shuntingTableBody = document.createElement('tbody');
        shuntingTable.setAttribute('id','shuntingTable');
        shuntingTable.setAttribute('class','wikitable');
        var shuntingTableHeader = document.createElement('tr');
        ['Token','Action','Output','Operator Stack'].forEach (function (header) {
            var cell = document.createElement('th');
            cell.appendChild(document.createTextNode(header));
            shuntingTableHeader.appendChild(cell);
        });
        shuntingTableBody.appendChild(shuntingTableHeader);
        var printTokenMatchList = function (tokenList) {
            var str = '';
            tokenList.forEach(function (token) {
                str += ', ' + token['match'];
            });
            return str.substring(2);
        };

        parseLog['entries'].forEach(function (entry) {
            var tableRow = document.createElement('tr');
           if(entry['row span'] > 0) {
                var tokenCell = document.createElement('td');
                if(entry['row span'] > 1) {
                    tokenCell.setAttribute('rowspan', entry['row span']);
                }
                tokenCell.appendChild(document.createTextNode(entry['token']));
                tableRow.appendChild(tokenCell);
            }

            var actionCell = document.createElement('td');
            actionCell.appendChild(document.createTextNode(entry['action']));
            tableRow.appendChild(actionCell);

            var outputCell = document.createElement('td');
            outputCell.appendChild(document.createTextNode(printTokenMatchList(entry['output'])));
            tableRow.appendChild(outputCell);

            var stackCell = document.createElement('td');
            stackCell.appendChild(document.createTextNode(printTokenMatchList(entry['stack'])));
            tableRow.appendChild(stackCell);

            shuntingTableBody.appendChild(tableRow);
        });

        shuntingTable.appendChild(shuntingTableBody);
        outputDiv.appendChild(shuntingTable);

        /* Print the RPN. */
        var rpnDiv = document.createElement('div');
        rpnDiv.setAttribute('id','rpnDiv');
        var rpnLabelSpan = document.createElement('span');
        rpnLabelSpan.appendChild(document.createTextNode('Postfix: '));
        rpnDiv.appendChild(rpnLabelSpan);
        var rpnSpan = document.createElement('span');
        rpnSpan.setAttribute('class','result');
        rpnSpan.appendChild(document.createTextNode(printTokenMatchList(postfixResult)));
        rpnDiv.appendChild(rpnSpan);
        outputDiv.appendChild(rpnDiv);


        /* Evaluate the expression. */
        var evaluationLog = {};
        try {
            var result = postfix.evaluateStack(postfixResult, evaluationLog);
        } catch(err) {
            makeErrorDiv('Could not evaluate: ' + err);
            return;
        }

        var printTokenValueList = function (tokenList) {
            var str = '';
            tokenList.forEach(function (token) {
                str += ', ' + token['value'];
            });
            return str.substring(2);
        };



        var make_table = function(entries, descriptors) {
            var table = document.createElement('table');
            var tbody = document.createElement('tbody');

            table.setAttribute('id','table');
            table.setAttribute('class','wikitable');

            var headerRow = document.createElement('tr');

            descriptors.forEach(function (descriptor) {
                //['Token','Action','Stack'].forEach (function (header) {
                var header = descriptor['header'];

                var cell = document.createElement('th');
                cell.appendChild(document.createTextNode(header));
                headerRow.appendChild(cell);
            });
            tbody.appendChild(headerRow);

            var previous_tds = new Array(descriptors.length);
            var previous_rowspans = new Array(descriptors.length);
            var previous_identifiers = new Array(descriptors.length);
            previous_rowspans.fill(0);


            entries.forEach(function (entry) {
                var row = document.createElement('tr');
                descriptors.forEach(function (descriptor,index) {
                    var identifier = descriptor['identifier'](entry, index);
                    if(identifier != previous_identifiers[index]) {
                        var contents = descriptor['contents'](entry);

                        var cell = document.createElement('td');
                        cell.appendChild(contents);
                        row.appendChild(cell);

                        if(previous_tds[index]) {
                            previous_tds[index].setAttribute('rowspan',previous_rowspans[index]);
                        }
                        previous_tds[index] = cell;
                        previous_rowspans[index] = 1;
                        previous_identifiers[index] = identifier;
                    } else {
                        previous_rowspans[index]++;
                    }
                });
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            return table;
        };
        
        var evaluationTable = make_table(
            evaluationLog['entries'],
            [
                /* The token cell. */
                {
                    'header': 'Token',
                    'identifier': function(entry,index) {
                        return entry['token'];
                    },
                    'contents': function(entry) {
                        return document.createTextNode(entry['token']['match']);
                    }
                },
                /* The action cell. */
                {
                    'header': 'Action',
                    'identifier': function(entry,index) {
                        return [entry['action'],entry['token']];
                    },
                    'contents': function(entry) {
                        return document.createTextNode(entry['action']);
                    }
                },
                /* The stack cell. */
                {
                    'header': 'Stack',
                    'identifier': function(entry,index) {
                        return entry['stack'];
                    },
                    'contents': function(entry) {
                        return document.createTextNode(printTokenValueList(entry['stack']));
                    }
                },
            ]);
        outputDiv.appendChild(evaluationTable);

        /*
        var evaluationTable = document.createElement('table');
        var evaluationTableBody = document.createElement('tbody');
        evaluationTable.setAttribute('id','evaluationTable');
        evaluationTable.setAttribute('class','wikitable');
        var evaluationTableHeader = document.createElement('tr');
        ['Token','Action','Stack'].forEach (function (header) {
            var cell = document.createElement('th');
            cell.appendChild(document.createTextNode(header));
            evaluationTableHeader.appendChild(cell);
        });

        evaluationTableBody.appendChild(evaluationTableHeader);
        evaluationLog['entries'].forEach(function (entry) {
            var tableRow = document.createElement('tr');
            forEach(function (handler) {
                var cell = document.createElement('td');
                var text = handler['contents'](entry);
                cell.appendChild(document.createTextNode(text));
                tableRow.appendChild(cell);
            });

            if(entry['row span'] > 0) {
                var tokenCell = document.createElement('td');
                if(entry['row span'] > 1) {
                    tokenCell.setAttribute('rowspan', entry['row span']);
                }
                tokenCell.appendChild(document.createTextNode(entry['token']['match']));
                tableRow.appendChild(tokenCell);
            }

            var actionCell = document.createElement('td');
            actionCell.appendChild(document.createTextNode(entry['action']));
            tableRow.appendChild(actionCell);

            var stackCell = document.createElement('td');
            stackCell.appendChild(document.createTextNode(printTokenValueList(entry['stack'])));
            tableRow.appendChild(stackCell);

            evaluationTableBody.appendChild(tableRow);
        });
        evaluationTable.appendChild(evaluationTableBody);
        outputDiv.appendChild(evaluationTable);
        */


        /* Print the result. */
        var resultDiv = document.createElement('div');
        resultDiv.setAttribute('id','resultDiv');
        var resultLabelSpan = document.createElement('span');
        resultLabelSpan.appendChild(document.createTextNode('Result: '));
        resultDiv.appendChild(resultLabelSpan);
        var resultSpan = document.createElement('span');
        resultSpan.setAttribute('class','result');
        resultSpan.appendChild(document.createTextNode(result));
        resultDiv.appendChild(resultSpan);
        outputDiv.appendChild(resultDiv);
    };
    parseButton.onclick = function(event) {
        doParse(this['grammar-data']);
        parsed = true;
        event.preventDefault();
    };
    parseButton['grammar-data'] = grammar;

    inputField.onkeyup = function (event) {
        if(event.keyCode == 13) {
            event.preventDefault();
            doParse(this['grammar-data']);
            parsed = true;
        };
    };
    inputField['grammar-data'] = grammar;
};
