/* postfix.js */

'use strict';

/* Lexical tokens */
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

/**
 * Deep compare two arrays for equality.
 */
var arrays_equal = function(a,b) {
    if(a instanceof Array && b instanceof Array) {
        if(a.length != b.length) {
            return false;
        }
        for(var i=0;i<a.length;i++) {
            if(!arrays_equal(a[i], b[i])) {
                return false;
            }
        }
        return true;
    } else {
        return a == b;
    }
};

if(!Object.prototype.clone) {
    /**
     * Deep copy an Object and return the copy.
     */
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

        var appendLog = function(token, action,notes) {
            /* Construct an entry. */
            var entry = {
                'action': action,
                'token': token,
                'output': output.slice(0),
                'stack': stack.slice(0),
            };
            if(notes) {
                entry['notes'] = notes;
            }
            /* Advance the group if the token is new, otherwise update the head 
             * and set the current row span to zero. */
            log['entries'].push(entry);
        };
    } else {
        /* Ignore the log. */
        var appendLog = function(token, action,notes) {};
    }
    /* The shunting yard algorithm. */
    tokens.forEach(function (tok,index) {
        var token = tok.clone();
        token['index'] = index;
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
    var endToken = {'match': ''};
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

/**
 * Evaluate a postfix list.
 */
PostfixParser.prototype.evaluate = function(tokens, log) {
    var g = function (token) {
        return this.grammar[token['token']];
    }
    g = g.bind(this);


    /* Start with empty stack. */
    var stack = [];
    if(log) {
        /* Start with an empty log. */
        log['entries'] = [];
        var appendLog = function(token, action,notes) {
            var entry = {
                'action': action,
                'token': token,
                'stack': stack.slice(0)
            };
            if(notes) {
                entry['notes'] = notes;
            }
            log['entries'].push(entry);
        };
    } else {
        /* Don't do anything to the log. */
        var appendLog = function() {};
    }
    /* Execute an operator. */
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
            /* Parse the token value. */
            if(token['token'] == 'INTEGER') {
                token['value'] = parseInt(token['match'])
            } else if(token['token'] == 'REAL') {
                token['value'] = parseFloat(token['match'])
            }

            stack.push(token);
            appendLog(token, 'Push value onto stack');
        } else if(g(token)['type'] == 'OPERATOR') {
            /* Pop two elements from the stack, perform the operation, and push the result back. */
            if(stack.length < 2) {
                throw 'Invalid input';
            }

            var o2 = stack.pop();
            appendLog(token, 'Pop value from stack', 'Operand: ' + o2['value']);

            var o1 = stack.pop();
            appendLog(token, 'Pop value from stack', 'Operand: ' + o1['value']);

            var d = {
                'value': op(o1['value'], o2['value'], token['token'])
            };

            stack.push(d);
            appendLog(token, 'Push result onto stack', 'Operation: ' + o1['value'] + ' ' + token['match'] + ' ' + o2['value'] + ' = ' + d['value']);
        }
    });
    /* There should only be a single item in the stack. */
    if(stack.length != 1) {
        throw 'Invalid input';
    }
    return stack.pop()['value'];
};

window.onload = function () {
    var inputField = document.getElementById('inputField');
    var parseButton = document.getElementById('parseButton');
    var outputDiv = document.getElementById('outputDiv');


    /**
     * Make an HTML table. The id is the DOM id, the entries are the unfiltered
     * rows of the list, and filter filters those entries.
     */
    var make_table = function(id, entries, descriptors, filter) {
        var table = document.createElement('table');
        var tbody = document.createElement('tbody');

        table.id = id;
        table.classList.add('wikitable');

        /* Create the header row. */
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        descriptors.forEach(function (descriptor) {
            var header = descriptor['header'];

            var cell = document.createElement('th');
            cell.appendChild(document.createTextNode(header));
            headerRow.appendChild(cell);
        });
        thead.appendChild(headerRow);

        table.appendChild(thead);

        /* Keep track of the previous cell. If successive cells in a column are essentially identical
         * then we can merge them by increasing the row span and omitting the subsequent <td> elements. */
        var previous_tds = new Array(descriptors.length);
        var previous_rowspans = new Array(descriptors.length);
        var previous_identifiers = new Array(descriptors.length);
        previous_rowspans.fill(0);

        /* Make a row element from an entry and entries' key. */
        var make_row = function (entry,key) {
            var row = document.createElement('tr');

            /* Make a cell for each descriptor. */
            descriptors.forEach(function (descriptor,index) {
                var identifier = descriptor['identifier'](entry, index,key);

                if(!arrays_equal(identifier, previous_identifiers[index])) {
                    /* This cell is not essentially identical to the previous one. Construct a new cell.
                     * First construct the contents of the cell from the entry. */
                    var contents = descriptor['contents'](entry,index,key);

                    var cell = document.createElement('td');
                    cell.appendChild(contents);
                    row.appendChild(cell);

                    /* Update the previous cell information. */
                    if(previous_tds[index] && previous_rowspans[index] > 1) {
                        /* Set the rowspan of the previous <td> if that element exists and the rowspan is greater than one. */
                        previous_tds[index].rowSpan = previous_rowspans[index];
                    }
                    previous_tds[index] = cell;
                    previous_rowspans[index] = 1;
                    previous_identifiers[index] = identifier;
                } else {
                    /* This cell is essentially identical to the previous one. Do not construct a new
                     * cell and update the rowspan for the current group of column cells. */
                    previous_rowspans[index]++;
                }
                if(previous_tds[index] && previous_rowspans[index] > 1) {
                    /* Update the rowspan for the last group. */
                    previous_tds[index].rowSpan = previous_rowspans[index];
                }
            });
            /* Add the <tr> to the table body. */
            tbody.appendChild(row);
        };

        /* Make the rows. */
        if(entries instanceof Array) {
            if(!filter) {
                /* Use the trivial filter. */
                filter = function() { return true; }
            }
            entries.filter(filter).forEach(make_row);
        } else {
            for(var key in entries) {
                if(!filter || filter(entries[key])) {
                    make_row(entries[key],key);
                }
            }
        }

        table.appendChild(tbody);

        return table;
    };


    /**
     * Give a table a caption.
     */
    var caption_table = function(table_element, caption) {
        var caption_element = document.createElement('caption');
        caption_element.appendChild(document.createTextNode(caption));

        /* The <caption> element must be the first element of the <table> element. */
        if(table_element.firstChild) {
            table_element.insertBefore(caption_element, table_element.firstChild);
        } else {
            table_element.appendChild(caption_element);
        }
    };

    /* Make the operator table. */
    var buildOperatorTable = function(grammar) {
        if(document.getElementById('operator-table') != null) {
            operatorTableDiv.removeChild(document.getElementById('operator-table'));
        }

        var operatorTable = make_table(
            'operator-table',
            grammar,
            [
                /* The name cell. */
                {
                    'header': 'Operator',
                    'identifier': function(operator, index) {
                        return operator;
                    },
                    'contents': function(operator) {
                        return document.createTextNode(operator['name']);
                    }
                },
                /* The associativity cell. */
                {
                    'header': 'Associativity',
                    'identifier': function(operator, index) {
                        return operator;
                    },
                    'contents': function(operator,index,operatorKey) {
                        var select_element = document.createElement('select');

                        var defaultAssociativity = operator['associativity'];
                        select_element['operator-data'] = {
                            'key': operatorKey,
                            'value': operator,
                        };
                        /* Create the associativity <select> options. */
                        [
                            {'text':'Left','name':'LEFT'},
                            {'text':'Right','name':'RIGHT'}
                        ].forEach(function (descriptor,index) {
                            var option_element = document.createElement('option');

                            option_element.value = descriptor['name'];

                            option_element.appendChild(document.createTextNode(descriptor['text']));

                            /* If the current option is the default then select it. */
                            if(defaultAssociativity == descriptor['name']) {
                                option_element.selected = true;
                            }
                            select_element.add(option_element);
                        });
                        /* Handle changes. Change the grammar and redo a parse. */
                        var handler = function() {
                            var operator_data = this['operator-data'];
                            operator_data['value']['associativity'] = this.value.toString();
                            if(parsed) {
                                doParse(grammar);
                            }
                        };
                        select_element.onchange = handler;

                        return select_element;
                    }
                },
                /* The precedence cell. */
                {
                    'header': 'Precedence',
                    'identifier': function(operator, index) {
                        return operator;
                    },
                    'contents': function(operator,index,operatorKey) {
                        var defaultPrecedence = operator['precedence'];
                        var number_element = document.createElement('input');

                        number_element.type = 'number';
                        number_element.value = defaultPrecedence.toString();

                        /* Set the extreme precedences. */
                        number_element.min = 0;
                        number_element.max = 11;


                        /* Handle a change. Change the grammar and redo a parse. */
                        var handler = function() {
                            var operator_data = this['operator-data'];
                            operator_data['value']['precedence'] = this.value.toString();
                            if(parsed) {
                                doParse(grammar);
                            }
                        };
                        number_element.onchange = handler;
                        number_element['operator-data'] = {
                            'key': operatorKey,
                            'value': operator
                        }

                        return number_element;
                    }
                }

            ],
            function (token) {
                return token['type'] == 'OPERATOR';
            }
        );
        caption_table(operatorTable, 'Operators');
        operatorTableDiv.appendChild(operatorTable);
    };
    var grammar = GRAMMAR.clone();
    var parsed = false;
    buildOperatorTable(grammar);

    /* Parse and generate tables. */
    var doParse = function (grammar) {
        /* Remove previous elements. */
        ['shunting-table','rpn-div','evaluation-table','result-div','error-div'].forEach(function (id) {
            if(document.getElementById(id) != null) {
                outputDiv.removeChild(document.getElementById(id));
            }
        }); 

        /* Make a big error indicator. */
        var makeErrorDiv = function (errorText) {
            var errorDiv = document.createElement('div');
            errorDiv.id = 'error-div';
            errorDiv.classList.add('error');
            errorDiv.appendChild(document.createTextNode(errorText));
            outputDiv.appendChild(errorDiv);
        };


        var lexer = new Lexer(TOKENS);

        /* Produce a list of tokens. */
        try {
            var lexResult = lexer.lex(inputField.value);
        } catch(err) {
            makeErrorDiv('Could not lex: '+ err);
            return;
        }

        var postfixParser = new PostfixParser(grammar);

        /* Turn juxtapositions into multiplications. */
        postfixParser.juxtaposeMultiply(lexResult,
            {
                'token': 'JTIMES',
                'match': '.'
            });

        /* Produce a postfix list. */
        var parseLog = {};
        try {
            var postfixResult = postfixParser.parse(lexResult, parseLog);
        } catch(err) {
            makeErrorDiv('Could not parse: ' + err);
            return;
        }

        /**
         * Enclose an element in a <div> and return the <div>.
         */
        var enclose_in_div = function(element, style_class) {
            var div = document.createElement('div');
            div.classList.add(style_class);
            div.appendChild(element);
            return div;
        };

        /**
         * Make a string of elements.
         */
        var make_item_list = function (item_list) {
            var list_div = document.createElement('span');
            list_div.classList.add('item-list');

            item_list.forEach(function (item) {
                var item_div = document.createElement('div');
                item_div.appendChild(document.createTextNode(item));
                list_div.appendChild(item_div);
            });

            return list_div;
        };

        /* Make the shunting yard log table. */
        var shuntingTable = make_table(
            'shunting-table',
            parseLog['entries'],
            [
                /* The token cell. */
                {
                    'header': 'Token',
                    'identifier': function(entry,index,key) {
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
                        return [entry['token'],entry['action']];
                    },
                    'contents': function(entry) {
                        return document.createTextNode(entry['action']);
                    }
                },
                /* The output cell. */
                {
                    'header': 'Output',
                    'identifier': function(entry,index) {
                        return entry['output'];
                    },
                    'contents': function(entry) {
                        return enclose_in_div(make_item_list(
                                    entry['output'].map(function(token) { 
                                        return token['match'] 
                                    })
                                ),'item-list');
                    }
                },
                /* The stack cell. */
                {
                    'header': 'Stack',
                    'identifier': function(entry,index) {
                        return entry['stack'];
                    },
                    'contents': function(entry) {
                        return enclose_in_div(make_item_list(
                                    entry['stack'].map(function(token) { 
                                        return token['match'] 
                                    })
                                ),'item-list');
                    }
                },
                /* The notes cell. */
                {
                    'header': 'Notes',
                    'identifier': function(entry,index) {
                        return 'notes' in entry ? entry['notes'] : null;
                    },
                    'contents': function(entry) {
                        return document.createTextNode('notes' in entry ? entry['notes'] : '');
                    }
                }
            ]);
        caption_table(shuntingTable, 'Shunting Yard Algorithm');
        shuntingTable.classList.add('displays');
        outputDiv.appendChild(shuntingTable);

        /* Make a label in front of the given element. */
        var make_labeled_element = function(label, element) {
            var div = document.createElement('div');


            var label_span = document.createElement('span');
            label_span.appendChild(document.createTextNode(label));
            div.appendChild(label_span);

            var span = document.createElement('span');

            span.appendChild(element);
            div.appendChild(span);

            return div;
        };

        /* Print the RPN. */
        var rpn_div = make_labeled_element('Postfix:', 
                make_item_list(
                     postfixResult.map(function(token) { 
                        return token['match'];
                    })
                )
            );
        rpn_div.id = 'rpn-div';
        rpn_div.classList.add('result');
        rpn_div.classList.add('displays');
        outputDiv.appendChild(rpn_div);


        /* Evaluate the expression. */
        var evaluationLog = {};
        try {
            var result = postfixParser.evaluate(postfixResult, evaluationLog);
        } catch(err) {
            makeErrorDiv('Could not evaluate: ' + err);
            return;
        }

        /* Make the evaluation log table. */
        var evaluationTable = make_table(
            'evaluation-table',
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
                        return entry['action'];
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
                        return enclose_in_div(make_item_list(
                                    entry['stack'].map(function(token) { 
                                        return token['value']; 
                                    })
                                ),'item-list');
                    }
                },
                /* The notes cell. */
                {
                    'header': 'Notes',
                    'identifier': function(entry,index) {
                        return 'notes' in entry ? entry : null;
                    },
                    'contents': function(entry) {
                        return document.createTextNode('notes' in entry ? entry['notes'] : '');
                    }

                }
            ]);
        caption_table(evaluationTable, 'Postfix Evaluation');
        evaluationTable.classList.add('displays');
        outputDiv.appendChild(evaluationTable);

        /* Print the result. */
        var result_div = make_labeled_element('Result:', document.createTextNode(result));
        result_div.id = 'result-div';
        result_div.classList.add('result');
        result_div.classList.add('displays');
        outputDiv.appendChild(result_div);

    };

    /* Handle the parse button clicks. */
    parseButton.onclick = function(event) {
        doParse(this['grammar-data']);
        parsed = true;
        event.preventDefault();
    };
    parseButton['grammar-data'] = grammar;

    /* Handle the enter key on the input field. */
    inputField.onkeyup = function (event) {
        if(event.keyCode == 13) {
            event.preventDefault();
            doParse(this['grammar-data']);
            parsed = true;
        };
    };
    inputField['grammar-data'] = grammar;
};
